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
    await sendContact(data);
    return formResponse({
      success: true,
      message: "Your message has been sent to Christian.",
    });
  } catch (error) {
    return formErrorResponse(error);
  }
}
