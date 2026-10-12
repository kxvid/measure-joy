import { readSavedIds } from "@/components/storefront/catalog-filters";

type SavedSnapshot = {
  ids: string[];
  ready: boolean;
  loading: boolean;
  pendingIds: string[];
  error: string;
};
type SavedAdapter = {
  read: () => Promise<string[]>;
  write: (id: string, added: boolean, ids: string[]) => Promise<boolean>;
};
export type SavedToggleResult =
  | { success: true; added: boolean }
  | { success: false; error: string };
const EMPTY_SNAPSHOT: SavedSnapshot = {
  ids: [],
  ready: false,
  loading: true,
  pendingIds: [],
  error: "",
};

/** Each identity gets its own store, so late responses cannot replace another account's list. */
export function createSavedFindsStore(
  source: string | null,
  adapter: SavedAdapter,
) {
  let snapshot = EMPTY_SNAPSHOT;
  let loadVersion = 0;
  const listeners = new Set<() => void>();
  function publish(patch: Partial<SavedSnapshot>) {
    snapshot = { ...snapshot, ...patch };
    for (const listener of listeners) listener();
  }
  async function load() {
    if (!source || snapshot.pendingIds.length) return;
    const version = ++loadVersion;
    publish({ loading: true, error: "" });
    try {
      const ids = readSavedIds(await adapter.read());
      if (version === loadVersion)
        publish({ ids, ready: true, loading: false });
    } catch {
      if (version === loadVersion)
        publish({
          ready: false,
          loading: false,
          error: "We couldn't load your saved finds. Please try again.",
        });
    }
  }
  async function toggle(id: string): Promise<SavedToggleResult> {
    if (!source || !snapshot.ready || snapshot.loading)
      return {
        success: false,
        error: "Your saved finds are still loading. Please try again.",
      };
    if (snapshot.pendingIds.length)
      return {
        success: false,
        error: "Please wait for your last save to finish.",
      };
    if (!/^prod_[a-zA-Z0-9]+$/.test(id))
      return { success: false, error: "This camera could not be saved." };
    const added = !snapshot.ids.includes(id);
    if (added && snapshot.ids.length >= 100)
      return {
        success: false,
        error: "Your saved list is full. Remove a find before adding another.",
      };
    const ids = added
      ? [...snapshot.ids, id]
      : snapshot.ids.filter((item) => item !== id);
    publish({ pendingIds: [id], error: "" });
    try {
      if (!(await adapter.write(id, added, ids)))
        throw new Error("Save rejected");
      publish({ ids, pendingIds: [] });
      return { success: true, added };
    } catch {
      const error =
        "We couldn't confirm that change. Your saved list has not been updated here. Please try again.";
      publish({ pendingIds: [], error });
      return { success: false, error };
    }
  }
  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => EMPTY_SNAPSHOT,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    load,
    toggle,
    clearError: () => publish({ error: "" }),
  };
}
