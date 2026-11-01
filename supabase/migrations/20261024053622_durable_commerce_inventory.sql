-- Stripe remains the product, price and stock authority. These tables contain
-- in-flight reservations and a durable side-effect ledger, not a stock catalog.
-- Cutover gate: enable only after old unreserved sessions and old workers have
-- been reconciled. This protects the deployment interval itself.
create table public.commerce_control (
  id boolean primary key default true check (id),
  checkout_enabled boolean not null default false
);
insert into public.commerce_control(id,checkout_enabled) values(true,false);
create table public.commerce_checkouts (
  id text primary key,
  session_id text unique,
  state text not null default 'reserved' check (state in ('reserved','open','pending','fulfilled','released')),
  session_params jsonb,
  capability_hash text check (capability_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  confirmation_started_at timestamptz,
  confirmation_sent boolean not null default false
);
create table public.commerce_checkout_items (
  checkout_id text not null references public.commerce_checkouts(id),
  product_id text not null,
  quantity bigint not null check (quantity between 1 and 9007199254740991),
  state text not null default 'held' check (state in ('held','applied','released')),
  primary key (checkout_id, product_id)
);
create index commerce_held_items on public.commerce_checkout_items(product_id) where state = 'held';
create table public.commerce_inventory (
  product_id text primary key,
  revision bigint not null default 0,
  pending_operation text
);
create table public.commerce_stock_operations (
  id text primary key,
  product_id text not null references public.commerce_inventory(product_id),
  checkout_id text references public.commerce_checkouts(id),
  metadata jsonb not null,
  state text not null default 'pending' check (state in ('pending','applied')),
  created_at timestamptz not null default now(),
  applied_at timestamptz
);
-- Deliberately no TTL/lease that can release an ambiguous external write.
create unique index commerce_one_pending_stock_write on public.commerce_stock_operations(product_id) where state = 'pending';

alter table public.commerce_control enable row level security;
alter table public.commerce_checkouts enable row level security;
alter table public.commerce_checkout_items enable row level security;
alter table public.commerce_inventory enable row level security;
alter table public.commerce_stock_operations enable row level security;
revoke all on public.commerce_control, public.commerce_checkouts, public.commerce_checkout_items, public.commerce_inventory, public.commerce_stock_operations from public, anon, authenticated;
grant select, update on public.commerce_control to service_role;
grant select, insert, update, delete on public.commerce_checkouts, public.commerce_checkout_items, public.commerce_inventory, public.commerce_stock_operations to service_role;

create function public.commerce_inventory_snapshot(p_products text[]) returns jsonb
language plpgsql security invoker set search_path = '' as $$
begin
  insert into public.commerce_inventory(product_id) select distinct unnest(p_products) on conflict do nothing;
  return (select coalesce(jsonb_agg(jsonb_build_object('productId', i.product_id, 'revision', i.revision, 'operation', to_jsonb(o))), '[]'::jsonb)
    from public.commerce_inventory i left join public.commerce_stock_operations o on o.id = i.pending_operation
    where i.product_id = any(p_products));
end $$;

create function public.commerce_reserve_checkout(p_id text, p_items jsonb, p_params jsonb, p_capability_hash text default null) returns void
language plpgsql security invoker set search_path = '' as $$
declare item jsonb; inv public.commerce_inventory; held numeric; stock bigint;
begin
  perform 1 from public.commerce_control where id=true and checkout_enabled for share;
  if not found then raise exception 'Checkout is temporarily paused. Please try again shortly.'; end if;
  if jsonb_array_length(p_items) not between 1 and 20 then raise exception 'Invalid reservation items'; end if;
  -- All multi-product paths use this lock order to avoid deadlocks.
  perform 1 from public.commerce_inventory where product_id in (select value->>'productId' from jsonb_array_elements(p_items)) order by product_id for update;
  for item in select value from jsonb_array_elements(p_items) loop
    select * into strict inv from public.commerce_inventory where product_id = item->>'productId';
    if inv.pending_operation is not null or inv.revision <> (item->>'revision')::bigint then raise exception 'Inventory changed; please retry checkout'; end if;
    stock := (item->>'stock')::bigint;
    select coalesce(sum(quantity),0) into held from public.commerce_checkout_items where product_id = inv.product_id and state = 'held';
    if stock is not null and (stock < 0 or held + (item->>'quantity')::bigint > stock) then raise exception 'This item is reserved or out of stock. Please try again later.'; end if;
  end loop;
  insert into public.commerce_checkouts(id, session_params, capability_hash, expires_at) values(p_id, p_params, p_capability_hash, to_timestamp((p_params->>'expires_at')::double precision));
  insert into public.commerce_checkout_items(checkout_id,product_id,quantity)
    select p_id, value->>'productId', (value->>'quantity')::bigint from jsonb_array_elements(p_items);
end $$;

-- Adopt old paid sessions through the same lock and ledger. Old sessions already
-- marked fulfilled (or per-item done) are imported without decrementing again.
create function public.commerce_adopt_checkout(p_id text, p_session_id text, p_items jsonb) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  insert into public.commerce_inventory(product_id) select distinct value->>'productId' from jsonb_array_elements(p_items) on conflict do nothing;
  perform 1 from public.commerce_inventory where product_id in (select value->>'productId' from jsonb_array_elements(p_items)) order by product_id for update;
  insert into public.commerce_checkouts(id,session_id,state) values(p_id,p_session_id,'pending') on conflict (id) do nothing;
  if not exists(select 1 from public.commerce_checkouts where id=p_id and session_id=p_session_id) then raise exception 'Checkout identity mismatch'; end if;
  insert into public.commerce_checkout_items(checkout_id,product_id,quantity,state)
    select p_id, value->>'productId', (value->>'quantity')::bigint, case when (value->>'applied')::boolean then 'applied' else 'held' end from jsonb_array_elements(p_items)
    on conflict do nothing;
end $$;

create function public.commerce_bind_checkout(p_id text, p_session_id text, p_state text) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if p_state not in ('open','pending') then raise exception 'Invalid checkout state'; end if;
  update public.commerce_checkouts set session_id = p_session_id, state = case when state in ('fulfilled','released') then state else p_state end
    where id=p_id and (session_id is null or session_id=p_session_id);
  if not found then raise exception 'Checkout reservation is missing or bound to another session'; end if;
end $$;

create function public.commerce_begin_stock_operation(p_id text, p_product_id text, p_checkout_id text, p_revision bigint, p_stock bigint, p_metadata jsonb) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare inv public.commerce_inventory; op public.commerce_stock_operations; item public.commerce_checkout_items; patch jsonb; target bigint;
begin
  select * into strict inv from public.commerce_inventory where product_id=p_product_id for update;
  select * into op from public.commerce_stock_operations where id=p_id;
  if found then
    if op.product_id <> p_product_id or op.checkout_id is distinct from p_checkout_id then raise exception 'Operation identity mismatch'; end if;
    return to_jsonb(op);
  end if;
  if inv.pending_operation is not null or inv.revision <> p_revision then raise exception 'Inventory changed; retry required'; end if;
  if p_checkout_id is not null then
    select * into strict item from public.commerce_checkout_items where checkout_id=p_checkout_id and product_id=p_product_id;
    if item.state='released' then raise exception 'Paid checkout has a released reservation; manual reconciliation required'; end if;
    if item.state='applied' then return jsonb_build_object('state','applied'); end if;
    if p_stock is not null and p_stock < item.quantity then raise exception 'Paid checkout exceeds current Stripe stock; manual reconciliation required'; end if;
    target := p_stock - item.quantity;
    patch := case when target is null then '{}'::jsonb else jsonb_build_object('stockCount',target::text) || case when target=0 then '{"inStock":"false"}'::jsonb else '{}'::jsonb end end;
  else
    if exists(select 1 from public.commerce_checkout_items where product_id=p_product_id and state='held') then raise exception 'Product has checkout reservations; reconcile them before changing stock'; end if;
    patch := p_metadata;
  end if;
  insert into public.commerce_stock_operations(id,product_id,checkout_id,metadata) values(p_id,p_product_id,p_checkout_id,patch) returning * into op;
  update public.commerce_inventory set pending_operation=p_id where product_id=p_product_id;
  return to_jsonb(op);
end $$;

create function public.commerce_complete_stock_operation(p_id text) returns void
language plpgsql security invoker set search_path = '' as $$
declare op public.commerce_stock_operations;
begin
  select * into strict op from public.commerce_stock_operations where id=p_id;
  perform 1 from public.commerce_inventory where product_id=op.product_id for update;
  select * into strict op from public.commerce_stock_operations where id=p_id;
  if op.state='applied' then return; end if;
  if not exists(select 1 from public.commerce_inventory where product_id=op.product_id and pending_operation=p_id) then raise exception 'Pending operation mismatch'; end if;
  update public.commerce_stock_operations set state='applied',applied_at=now() where id=p_id;
  update public.commerce_checkout_items set state='applied' where checkout_id=op.checkout_id and product_id=op.product_id;
  update public.commerce_inventory set pending_operation=null,revision=revision+1 where product_id=op.product_id;
end $$;

create function public.commerce_release_checkout(p_id text) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  -- Caller must first retrieve Stripe and confirm expiration or terminal payment failure.
  perform 1 from public.commerce_inventory where product_id in (select product_id from public.commerce_checkout_items where checkout_id=p_id) order by product_id for update;
  if exists(select 1 from public.commerce_stock_operations where checkout_id=p_id and state='pending') then raise exception 'Cannot release a checkout with an uncertain stock write'; end if;
  update public.commerce_checkout_items set state='released' where checkout_id=p_id and state='held';
  update public.commerce_checkouts set state='released' where id=p_id and state <> 'fulfilled';
end $$;

create function public.commerce_finish_checkout(p_id text) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if exists(select 1 from public.commerce_checkout_items where checkout_id=p_id and state <> 'applied') then raise exception 'Checkout inventory is not fulfilled'; end if;
  update public.commerce_checkouts set state='fulfilled' where id=p_id and state <> 'released';
  if not found then raise exception 'Checkout is missing or released'; end if;
end $$;

create function public.commerce_confirmation(p_id text, p_sent boolean default false) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare c public.commerce_checkouts;
begin
  select * into strict c from public.commerce_checkouts where id=p_id for update;
  if c.state <> 'fulfilled' then raise exception 'Inventory must be fulfilled before confirmation'; end if;
  if p_sent then update public.commerce_checkouts set confirmation_sent=true where id=p_id; return '{"action":"done"}'::jsonb; end if;
  if c.confirmation_sent then return '{"action":"done"}'::jsonb; end if;
  if c.confirmation_started_at < now()-interval '23 hours' then raise exception 'Email delivery outcome needs manual reconciliation'; end if;
  update public.commerce_checkouts set confirmation_started_at=coalesce(confirmation_started_at,now()) where id=p_id;
  return '{"action":"send"}'::jsonb;
end $$;

-- PostgreSQL grants new functions to PUBLIC by default; only the trusted server
-- role can call these SECURITY INVOKER RPCs. No browser RLS policies are added.
revoke all on function public.commerce_inventory_snapshot(text[]), public.commerce_reserve_checkout(text,jsonb,jsonb,text), public.commerce_adopt_checkout(text,text,jsonb), public.commerce_bind_checkout(text,text,text), public.commerce_begin_stock_operation(text,text,text,bigint,bigint,jsonb), public.commerce_complete_stock_operation(text), public.commerce_release_checkout(text), public.commerce_finish_checkout(text), public.commerce_confirmation(text,boolean) from public, anon, authenticated;
grant execute on function public.commerce_inventory_snapshot(text[]), public.commerce_reserve_checkout(text,jsonb,jsonb,text), public.commerce_adopt_checkout(text,text,jsonb), public.commerce_bind_checkout(text,text,text), public.commerce_begin_stock_operation(text,text,text,bigint,bigint,jsonb), public.commerce_complete_stock_operation(text), public.commerce_release_checkout(text), public.commerce_finish_checkout(text), public.commerce_confirmation(text,boolean) to service_role;
