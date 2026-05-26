/**
 * Stripe is not bundled while PAYMENTS_ENABLED is false (avoids native build issues).
 * When enabling payments: npm install @stripe/stripe-react-native@^0.58.0
 * and change this file to re-export from "@stripe/stripe-react-native".
 */

type SheetResult = { error?: { message: string; code?: string } };

export function useStripe() {
  const unavailable = async (): Promise<SheetResult> => ({
    error: { message: "Payments are not enabled in this build." },
  });

  return {
    initPaymentSheet: unavailable,
    presentPaymentSheet: unavailable,
  };
}
