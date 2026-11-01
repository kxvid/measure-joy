/** Only messages deliberately created by the checkout UI may be displayed verbatim. */
export class CheckoutPublicError extends Error {}

export function checkoutErrorMessage(cause: unknown): string {
  return cause instanceof CheckoutPublicError
    ? cause.message
    : "Checkout is temporarily unavailable. Please try again shortly.";
}
