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
  readonly error = signal(false);

  ngOnInit(): void {
    this.loadPolls();
  }

  loadPolls(): void {
    this.loading.set(true);
    this.error.set(false);
    this.pollApi.getAllPolls().subscribe({
      next: (polls) => {
        this.polls.set(polls ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
