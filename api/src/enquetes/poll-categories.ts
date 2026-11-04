export const POLL_CATEGORIES = [
  'Tecnologia',
  'Design',
  'Games',
  'Trabalho',
  'Esportes',
  'Cultura',
  'Geral',
] as const;

export type PollCategory = (typeof POLL_CATEGORIES)[number];

export const POLL_SORT_OPTIONS = [
  'newest',
  'most_voted',
  'ending_soon',
  'trending',
] as const;

export type PollSortOption = (typeof POLL_SORT_OPTIONS)[number];

export function normalizeTag(raw: string): string {
  return raw.trim().replace(/^#+/, '').trim().toLowerCase();
}

export function normalizeTags(tags?: string[]): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const tag of tags) {
    if (typeof tag !== 'string') {
      continue;
    }
    const clean = normalizeTag(tag);
    if (!clean || seen.has(clean)) {
      continue;
    }
    seen.add(clean);
    normalized.push(clean);
  }

  return normalized;
}
