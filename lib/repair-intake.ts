import { z } from "zod";

export const REPAIR_SERVICES = [
  {
    value: "cleaning-restoration",
    label: "Cleaning & restoration",
    description: "Care for an old favorite",
    group: "Camera care",
  },
  {
    value: "battery-charging",
    label: "Battery & charging",
    description: "Power and charging problems",
    group: "Camera care",
  },
  {
    value: "photo-recovery",
    label: "Photo recovery",
    description: "Ask about missing camera photos",
    group: "Camera care",
  },
  {
    value: "repair",
    label: "Other camera repair",
    description: "Lens, screen, flash & more",
    group: "Camera care",
  },
  {
    value: "trade-in",
    label: "Trade in my camera",
    description: "Ask about a possible trade-in",
    group: "Other requests",
  },
  {
    value: "rental-enquiry",
    label: "Party rental kit enquiry",
    description: "Explore dates and availability",
    group: "Other requests",
  },
  {
    value: "referral",
    label: "Something else",
    description: "Advice or a trusted shop referral",
    group: "Other requests",
  },
] as const;
// Older clients and existing records keep their original service values.
export const REPAIR_SERVICE_VALUES = [
  "repair", "restoration", "cleaning", "film-dev", "quote",
  "cleaning-restoration", "battery-charging", "photo-recovery",
  "trade-in", "rental-enquiry", "referral",
] as const;
export function repairNeedsCamera(service: string) {
  return service !== "rental-enquiry" && service !== "referral";
}
export const REPAIR_ISSUES = [
  "Won't turn on",
  "Lens stuck/jammed",
  "LCD screen issues",
  "Flash not working",
  "Battery problems",
  "Image quality issues",
  "Buttons not responding",
  "Memory card errors",
  "Cosmetic damage",
  "Other",
] as const;
export const CAMERA_BRANDS = [
  "Sony",
  "Canon",
  "Fujifilm",
  "Olympus",
  "Nikon",
  "Kodak",
  "Casio",
  "Panasonic",
  "Other",
];
export const REPAIR_STATUS_LABELS: Record<string, string> = {
  received: "Request saved",
  in_review: "Under review",
  awaiting_customer: "Awaiting your reply",
  in_progress: "In progress",
  completed: "Completed",
  closed: "Closed",
};
const singleLine = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .regex(/^[^\x00-\x1f\x7f]*$/, "Use a single line of text.");
const repairInputSchema = z
  .object({
    website: z.string().max(200).optional(),
    requestToken: z.string().uuid("Please refresh the form and try again."),
    service: z.enum(
      REPAIR_SERVICE_VALUES,
      { error: "Choose a service." },
    ),
    brand: singleLine(80),
    model: singleLine(120),
    issues: z
      .array(z.enum(REPAIR_ISSUES))
      .max(10)
      .transform((values) => [...new Set(values)].sort()),
    description: z
      .string()
      .trim()
      .min(10, "Please include at least 10 characters about your request.")
      .max(3000, "Keep details under 3,000 characters.")
      .refine(
        (value) => !value.includes("\0"),
        "Remove unsupported characters.",
      ),
    name: singleLine(100).pipe(z.string().min(2, "Enter your name.")),
    email: singleLine(254).pipe(
      z.string().email("Enter a valid email address."),
    ),
    phone: singleLine(40).refine(
      (value) => !value || /^[+\d\s().-]{7,40}$/.test(value),
      "Enter a valid phone number.",
    ),
    preferredContact: z.enum(["email", "phone"]),
    consent: z.literal(true, {
      error:
        "Please consent to sharing your contact and camera details for this request.",
    }),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (repairNeedsCamera(value.service)) {
      for (const key of ["brand", "model"] as const) {
        if (!value[key]) ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: key === "brand" ? "Enter your camera brand." : "Enter a model, or ‘Unknown’.",
        });
      }
    }
    if (value.preferredContact === "phone" && !value.phone)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phone"],
        message: "Add a phone number or choose email.",
      });
  });
export type RepairInput = z.infer<typeof repairInputSchema>;
export type RepairDetails = Omit<RepairInput, "requestToken">;
export type RepairRequest = RepairDetails & {
  id: string;
  requestNumber: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};
export function validateRepairInput(value: unknown) {
  return repairInputSchema.safeParse(value);
}

export function repairServiceLabel(value: string) {
  const legacy: Record<string, string> = {
    restoration: "Restoration", cleaning: "Sensor cleaning",
    "film-dev": "Film development", quote: "Just a quote",
  };
  return REPAIR_SERVICES.find((s) => s.value === value)?.label || legacy[value] || value;
}
