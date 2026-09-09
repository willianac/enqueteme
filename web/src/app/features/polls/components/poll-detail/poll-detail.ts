import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Navbar } from '../../../../shared/components/navbar/navbar';
import { Poll } from '../poll/poll';
import { PollApi } from '../../services/poll-api';
import { PollType } from '../../../../shared/types/Poll';
import { TuiButton } from '@taiga-ui/core';

@Component({
  selector: 'app-poll-detail',
  standalone: true,
  imports: [Navbar, Poll, CommonModule, RouterLink, TuiButton],
  templateUrl: './poll-detail.html',
  styleUrl: './poll-detail.less',
})
export class PollDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly pollApi = inject(PollApi);

  readonly poll = signal<PollType | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      const numId = id ? Number(id) : NaN;
      if (!isNaN(numId) && numId > 0) {
        this.loadPoll(numId);
      } else {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  loadPoll(id: number): void {
    this.loading.set(true);
    this.error.set(false);
    this.pollApi.getPoll(id).subscribe({
      next: (poll) => {
        this.poll.set(poll);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
