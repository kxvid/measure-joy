import {
  formErrorResponse,
  formResponse,
  readPublicRepairForm,
  sendRepair,
} from "@/lib/inquiries";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { data, photos } = await readPublicRepairForm(request);
    const { status } = await sendRepair(data, photos);
    return formResponse(
      {
        success: true,
        status,
        message:
          status === "activation_pending"
            ? "Your request was received while contact setup is being completed. This is not a confirmed booking."
            : "Your service inquiry was accepted for processing. This is not a confirmed booking.",
      },
      status === "activation_pending" ? 202 : 200,
    );
  } catch (error) {
    return formErrorResponse(error);
  }
}
