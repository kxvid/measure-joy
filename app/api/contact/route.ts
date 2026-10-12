import {
  contactSchema,
  formErrorResponse,
  formResponse,
  readPublicForm,
  sendContact,
} from "@/lib/inquiries";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const data = await readPublicForm(request, contactSchema);
    const { status } = await sendContact(data);
    return formResponse(
      {
        success: true,
        status,
        message:
          status === "activation_pending"
            ? "Your request was received while contact setup is being completed."
            : "Your request was accepted for processing.",
      },
      status === "activation_pending" ? 202 : 200,
    );
  } catch (error) {
    return formErrorResponse(error);
  }
}
