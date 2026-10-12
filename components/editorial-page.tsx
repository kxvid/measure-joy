import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import "./editorial-pages.css";

export function EditorialPage({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`storefront editorial-site ${className}`}>
      <Header />
      <main id="main-content" className="ed-page">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export function EditorialHeading({
  label,
  title,
  description,
  children,
}: {
  label: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <header className="ed-heading">
      <p className="ed-label">{label}</p>
      <div className="ed-heading-row">
        <h1>{title}</h1>
        {description && <p className="ed-deck">{description}</p>}
      </div>
      {children}
    </header>
  );
}

export function EditorialBackLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link className="ed-back" href={href}>
      <ArrowLeft size={16} />
      {children}
    </Link>
  );
}

const policyLinks = [
  { href: "/shipping", label: "Shipping information" },
  { href: "/returns", label: "Returns & warranty" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms of service" },
];

export function PolicyPage({
  title,
  path,
  updated,
  children,
}: {
  title: string;
  path: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <EditorialPage>
      <EditorialHeading label="A little clarity" title={title}>
        {updated && <p className="ed-updated">Last updated: {updated}</p>}
      </EditorialHeading>
      <div className="ed-policy-layout">
        <aside className="ed-policy-aside">
          <nav aria-label="Customer information">
            {policyLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={path === link.href ? "page" : undefined}
              >
                {link.label}
                <ArrowUpRight size={15} />
              </Link>
            ))}
          </nav>
          <div className="ed-help-note">
            <span aria-hidden="true">✳</span>
            <p>
              A little help
              <br />
              goes a long way.
            </p>
            <Link href="/contact">
              Talk to the workshop <ArrowUpRight size={15} />
            </Link>
          </div>
        </aside>
        <div className="ed-policy-content">{children}</div>
      </div>
    </EditorialPage>
  );
}
