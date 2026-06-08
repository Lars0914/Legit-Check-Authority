/** Removes "Reference angle N of M" numbering from API descriptions. */
export function formatArchiveDescription(
  description: string | null | undefined,
): string | null {
  if (!description?.trim()) return null;
  return description
    .replace(/^Reference angle \d+ of \d+ for the /i, "For the ")
    .replace(/^Reference angle for the /i, "For the ")
    .trim();
}
