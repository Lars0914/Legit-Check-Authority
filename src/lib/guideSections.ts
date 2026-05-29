/** Matches backend explanationEnhancer.isExplanationSection */
export function isExplanationSection(title: string): boolean {
  return /\bexplanation\b/i.test(title);
}

export function isInspectionSection(title: string): boolean {
  return !isExplanationSection(title);
}
