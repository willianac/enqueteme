import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { toSafeNumber } from '../prisma/to-safe-number';

export interface ActivePollCacheEntry {
  id: number;
  title: string;
  normalizedTitle: string;
  options: string[];
  votesCount: number;
}

export interface DuplicateCheckResult {
  duplicateFound: boolean;
  similarity: number;
  poll: {
    id: number;
    title: string;
    votesCount: number;
  } | null;
}

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const SIMILARITY_THRESHOLD = 0.6;

@Injectable()
export class EnquetesSimilarityService implements OnModuleInit, OnModuleDestroy {
  private cache: ActivePollCacheEntry[] = [];
  private syncTimer: NodeJS.Timeout | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.syncFromDatabase();
    this.syncTimer = setInterval(() => {
      this.syncFromDatabase().catch(() => {});
    }, FIVE_MINUTES_MS);
    if (this.syncTimer?.unref) {
      this.syncTimer.unref();
    }
  }

  onModuleDestroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  async syncFromDatabase(): Promise<void> {
    try {
      const polls = await this.prisma.enquete.findMany({
        where: {
          expirationDate: {
            gt: new Date(),
          },
        },
        select: {
          id: true,
          title: true,
          opcoes: {
            select: {
              name: true,
              votes: true,
            },
          },
        },
      });

      if (!Array.isArray(polls)) {
        return;
      }

      this.cache = polls.map((poll) => {
        const options = poll.opcoes ? poll.opcoes.map((o) => o.name) : [];
        const votesCount = poll.opcoes
          ? poll.opcoes.reduce((sum, o) => sum + Number(o.votes), 0)
          : 0;

        return {
          id: toSafeNumber(poll.id),
          title: poll.title,
          normalizedTitle: this.normalizeText(poll.title),
          options,
          votesCount,
        };
      });
    } catch {
      // Gracefully handle database or mock inconsistencies during tests
    }
  }

  normalizeText(text: string): string {
    if (!text) {
      return '';
    }
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  calculateDiceCoefficient(str1: string, str2: string): number {
    if (str1 === str2) {
      return 1;
    }
    if (str1.length < 2 || str2.length < 2) {
      return 0;
    }

    const bigrams1 = new Map<string, number>();
    for (let i = 0; i < str1.length - 1; i++) {
      const bigram = str1.slice(i, i + 2);
      bigrams1.set(bigram, (bigrams1.get(bigram) ?? 0) + 1);
    }

    let intersection = 0;
    for (let i = 0; i < str2.length - 1; i++) {
      const bigram = str2.slice(i, i + 2);
      const count = bigrams1.get(bigram) ?? 0;
      if (count > 0) {
        bigrams1.set(bigram, count - 1);
        intersection++;
      }
    }

    const totalBigrams = str1.length - 1 + (str2.length - 1);
    return (2 * intersection) / totalBigrams;
  }

  calculateJaccardIndex(setA: Set<string>, setB: Set<string>): number {
    if (setA.size === 0 && setB.size === 0) {
      return 0;
    }

    let intersection = 0;
    for (const item of setA) {
      if (setB.has(item)) {
        intersection++;
      }
    }

    const unionSize = new Set([...setA, ...setB]).size;
    return unionSize > 0 ? intersection / unionSize : 0;
  }

  checkDuplicate(title: string, options?: string[]): DuplicateCheckResult {
    const normalizedTitle = this.normalizeText(title);
    if (!normalizedTitle) {
      return { duplicateFound: false, similarity: 0, poll: null };
    }

    const normalizedDraftOptions = options
      ? options.map((opt) => this.normalizeText(opt)).filter(Boolean)
      : [];
    const draftOptionSet = new Set(normalizedDraftOptions);
    const hasOptions = draftOptionSet.size >= 2;

    let bestScore = 0;
    let bestPoll: ActivePollCacheEntry | null = null;

    for (const poll of this.cache) {
      const titleSim = this.calculateDiceCoefficient(
        normalizedTitle,
        poll.normalizedTitle,
      );

      let score = titleSim;
      if (hasOptions) {
        const pollOptionSet = new Set(
          poll.options.map((opt) => this.normalizeText(opt)).filter(Boolean),
        );
        const optionSim = this.calculateJaccardIndex(draftOptionSet, pollOptionSet);
        score = 0.7 * titleSim + 0.3 * optionSim;
      }

      if (score > bestScore) {
        bestScore = score;
        bestPoll = poll;
      }
    }

    if (bestScore >= SIMILARITY_THRESHOLD && bestPoll) {
      return {
        duplicateFound: true,
        similarity: Math.round(bestScore * 100) / 100,
        poll: {
          id: bestPoll.id,
          title: bestPoll.title,
          votesCount: bestPoll.votesCount,
        },
      };
    }

    return {
      duplicateFound: false,
      similarity: 0,
      poll: null,
    };
  }

  upsertPoll(entry: {
    id: number;
    title: string;
    options: string[];
    votesCount?: number;
  }): void {
    const normalizedTitle = this.normalizeText(entry.title);
    const cacheEntry: ActivePollCacheEntry = {
      id: entry.id,
      title: entry.title,
      normalizedTitle,
      options: entry.options,
      votesCount: entry.votesCount ?? 0,
    };

    const index = this.cache.findIndex((p) => p.id === entry.id);
    if (index >= 0) {
      this.cache[index] = cacheEntry;
    } else {
      this.cache.push(cacheEntry);
    }
  }

  removePoll(id: number): void {
    this.cache = this.cache.filter((p) => p.id !== id);
  }

  incrementVotesCount(id: number, delta = 1): void {
    const poll = this.cache.find((p) => p.id === id);
    if (poll) {
      poll.votesCount += delta;
    }
  }

  getCache(): readonly ActivePollCacheEntry[] {
    return this.cache;
  }

  setCache(entries: ActivePollCacheEntry[]): void {
    this.cache = [...entries];
  }
}
