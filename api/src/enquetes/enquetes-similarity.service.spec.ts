import { EnquetesSimilarityService } from './enquetes-similarity.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EnquetesSimilarityService', () => {
  let service: EnquetesSimilarityService;
  const mockPrisma = {
    enquete: {
      findMany: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EnquetesSimilarityService(mockPrisma as unknown as PrismaService);
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  describe('normalizeText', () => {
    it('lowercases, trims, and strips accents', () => {
      expect(service.normalizeText('  REACT vs Vue em 2026!  ')).toBe('react vs vue em 2026!');
      expect(service.normalizeText('Eleição & Opinião')).toBe('eleicao & opiniao');
      expect(service.normalizeText('São Paulo')).toBe('sao paulo');
    });

    it('handles empty strings gracefully', () => {
      expect(service.normalizeText('')).toBe('');
    });
  });

  describe('calculateDiceCoefficient', () => {
    it('returns 1.0 for identical strings', () => {
      expect(service.calculateDiceCoefficient('react vs vue', 'react vs vue')).toBe(1);
    });

    it('returns 0 for strings shorter than 2 characters when different', () => {
      expect(service.calculateDiceCoefficient('a', 'b')).toBe(0);
      expect(service.calculateDiceCoefficient('a', 'a')).toBe(1);
    });

    it('returns 0 for completely disjoint strings', () => {
      expect(service.calculateDiceCoefficient('aaaa', 'bbbb')).toBe(0);
    });

    it('computes correct Dice coefficient on bi-grams', () => {
      // 'react' -> ['re', 'ea', 'ac', 'ct'] (4 bigrams)
      // 'reactjs' -> ['re', 'ea', 'ac', 'ct', 'tj', 'js'] (6 bigrams)
      // intersection = 4
      // Dice = 2 * 4 / (4 + 6) = 0.8
      expect(service.calculateDiceCoefficient('react', 'reactjs')).toBe(0.8);
    });
  });

  describe('calculateJaccardIndex', () => {
    it('returns 1.0 for identical sets', () => {
      const a = new Set(['react', 'vue']);
      const b = new Set(['react', 'vue']);
      expect(service.calculateJaccardIndex(a, b)).toBe(1);
    });

    it('returns 0 for disjoint sets', () => {
      const a = new Set(['react', 'vue']);
      const b = new Set(['angular', 'svelte']);
      expect(service.calculateJaccardIndex(a, b)).toBe(0);
    });

    it('computes correct Jaccard index for partial overlap', () => {
      const a = new Set(['react', 'vue']);
      const b = new Set(['react', 'vue', 'angular']);
      // intersection = 2, union = 3 -> 2/3
      expect(service.calculateJaccardIndex(a, b)).toBeCloseTo(2 / 3);
    });
  });

  describe('checkDuplicate', () => {
    beforeEach(() => {
      service.setCache([
        {
          id: 42,
          title: 'React vs Vue em 2026',
          normalizedTitle: 'react vs vue em 2026',
          options: ['React', 'Vue'],
          votesCount: 184,
        },
        {
          id: 99,
          title: 'Melhor editor de código',
          normalizedTitle: 'melhor editor de codigo',
          options: ['VS Code', 'Neovim', 'WebStorm'],
          votesCount: 50,
        },
      ]);
    });

    it('detects duplicate when title similarity exceeds threshold (0.60)', () => {
      const result = service.checkDuplicate('React vs Vue 2026');
      expect(result.duplicateFound).toBe(true);
      expect(result.similarity).toBeGreaterThanOrEqual(0.6);
      expect(result.poll).toEqual({
        id: 42,
        title: 'React vs Vue em 2026',
        votesCount: 184,
      });
    });

    it('incorporates options similarity when at least 2 draft options are provided', () => {
      const withMatchingOptions = service.checkDuplicate('React vs Vue em 2026', ['React', 'Vue']);
      expect(withMatchingOptions.duplicateFound).toBe(true);
      expect(withMatchingOptions.similarity).toBe(1.0);

      // Same title but completely different options lowers the score
      const withDifferentOptions = service.checkDuplicate('React vs Vue em 2026', ['Angular', 'Svelte']);
      // TitleSim = 1.0 * 0.7 = 0.7, OptionSim = 0 * 0.3 = 0 -> Score = 0.70
      expect(withDifferentOptions.duplicateFound).toBe(true);
      expect(withDifferentOptions.similarity).toBe(0.7);
    });

    it('ignores option similarity when fewer than 2 draft options provided', () => {
      const result = service.checkDuplicate('React vs Vue em 2026', ['React']);
      expect(result.duplicateFound).toBe(true);
      expect(result.similarity).toBe(1.0);
    });

    it('returns duplicateFound: false when similarity is below threshold', () => {
      const result = service.checkDuplicate('Como aprender Python rápido?');
      expect(result.duplicateFound).toBe(false);
      expect(result.similarity).toBe(0);
      expect(result.poll).toBeNull();
    });

    it('returns highest similarity match when multiple polls match', () => {
      service.setCache([
        {
          id: 1,
          title: 'React vs Vue vs Angular',
          normalizedTitle: 'react vs vue vs angular',
          options: ['React', 'Vue', 'Angular'],
          votesCount: 10,
        },
        {
          id: 2,
          title: 'React vs Vue em 2026',
          normalizedTitle: 'react vs vue em 2026',
          options: ['React', 'Vue'],
          votesCount: 200,
        },
      ]);

      const result = service.checkDuplicate('React vs Vue 2026');
      expect(result.poll?.id).toBe(2);
    });
  });

  describe('Cache lifecycle', () => {
    it('syncFromDatabase populates cache from prisma', async () => {
      mockPrisma.enquete.findMany.mockResolvedValue([
        {
          id: 10n,
          title: 'Teste de Enquete',
          opcoes: [
            { name: 'Opção 1', votes: 2n },
            { name: 'Opção 2', votes: 3n },
          ],
        },
      ]);

      await service.syncFromDatabase();
      const cache = service.getCache();

      expect(cache).toHaveLength(1);
      expect(cache[0]).toEqual({
        id: 10,
        title: 'Teste de Enquete',
        normalizedTitle: 'teste de enquete',
        options: ['Opção 1', 'Opção 2'],
        votesCount: 5,
      });
    });

    it('upsertPoll adds and updates entries', () => {
      service.upsertPoll({
        id: 1,
        title: 'Nova Enquete',
        options: ['A', 'B'],
        votesCount: 0,
      });
      expect(service.getCache()).toHaveLength(1);

      service.upsertPoll({
        id: 1,
        title: 'Enquete Atualizada',
        options: ['A', 'B', 'C'],
        votesCount: 10,
      });
      expect(service.getCache()).toHaveLength(1);
      expect(service.getCache()[0].title).toBe('Enquete Atualizada');
      expect(service.getCache()[0].votesCount).toBe(10);
    });

    it('removePoll removes entry', () => {
      service.upsertPoll({ id: 1, title: 'Enquete 1', options: ['A', 'B'] });
      expect(service.getCache()).toHaveLength(1);
      service.removePoll(1);
      expect(service.getCache()).toHaveLength(0);
    });

    it('incrementVotesCount updates votes', () => {
      service.upsertPoll({ id: 1, title: 'Enquete 1', options: ['A', 'B'], votesCount: 5 });
      service.incrementVotesCount(1);
      expect(service.getCache()[0].votesCount).toBe(6);
    });
  });
});
