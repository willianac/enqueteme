import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Navbar } from '../../shared/components/navbar/navbar';
import { Poll } from './components/poll/poll';
import { PollApi, PollDiscoveryParams } from './services/poll-api';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  POLL_CATEGORIES,
  PollCategory,
  PollSortOption,
  PollType,
} from '../../shared/types/Poll';
import { TuiButton, TuiIcon } from '@taiga-ui/core';
import { TuiSegmented } from '@taiga-ui/kit';
import { RouterLink } from '@angular/router';
import { pluralizePt, pollIsExpired } from '../../shared/utils/poll-utils';

@Component({
  selector: 'app-polls',
  imports: [
    Navbar,
    Poll,
    CommonModule,
    FormsModule,
    TuiButton,
    TuiIcon,
    RouterLink,
    TuiSegmented,
  ],
  templateUrl: './polls.html',
  styleUrl: './polls.less',
})
export class Polls implements OnInit {
  private readonly pollApi = inject(PollApi);

  readonly categories = POLL_CATEGORIES;
  readonly sortOptions: { value: PollSortOption; label: string }[] = [
    { value: 'newest', label: 'Mais recentes' },
    { value: 'trending', label: 'Em alta' },
    { value: 'most_voted', label: 'Mais votadas' },
    { value: 'ending_soon', label: 'Encerrando em breve' },
  ];

  readonly polls = signal<PollType[]>([]);
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly error = signal(false);
  readonly hasMore = signal(true);
  readonly activeFilterIndex = signal<number>(0);

  readonly searchQuery = signal<string>('');
  readonly selectedCategory = signal<PollCategory | null>(null);
  readonly selectedTag = signal<string | null>(null);
  readonly selectedSort = signal<PollSortOption>('newest');

  readonly hasActiveDiscoveryFilters = computed(() => {
    return Boolean(
      this.selectedCategory() !== null ||
        this.selectedTag() !== null ||
        this.searchQuery().trim().length > 0 ||
        this.selectedSort() !== 'newest',
    );
  });

  readonly filteredPolls = computed(() => {
    const list = this.polls();
    const filterIdx = this.activeFilterIndex();
    if (filterIdx === 1) {
      // Ativas
      return list.filter((p) => !pollIsExpired(p.expirationDate));
    }
    if (filterIdx === 2) {
      // Encerradas
      return list.filter((p) => pollIsExpired(p.expirationDate));
    }
    return list;
  });

  onFilterChange(index: number): void {
    this.activeFilterIndex.set(index);
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.loadPolls();
  }

  clearSearch(): void {
    if (!this.searchQuery()) return;
    this.searchQuery.set('');
    this.loadPolls();
  }

  selectCategory(category: PollCategory | null): void {
    if (this.selectedCategory() === category) return;
    this.selectedCategory.set(category);
    this.loadPolls();
  }

  selectSort(sort: PollSortOption): void {
    if (this.selectedSort() === sort) return;
    this.selectedSort.set(sort);
    this.loadPolls();
  }

  selectTag(tag: string | null): void {
    const normalized = tag ? tag.trim().replace(/^#+/, '').toLowerCase() : null;
    const nextTag = normalized || null;
    if (this.selectedTag() === nextTag) return;
    this.selectedTag.set(nextTag);
    this.loadPolls();
  }

  clearDiscoveryFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set(null);
    this.selectedTag.set(null);
    this.selectedSort.set('newest');
    this.loadPolls();
  }

  pluralize(count: number, singular: string, plural: string): string {
    return pluralizePt(count, singular, plural);
  }

  private page = 1;
  private readonly limit = 10;

  ngOnInit(): void {
    this.loadPolls();
  }

  private buildDiscoveryFilters(): Omit<PollDiscoveryParams, 'page' | 'limit'> {
    const filters: Omit<PollDiscoveryParams, 'page' | 'limit'> = {};
    const category = this.selectedCategory();
    if (category) {
      filters.category = category;
    }
    const tag = this.selectedTag();
    if (tag) {
      filters.tag = tag;
    }
    const search = this.searchQuery().trim();
    if (search) {
      filters.search = search;
    }
    const sort = this.selectedSort();
    if (sort && sort !== 'newest') {
      filters.sort = sort;
    }
    return filters;
  }

  loadPolls(isLoadMore = false): void {
    if (!isLoadMore) {
      this.page = 1;
      this.polls.set([]);
      this.hasMore.set(true);
      this.loading.set(true);
    } else {
      this.loadingMore.set(true);
    }

    this.error.set(false);
    const request$ = this.hasActiveDiscoveryFilters()
      ? this.pollApi.getAllPolls(this.page, this.limit, this.buildDiscoveryFilters())
      : this.pollApi.getAllPolls(this.page, this.limit);

    request$.subscribe({
      next: (polls) => {
        const fetchedPolls = polls ?? [];
        if (isLoadMore) {
          this.polls.update((current) => [...current, ...fetchedPolls]);
        } else {
          this.polls.set(fetchedPolls);
        }

        if (fetchedPolls.length < this.limit) {
          this.hasMore.set(false);
        }
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: () => {
        if (isLoadMore) {
          this.page--;
          this.loadingMore.set(false);
        } else {
          this.error.set(true);
          this.loading.set(false);
        }
      },
    });
  }

  loadMore(): void {
    if (this.loading() || this.loadingMore() || !this.hasMore()) return;
    this.page++;
    this.loadPolls(true);
  }
}
