import { PollType } from '../types/Poll';

export const DEFAULT_PROGRESS_COLOR = 'var(--tui-text-action)';
export const CHOSEN_PROGRESS_COLOR = 'var(--tui-background-accent-2)';

export const PROGRESS_COLORS = [
  DEFAULT_PROGRESS_COLOR,
  CHOSEN_PROGRESS_COLOR,
];

export function pollTotalVotes(options: PollType['options']): number {
  return options.reduce((acc, opt) => acc + opt.votes, 0);
}

export function pollVotePercentage(votes: number, totalVotes: number): number {
  if (totalVotes === 0) return 0;
  return Math.round((votes / totalVotes) * 100);
}

export function pollProgressColor(isChosenOrIndex: boolean | number = false): string {
  if (typeof isChosenOrIndex === 'boolean') {
    return isChosenOrIndex ? CHOSEN_PROGRESS_COLOR : DEFAULT_PROGRESS_COLOR;
  }
  return DEFAULT_PROGRESS_COLOR;
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
