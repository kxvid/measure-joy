import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Camera Collections | Measure Joy",
  description:
    "Find your kind of camera. Explore curated vintage digital camera collections from Canon, Sony, Nikon, Fujifilm, Olympus and Panasonic.",
  alternates: { canonical: "/collections" },
};

export default function CollectionsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
