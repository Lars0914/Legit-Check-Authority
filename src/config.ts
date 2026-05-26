import { Platform } from "react-native";

/** Shown in UI, Stripe checkout, and store listing (home screen name). */
export const APP_DISPLAY_NAME = "Legit Check Authority";

/**
 * MVP feature flags — set to true when enabling accounts / billing in a future release.
 * Auth and payment screens remain in the codebase but are not shown or called when false.
 */
export const AUTH_ENABLED = false;
export const PAYMENTS_ENABLED = false;

/** When true: npm install @stripe/stripe-react-native@^0.58.0 and wire src/payments/useStripe.ts */

/**
 * Android emulator: 10.0.2.2 maps to the host machine's localhost.
 * iOS simulator: localhost. Physical device: use your PC's LAN IP.
 */
/** Set to your Vercel (or other) HTTPS API before Play Store / App Store release. */
export const PRODUCTION_API_BASE_URL =
  "https://ticker-backend-six.vercel.app";

const DEV_API_HOST =
  Platform.OS === "android" ? "10.0.2.2" : "localhost";

const DEV_API_BASE_URL = `http://${DEV_API_HOST}:3001`;

/**
 * false (default): emulator uses Vercel API — works without local backend.
 * true: use DEV_API_BASE_URL; run `cd backend && npm run dev` and use run.bat (adb reverse :3001).
 */
const USE_LOCAL_API_IN_DEV = false;

export const API_BASE_URL =
  __DEV__ && USE_LOCAL_API_IN_DEV
    ? DEV_API_BASE_URL
    : PRODUCTION_API_BASE_URL;

/**
 * OAuth 2.0 **Web application** client ID (Credentials → Web application — NOT Android).
 * Must match backend GOOGLE_CLIENT_ID. Leave empty to hide Google sign-in.
 */
export const GOOGLE_WEB_CLIENT_ID = "721266614505-23f6pri2qlfac8i20vd8qkjg208n6bvg.apps.googleusercontent.com";

/**
 * Stripe publishable key (pk_test_… or pk_live_…).
 * Must match backend STRIPE_PUBLISHABLE_KEY. Leave empty to disable payments UI.
 */
export const STRIPE_PUBLISHABLE_KEY = "";

/** True when subscription UI and Stripe checkout should be available. */
export function paymentsUiEnabled(): boolean {
  return PAYMENTS_ENABLED && STRIPE_PUBLISHABLE_KEY.length > 0;
}
