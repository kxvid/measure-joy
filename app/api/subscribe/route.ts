import { createAdminClient } from "@/lib/supabase/admin";
import {
  FormError,
  formErrorResponse,
  formResponse,
  readPublicForm,
  requireEmailDelivery,
  sendInquiryNotification,
  sendSubscriptionWelcome,
  subscriptionSchema,
  subscriptionToken,
} from "@/lib/inquiries";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let subscriptionSaved = false;
  try {
    const data = await readPublicForm(request, subscriptionSchema);
    requireEmailDelivery();
    try {
      const { error } = await createAdminClient().from("subscribers").upsert(
        {
          email: data.email,
          source: data.source,
          subscribed_at: new Date().toISOString(),
          is_active: true,
        },
        { onConflict: "email" },
      );
      if (error) throw error;
      subscriptionSaved = true;
    } catch {
      throw new FormError(
        503,
        "We couldn't save your subscription. Please try again later.",
      );
    }

    const token = subscriptionToken(data);
    await sendInquiryNotification({
      kind: "subscription",
      token,
      replyTo: data.email,
      subject: "Measure Joy newsletter signup",
      fields: [
        ["Email", data.email],
        ["Source", data.source],
      ],
    });
    // A welcome email is secondary: the subscription and Christian notification have succeeded.
    let welcomeSent = false;
    try {
      welcomeSent = await sendSubscriptionWelcome(data.email, token);
    } catch {
      /* Keep the saved subscription successful. */
    }
    return formResponse({
      success: true,
      message: "You're on the list. Thank you for joining Measure Joy.",
      welcomeSent,
    });
  } catch (error) {
    return formErrorResponse(error, { subscriptionSaved });
  }
}
