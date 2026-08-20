import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Navbar } from '../../../../shared/components/navbar/navbar';
import { PollType } from '../../../../shared/types/Poll';
import { PollApi } from '../../services/poll-api';
import { MyPollCard } from './my-poll-card';
import { TuiButton } from '@taiga-ui/core';

@Component({
  selector: 'app-my-polls',
  imports: [CommonModule, Navbar, MyPollCard, TuiButton, RouterLink],
  templateUrl: './my-polls.html',
  styleUrl: './my-polls.less',
})
export class MyPolls implements OnInit {
  private readonly pollApi = inject(PollApi);
  private readonly router = inject(Router);

  readonly polls = signal<PollType[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  readonly mockedPolls: PollType[] = [
    {
      id: 1,
      creatorName: 'João Silva',
      voteRequireLogin: true,
      title: 'Qual é a sua cor favorita?',
      options: [
        { id: 1, name: 'Vermelho', votes: 10 },
        { id: 2, name: 'Azul', votes: 20 },
        { id: 3, name: 'Verde', votes: 5 },
      ],
      expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      creatorName: 'João Silva',
      voteRequireLogin: true,
      title: 'Qual é o seu animal favorito?',
      options: [
        { id: 1, name: 'Cachorro', votes: 15 },
        { id: 2, name: 'Gato', votes: 25 },
        { id: 3, name: 'Pássaro', votes: 8 },
      ],
      expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ]

  ngOnInit(): void {
    this.loadPolls();
  }

  loadPolls(): void {
    this.loading.set(true);
    this.error.set(false);
    this.pollApi.getMyPolls().subscribe({
      next: (polls) => {
        this.polls.set(polls);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  onEdit(id: number): void {
    this.router.navigate(['/my-polls', id, 'edit']);
  }

  onClose(id: number): void {
    this.pollApi.closePoll(id).subscribe({
      next: (updated) => {
        this.polls.update((list) =>
          list.map((p) => (p.id === id ? updated : p)),
        );
      },
    });
  }

  onDelete(id: number): void {
    this.pollApi.deletePoll(id).subscribe({
      next: () => {
        this.polls.update((list) => list.filter((p) => p.id !== id));
      },
    });
  }
}
