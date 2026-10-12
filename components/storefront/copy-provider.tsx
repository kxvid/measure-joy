"use client";
import { createContext, useContext, type ReactNode } from "react";
import { storefrontDefaults, type StorefrontCopy } from "@/lib/storefront-copy";
const CopyContext = createContext<StorefrontCopy>(storefrontDefaults);
export function StorefrontCopyProvider({
  copy,
  children,
}: {
  copy: StorefrontCopy;
  children: ReactNode;
}) {
  return <CopyContext.Provider value={copy}>{children}</CopyContext.Provider>;
}
export function useStorefrontCopy() {
  return useContext(CopyContext);
}
