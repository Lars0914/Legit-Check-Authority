import { API_BASE_URL } from "../config";

/** Max width for /media — server resizes large guide photos for reliable mobile decode. */
const MEDIA_MAX_WIDTH = 1400;
const ARCHIVE_THUMB_WIDTH = 720;
const ARCHIVE_FULL_WIDTH = 1600;

/** Extract storage path from /media/... or /api?path=media/... URLs. */
function extractMediaStoragePath(parsed: URL): string | null {
  if (parsed.pathname.startsWith("/media/")) {
    return parsed.pathname.replace(/^\/media\/?/, "");
  }

  const isApiPath =
    parsed.pathname === "/api" || parsed.pathname.endsWith("/api");
  if (!isApiPath) {
    return null;
  }

  const pathParam = parsed.searchParams.get("path");
  if (!pathParam?.startsWith("media/")) {
    return null;
  }

  return pathParam.replace(/^media\/?/, "");
}

function resolveMediaUrl(url: string, maxWidth: number, retry = false): string {
  try {
    const parsed = new URL(url);
    const storagePath = extractMediaStoragePath(parsed);
    if (!storagePath) {
      return url;
    }

    const apiRoot = API_BASE_URL.replace(/\/$/, "");
    const base = `${apiRoot}/api?path=media/${storagePath}`;
    const withSize = `${base}&w=${maxWidth}`;
    if (!retry) return withSize;
    return `${withSize}&t=${Date.now()}`;
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
  retry = false,
): string {
  const maxWidth = size === "full" ? ARCHIVE_FULL_WIDTH : ARCHIVE_THUMB_WIDTH;
  return resolveMediaUrl(url, maxWidth, retry);
}
