import { NativeModules, TurboModuleRegistry } from "react-native";
import { GOOGLE_WEB_CLIENT_ID } from "../config";

type GoogleSignInModule =
  typeof import("@react-native-google-signin/google-signin");

let configured = false;
let cachedModule: GoogleSignInModule | null | undefined;

function hasClientId(): boolean {
  return Boolean(GOOGLE_WEB_CLIENT_ID?.trim());
}

/** Web client ID is set in config — used to show the Google button. */
export function isGoogleSignInConfigured(): boolean {
  return hasClientId();
}

function hasNativeModule(): boolean {
  if (NativeModules.RNGoogleSignin != null) {
    return true;
  }
  try {
    return TurboModuleRegistry.get("RNGoogleSignin") != null;
  } catch {
    return false;
  }
}

function loadGoogleSignInModule(): GoogleSignInModule | null {
  if (!hasClientId()) {
    return null;
  }
  if (cachedModule !== undefined) {
    return cachedModule;
  }
  if (!hasNativeModule()) {
    cachedModule = null;
    return null;
  }
  try {
    cachedModule =
      require("@react-native-google-signin/google-signin") as GoogleSignInModule;
  } catch {
    cachedModule = null;
  }
  return cachedModule;
}

/** True when the native module loaded (after a successful rebuild). */
export function isGoogleSignInNativeLinked(): boolean {
  return loadGoogleSignInModule() != null;
}

export function configureGoogleSignIn(): void {
  const webClientId = GOOGLE_WEB_CLIENT_ID?.trim();
  if (!webClientId || configured) return;

  const mod = loadGoogleSignInModule();
  if (!mod) return;

  mod.GoogleSignin.configure({
    webClientId,
    offlineAccess: false,
  });
  configured = true;
}

export async function getGoogleIdToken(): Promise<string> {
  if (!isGoogleSignInConfigured()) {
    throw new Error(
      "Google sign-in is not configured. Set GOOGLE_WEB_CLIENT_ID in mobile/src/config.ts",
    );
  }

  const mod = loadGoogleSignInModule();
  if (!mod) {
    throw new Error(
      "Google Sign-In native module is missing. Close the app and run: run.bat rebuild",
    );
  }

  const { GoogleSignin, isErrorWithCode, statusCodes } = mod;

  configureGoogleSignIn();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  try {
    const result = await GoogleSignin.signIn();
    if (result.type === "cancelled") {
      throw new Error("Sign in cancelled");
    }
    const idToken = result.data.idToken;
    if (!idToken) {
      throw new Error("No ID token from Google. Check GOOGLE_WEB_CLIENT_ID.");
    }
    return idToken;
  } catch (err) {
    if (isErrorWithCode(err)) {
      if (err.code === statusCodes.IN_PROGRESS) {
        throw new Error("Sign in already in progress");
      }
      if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error("Google Play Services not available");
      }
    }
    throw err instanceof Error ? err : new Error("Google sign-in failed");
  }
}

export async function signOutGoogle(): Promise<void> {
  if (!isGoogleSignInConfigured()) return;
  const mod = loadGoogleSignInModule();
  if (!mod) return;
  try {
    await mod.GoogleSignin.signOut();
  } catch {
    /* ignore */
  }
}
