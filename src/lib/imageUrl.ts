import { Image } from "react-native";
import { API_BASE_URL } from "../config";

/** Max width for /media — server resizes large guide photos for reliable mobile decode. */
const MEDIA_MAX_WIDTH = 1400;
const ARCHIVE_THUMB_WIDTH = 720;
const ARCHIVE_FULL_WIDTH = 1600;

function resolveMediaUrl(url: string, maxWidth: number, retry = false): string {
  try {
    const parsed = new URL(url);
    if (!parsed.pathname.startsWith("/media/")) {
      return url;
    }
    const base = `${API_BASE_URL.replace(/\/$/, "")}${parsed.pathname}`;
    const withSize = `${base}?w=${maxWidth}`;
    if (!retry) return withSize;
    const sep = withSize.includes("?") ? "&" : "?";
    return `${withSize}${sep}t=${Date.now()}`;
  } catch {
    return url;
  }
}

/** Guide images must load from the same API host the app uses (not preview deploy URLs). */
export function resolveGuideImageUrl(url: string, retry = false): string {
  return resolveMediaUrl(url, MEDIA_MAX_WIDTH, retry);
}

export function resolveArchiveImageUrl(
  url: string,
  size: "thumb" | "full" = "thumb",
): string {
  const maxWidth = size === "full" ? ARCHIVE_FULL_WIDTH : ARCHIVE_THUMB_WIDTH;
  return resolveMediaUrl(url, maxWidth);
}

export function prefetchArchiveImages(urls: string[]): void {
  for (const url of urls) {
    Image.prefetch(resolveArchiveImageUrl(url, "thumb")).catch(() => undefined);
  }
}
