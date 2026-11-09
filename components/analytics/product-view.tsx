"use client";
import { useEffect, useRef } from "react";
import { commerceEvent, trackCommerce } from "@/lib/analytics";
export function ProductView({
  id,
  priceInCents,
}: {
  id: string;
  priceInCents: number;
}) {
  const sent = useRef<string | null>(null);
  useEffect(() => {
    function record() {
      if (sent.current === id) return;
      if (
        trackCommerce(
          "view_item",
          commerceEvent([{ product: { id, priceInCents }, quantity: 1 }]),
        )
      )
        sent.current = id;
    }
    window.addEventListener("measurejoy:analytics-ready", record);
    record();
    return () =>
      window.removeEventListener("measurejoy:analytics-ready", record);
  }, [id, priceInCents]);
  return null;
}
