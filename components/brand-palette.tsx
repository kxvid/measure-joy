"use client";

import { useState } from "react";

const colors = [
  { name: "Ivory", hex: "#F4F1E8", note: "A little breathing room." },
  { name: "Ink", hex: "#191919", note: "Keeps us grounded." },
  { name: "Coral", hex: "#FF5439", note: "The life of the party." },
  { name: "Acid yellow", hex: "#DAFF4F", note: "A flash of good energy." },
  { name: "Silver", hex: "#C7C9CF", note: "A nod to the hardware." },
];

export default function BrandPalette() {
  const [message, setMessage] = useState(
    "Select a swatch to copy its hex code.",
  );
  const [copied, setCopied] = useState<string | null>(null);
  async function copy(name: string, hex: string) {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(hex);
      setCopied(hex);
      setMessage(`${name}: ${hex} copied to clipboard.`);
    } catch {
      setCopied(null);
      setMessage(`Copy ${name} manually: ${hex}.`);
    }
  }
  return (
    <>
      <div className="brand-palette">
        {colors.map(({ name, hex, note }) => (
          <button
            className={`brand-swatch ${name === "Ink" ? "brand-swatch-dark" : ""}`}
            style={{ backgroundColor: hex }}
            onClick={() => copy(name, hex)}
            key={name}
            aria-label={`Copy ${name} hex code ${hex}`}
          >
            <span className="brand-swatch-top">
              <span>{name}</span>
              <span aria-hidden="true">{copied === hex ? "✓" : "↗"}</span>
            </span>
            <span className="brand-swatch-bottom">
              <strong>{hex}</strong>
              <span>{note}</span>
            </span>
          </button>
        ))}
      </div>
      <p className="brand-copy-status" role="status" aria-live="polite">
        {message}
      </p>
    </>
  );
}
