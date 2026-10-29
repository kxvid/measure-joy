import { z } from "zod";

export const REPAIR_SERVICES = [
  {
    value: "repair",
    label: "Camera repair",
    description: "Power, lens, screen & more",
  },
  {
    value: "restoration",
    label: "Restoration",
    description: "A little care for an old favorite",
  },
  {
    value: "cleaning",
    label: "Sensor cleaning",
    description: "A clearer view of things",
  },
  {
    value: "film-dev",
    label: "Film development",
    description: "35mm & disposable cameras",
  },
  {
    value: "quote",
    label: "Just a quote",
    description: "Explore what’s possible",
  },
] as const;
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
      ["repair", "restoration", "cleaning", "film-dev", "quote"],
      { error: "Choose a service." },
    ),
    brand: singleLine(80).pipe(z.string().min(1, "Enter your camera brand.")),
    model: singleLine(120).pipe(
      z.string().min(1, "Enter a model, or ‘Unknown’."),
    ),
    issues: z
      .array(z.enum(REPAIR_ISSUES))
      .max(10)
      .transform((values) => [...new Set(values)].sort()),
    description: z
      .string()
      .trim()
      .min(10, "Please include at least 10 characters about your camera.")
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
  return REPAIR_SERVICES.find((s) => s.value === value)?.label || value;
}
