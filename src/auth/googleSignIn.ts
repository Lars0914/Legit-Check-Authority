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
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("DEVELOPER_ERROR") || (isErrorWithCode(err) && err.code === "10")) {
      throw new Error(
        "Google Sign-In config mismatch. Reinstall the app (run.bat rebuild), then confirm Google Cloud has an Android OAuth client for package com.legitcheckauthority.app with SHA-1 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25.",
      );
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
