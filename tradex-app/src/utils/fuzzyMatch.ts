export interface FuzzyResult {
  matched: boolean;
  indices: number[];
}

export function fuzzyMatch(text: string, query: string): FuzzyResult {
  if (!query) {
    return { matched: true, indices: [] };
  }
  const cleanText = text.toLowerCase();
  const cleanQuery = query.toLowerCase();
  const indices: number[] = [];

  let queryIdx = 0;
  for (let textIdx = 0; textIdx < cleanText.length; textIdx++) {
    if (cleanText[textIdx] === cleanQuery[queryIdx]) {
      indices.push(textIdx);
      queryIdx++;
      if (queryIdx === cleanQuery.length) {
        return { matched: true, indices };
      }
    }
  }
  return { matched: false, indices: [] };
}
