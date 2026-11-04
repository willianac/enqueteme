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

export type PollSortOption = 'newest' | 'most_voted' | 'ending_soon' | 'trending';

export function normalizePollTags(input?: string | string[] | null): string[] {
  if (!input) {
    return [];
  }
  const rawItems = Array.isArray(input)
    ? input.flatMap((item) => String(item).split(','))
    : String(input).split(',');
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of rawItems) {
    const normalized = item
      .trim()
      .replace(/^#+/, '')
      .trim()
      .toLowerCase();
    if (normalized.length >= 2 && normalized.length <= 24 && !seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
      if (result.length >= 5) {
        break;
      }
    }
  }
  return result;
}

export type PollType = {
  id: number;
  title: string;
  category?: PollCategory;
  tags?: string[];
  creatorName: string;
  expirationDate: string;
  voteRequireLogin: boolean;
  allowMultiple?: boolean;
  maxChoices?: number | null;
  totalVoters?: number;
  options: {
    id: number;
    name: string;
    votes: number;
    votePercentage?: number;
    progressColor?: string;
  }[];
  hasVoted?: boolean;
  votedOptionIds?: number[];
  votedOptionId?: number | null;
};

