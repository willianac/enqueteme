import { Component, inject, OnInit, signal } from '@angular/core';
import { Navbar } from "../../shared/components/navbar/navbar";
import { Poll } from "./components/poll/poll";
import { PollApi } from './services/poll-api';
import { CommonModule } from '@angular/common';
import { PollType } from '../../shared/types/Poll';
import { TuiButton } from '@taiga-ui/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-polls',
  imports: [Navbar, Poll, CommonModule, TuiButton, RouterLink],
  templateUrl: './polls.html',
  styleUrl: './polls.less',
})
export class Polls implements OnInit {
  private readonly pollApi = inject(PollApi);

  readonly polls = signal<PollType[]>([]);
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly error = signal(false);
  readonly hasMore = signal(true);
  
  private page = 1;
  private readonly limit = 10;

  ngOnInit(): void {
    this.loadPolls();
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
    this.pollApi.getAllPolls(this.page, this.limit).subscribe({
      next: (polls) => {
        const fetchedPolls = polls ?? [];
        if (isLoadMore) {
          this.polls.update(current => [...current, ...fetchedPolls]);
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
