import { PollType } from '../types/Poll';

export const PROGRESS_COLORS = [
  'var(--tui-text-action)',
  'var(--tui-text-negative-hover)',
  'var(--tui-text-positive-hover)',
  'var(--tui-text-primary)',
  'var(--tui-text-tertiary)',
];

export function pollTotalVotes(options: PollType['options']): number {
  return options.reduce((acc, opt) => acc + opt.votes, 0);
}

export function pollVotePercentage(votes: number, totalVotes: number): number {
  if (totalVotes === 0) return 0;
  return Math.round((votes / totalVotes) * 100);
}

export function pollProgressColor(index: number): string {
  return PROGRESS_COLORS[index % PROGRESS_COLORS.length];
}

export function pluralizePt(count: number, singular: string, plural: string): string {
  return count === 1 ? `${count} ${singular}` : `${count} ${plural}`;
}

export function pollDaysRemaining(expirationDate: string): number {
  const now = new Date();
  const end = new Date(expirationDate);
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 3600 * 24));
}

export function pollIsExpired(expirationDate: string): boolean {
  return new Date() >= new Date(expirationDate);
}
