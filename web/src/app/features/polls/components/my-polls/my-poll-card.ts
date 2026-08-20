import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PollType } from '../../../../shared/types/Poll';
import { TuiCardLarge, TuiHeader } from "@taiga-ui/layout"
import { TuiAppearance, TuiButton, TuiDialogService, TuiSurface, TuiTitle } from '@taiga-ui/core';
import { TuiChip, TuiProgressBar } from '@taiga-ui/kit';

@Component({
  selector: 'app-my-poll-card',
  imports: [CommonModule, TuiCardLarge, TuiSurface, TuiTitle, TuiButton, TuiAppearance, TuiHeader, TuiChip, TuiProgressBar],
  templateUrl: './my-poll-card.html',
  styleUrl: './my-poll-card.less',
})
export class MyPollCard {
  private readonly dialogs = inject(TuiDialogService);

  @Input({ required: true }) pollData!: PollType;

  @Output() edit = new EventEmitter<number>();
  @Output() close = new EventEmitter<number>();
  @Output() delete = new EventEmitter<number>();

  readonly progressColors = [
    'var(--tui-text-action)',
    'var(--tui-text-negative-hover)',
    'var(--tui-text-positive-hover)',
    'var(--tui-text-primary)',
    'var(--tui-text-tertiary)',
  ];

  get totalVotes(): number {
    return this.pollData.options.reduce((acc: number, opt) => acc + opt.votes, 0);
  }

  get daysRemaining(): number {
    const now = new Date();
    const end = new Date(this.pollData.expirationDate);
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 3600 * 24));
  }

  get isExpired(): boolean {
    return new Date() >= new Date(this.pollData.expirationDate);
  }

  votePercentage(votes: number): number {
    if (this.totalVotes === 0) return 0;
    return Math.round((votes / this.totalVotes) * 100);
  }

  progressColor(index: number): string {
    return this.progressColors[index % this.progressColors.length];
  }

  pluralize(count: number, singular: string, plural: string): string {
    return count === 1 ? `${count} ${singular}` : `${count} ${plural}`;
  }

  onEdit(): void {
    this.edit.emit(this.pollData.id);
  }

  onClose(): void {
    this.close.emit(this.pollData.id);
  }

  onDelete(): void {
    this.dialogs
      .open<boolean>('Tem certeza que deseja excluir esta enquete?', {
        label: 'Confirmar exclusão',
        size: 's',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.delete.emit(this.pollData.id);
        }
      });
  }
}
