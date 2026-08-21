import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PollType } from '../../../../shared/types/Poll';
import { TuiCardLarge, TuiHeader } from "@taiga-ui/layout"
import { TuiAppearance, TuiButton, TuiDialogService, TuiSurface, TuiTitle } from '@taiga-ui/core';
import { TuiChip, TuiProgressBar } from '@taiga-ui/kit';
import {
  pluralizePt,
  pollDaysRemaining,
  pollIsExpired,
  pollProgressColor,
  pollTotalVotes,
  pollVotePercentage,
} from '../../../../shared/utils/poll-utils';

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

  get totalVotes(): number {
    return pollTotalVotes(this.pollData.options);
  }

  get daysRemaining(): number {
    return pollDaysRemaining(this.pollData.expirationDate);
  }

  get isExpired(): boolean {
    return pollIsExpired(this.pollData.expirationDate);
  }

  votePercentage(votes: number): number {
    return pollVotePercentage(votes, this.totalVotes);
  }

  progressColor(index: number): string {
    return pollProgressColor(index);
  }

  pluralize(count: number, singular: string, plural: string): string {
    return pluralizePt(count, singular, plural);
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
