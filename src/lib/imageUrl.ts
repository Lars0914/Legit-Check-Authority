import { API_BASE_URL } from "../config";

/** Max width for /media — server resizes large guide photos for reliable mobile decode. */
const MEDIA_MAX_WIDTH = 1400;

/** Guide images must load from the same API host the app uses (not preview deploy URLs). */
export function resolveGuideImageUrl(url: string, retry = false): string {
  try {
    const parsed = new URL(url);
    if (!parsed.pathname.startsWith("/media/")) {
      return url;
    }
    const base = `${API_BASE_URL.replace(/\/$/, "")}${parsed.pathname}`;
    const withSize = `${base}?w=${MEDIA_MAX_WIDTH}`;
    if (!retry) return withSize;
    const sep = withSize.includes("?") ? "&" : "?";
    return `${withSize}${sep}t=${Date.now()}`;
  } catch {
    return url;
  }
}
