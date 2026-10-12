import {
  formErrorResponse,
  formResponse,
  readPublicForm,
  repairSchema,
  sendRepair,
} from "@/lib/inquiries";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const data = await readPublicForm(request, repairSchema);
    await sendRepair(data);
    return formResponse({
      success: true,
      message:
        "Your service inquiry has been sent to Christian. This is not a confirmed booking.",
    });
  } catch (error) {
    return formErrorResponse(error);
  }
}
