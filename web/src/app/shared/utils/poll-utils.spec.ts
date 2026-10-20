import {
  pluralizePt,
  pollDaysRemaining,
  pollIsExpired,
  pollProgressColor,
  pollTotalVotes,
  pollVotePercentage,
} from './poll-utils';

describe('poll-utils', () => {
  describe('pollVotePercentage', () => {
    it('returns 0 when totalVoters is 0 or negative', () => {
      expect(pollVotePercentage(5, 0)).toBe(0);
      expect(pollVotePercentage(5, -1)).toBe(0);
    });

    it('calculates correct percentage relative to total voters', () => {
      expect(pollVotePercentage(5, 10)).toBe(50);
      expect(pollVotePercentage(1, 3)).toBe(33);
      expect(pollVotePercentage(2, 3)).toBe(67);
      expect(pollVotePercentage(10, 10)).toBe(100);
    });
  });

  describe('pollTotalVotes', () => {
    it('sums votes of all options', () => {
      const options = [
        { id: 1, name: 'A', votes: 3 },
        { id: 2, name: 'B', votes: 7 },
      ];
      expect(pollTotalVotes(options)).toBe(10);
    });
  });

  describe('pluralizePt', () => {
    it('formats singular and plural correctly', () => {
      expect(pluralizePt(1, 'voto', 'votos')).toBe('1 voto');
      expect(pluralizePt(2, 'voto', 'votos')).toBe('2 votos');
      expect(pluralizePt(0, 'voto', 'votos')).toBe('0 votos');
    });
  });

  describe('pollProgressColor', () => {
    it('returns accent color when chosen is true', () => {
      expect(pollProgressColor(true)).toBe('var(--tui-background-accent-2)');
      expect(pollProgressColor(false)).toBe('var(--tui-text-action)');
    });
  });

  describe('pollIsExpired', () => {
    it('returns true if date is in the past', () => {
      expect(pollIsExpired('2000-01-01T00:00:00.000Z')).toBe(true);
    });

    it('returns false if date is in the future', () => {
      expect(pollIsExpired('2099-01-01T00:00:00.000Z')).toBe(false);
    });
  });
});
