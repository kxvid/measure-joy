import type { ReactNode } from "react";
import { SiteHeader, SiteFooter } from "./site-chrome";
import "./commerce.css";

export function CommerceShell({ children }: { children: ReactNode }) {
  return (
    <div className="storefront mj-commerce">
      <SiteHeader />
      <main id="main-content">{children}</main>
      <SiteFooter />
    </div>
  );
}
