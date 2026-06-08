import { Image } from "react-native";
import { isFastImageNativeAvailable } from "./fastImageNative";
import FastImage from "./fastImageModule";
import { resolveArchiveImageUrl } from "./imageUrl";

type PrefetchPriority = "low" | "normal" | "high";

const prefetched = new Set<string>();

function preloadWithFastImage(
  uris: string[],
  priority: PrefetchPriority,
): void {
  const priorityValue =
    priority === "high"
      ? FastImage.priority.high
      : priority === "low"
        ? FastImage.priority.low
        : FastImage.priority.normal;

  FastImage.preload(uris.map((uri) => ({ uri, priority: priorityValue })));
}

/** Deduplicated preload for absolute image URIs. */
export function prefetchImageUris(
  uris: string[],
  priority: PrefetchPriority = "normal",
): void {
  const fresh = uris.filter((uri) => uri.length > 0 && !prefetched.has(uri));
  if (fresh.length === 0) return;

  for (const uri of fresh) {
    prefetched.add(uri);
  }

  if (isFastImageNativeAvailable()) {
    preloadWithFastImage(fresh, priority);
    return;
  }

  for (const uri of fresh) {
    Image.prefetch(uri).catch(() => undefined);
  }
}

export function prefetchArchiveThumbs(urls: string[]): void {
  prefetchImageUris(
    urls.map((url) => resolveArchiveImageUrl(url, "thumb")),
    "normal",
  );
}

export function prefetchArchiveFull(urls: string[]): void {
  prefetchImageUris(
    urls.map((url) => resolveArchiveImageUrl(url, "full")),
    "high",
  );
}

/** Prefetch full-size archive photos for index ±1 (lightbox / viewer navigation). */
export function prefetchNeighborArchiveFull(
  urls: string[],
  index: number,
): void {
  const neighbors = [index - 1, index, index + 1]
    .filter((i) => i >= 0 && i < urls.length)
    .map((i) => urls[i]);
  prefetchArchiveFull(neighbors);
}

/** Prefetch the next thumbnails ahead of the current list position while scrolling. */
export function prefetchAheadArchiveThumbs(
  urls: string[],
  fromIndex: number,
  count = 2,
): void {
  if (fromIndex < 0 || fromIndex >= urls.length - 1) return;
  const ahead = urls.slice(fromIndex + 1, fromIndex + 1 + count);
  prefetchArchiveThumbs(ahead);
}

/** Clears dedupe set (tests only). */
export function clearImagePrefetchCache(): void {
  prefetched.clear();
}
