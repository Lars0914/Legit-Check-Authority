import { Platform } from "react-native";

/** Shown in UI, Stripe checkout, and store listing (home screen name). */
export const APP_DISPLAY_NAME = "Legit Check Authority";

/**
 * MVP feature flags — set to true when enabling accounts / billing in a future release.
 * Auth and payment screens remain in the codebase but are not shown or called when false.
 */
export const AUTH_ENABLED = true;
export const PAYMENTS_ENABLED = false;

/** When true: npm install @stripe/stripe-react-native@^0.58.0 and wire src/payments/useStripe.ts */

/** Production API (Vercel). Used for local dev and release builds — no local backend required. */
export const PRODUCTION_API_BASE_URL =
  "https://ticker-backend-six.vercel.app";

export const API_BASE_URL = PRODUCTION_API_BASE_URL;

/**
 * OAuth 2.0 **Web application** client ID (Credentials → Web application — NOT Android).
 * Must match backend GOOGLE_CLIENT_ID. Leave empty to hide Google sign-in.
 */
export const GOOGLE_WEB_CLIENT_ID =
  "656762894703-m08unsqdgban2pj81mr5g6ljl4bf3141.apps.googleusercontent.com";

/**
 * Optional Android OAuth client ID from Google Cloud (Credentials → Android).
 * Add the same value to backend GOOGLE_ANDROID_CLIENT_ID on Vercel if Google
 * sign-in tokens use a different aud/azp than the Web client ID.
 */
export const GOOGLE_ANDROID_CLIENT_ID = "";

/**
 * Stripe publishable key (pk_test_… or pk_live_…).
 * Must match backend STRIPE_PUBLISHABLE_KEY. Leave empty to disable payments UI.
 */
export const STRIPE_PUBLISHABLE_KEY = "";

/** True when subscription UI and Stripe checkout should be available. */
export function paymentsUiEnabled(): boolean {
  return PAYMENTS_ENABLED && STRIPE_PUBLISHABLE_KEY.length > 0;
}
