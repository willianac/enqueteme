import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PollType } from '../../../../shared/types/Poll';
import { TuiCardLarge, TuiHeader } from "@taiga-ui/layout"
import { TuiAppearance, TuiButton, TuiIcon, TuiSurface, TuiTitle } from '@taiga-ui/core';
import { TuiRepeatTimes } from '@taiga-ui/cdk';

@Component({
  selector: 'app-my-poll-card',
  imports: [CommonModule, TuiCardLarge, TuiSurface, TuiTitle, TuiRepeatTimes, TuiButton, TuiAppearance, TuiTitle, TuiHeader, TuiIcon],
  templateUrl: './my-poll-card.html',
  styleUrl: './my-poll-card.less',
})
export class MyPollCard {
  @Input({ required: true }) pollData!: PollType;

  @Output() edit = new EventEmitter<number>();
  @Output() close = new EventEmitter<number>();
  @Output() delete = new EventEmitter<number>();

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

  onEdit(): void {
    this.edit.emit(this.pollData.id);
  }

  onClose(): void {
    this.close.emit(this.pollData.id);
  }

  onDelete(): void {
    if (confirm('Tem certeza que deseja excluir esta enquete?')) {
      this.delete.emit(this.pollData.id);
    }
  }
}
