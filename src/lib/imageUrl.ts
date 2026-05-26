import { API_BASE_URL } from "../config";

/** Guide images must load from the same API host the app uses (not preview deploy URLs). */
export function resolveGuideImageUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (!parsed.pathname.startsWith("/media/")) {
      return url;
    }
    return `${API_BASE_URL.replace(/\/$/, "")}${parsed.pathname}`;
  } catch {
    return url;
  }
}
