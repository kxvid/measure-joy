import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Your Order",
  alternates: { canonical: "/checkout/return" },
  robots: { index: false, follow: false },
};
export default function OrderReturnLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
