import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, Input, OnChanges } from '@angular/core';
import { TuiPlatform } from '@taiga-ui/cdk';
import { TuiAlertService, TuiButton, TuiIcon } from '@taiga-ui/core';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { TuiLabel, TuiSurface, TuiTitle} from '@taiga-ui/core';
import { TuiChip, TuiPin, TuiProgress, TuiRadio, TuiMessage, TuiProgressBar } from '@taiga-ui/kit';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PollType } from '../../../../shared/types/Poll';
import { PollApi } from '../../services/poll-api';
import { UserApi } from '../../../auth/services/user-api';
import {
  pluralizePt,
  pollDaysRemaining,
  pollIsExpired,
  pollProgressColor,
  pollTotalVotes,
  pollVotePercentage,
} from '../../../../shared/utils/poll-utils';

@Component({
  selector: 'app-poll',
  imports: [ 
    TuiPlatform, 
    TuiCardLarge, 
    TuiSurface,
    TuiHeader, 
    TuiButton, 
    TuiLabel, 
    TuiTitle, 
    ReactiveFormsModule, 
    TuiRadio, 
    TuiPin, 
    TuiProgress,
    TuiProgressBar,
    TuiIcon,
    TuiChip,
    TuiMessage,
    CommonModule
  ],
  templateUrl: './poll.html',
  styleUrl: './poll.less',
})
export class Poll implements OnChanges {
  readonly pollApi = inject(PollApi);
  readonly userApi = inject(UserApi);
  readonly cdr = inject(ChangeDetectorRef);
  readonly alerts = inject(TuiAlertService);

  @Input({ required: true }) pollData!: PollType;
  
  daysRemaining = 0;
  totalVotes = 0;
  voted = false;
  idOptionChosen: null | number = null;
  noOptionChosenError = false;

  protected pollForm = new FormGroup({
    option: new FormControl<null | number>(null)
  });

  get isExpired(): boolean {
    return pollIsExpired(this.pollData.expirationDate);
  }

  percentage(votes: number): number {
    return pollVotePercentage(votes, this.totalVotes);
  }

  progressColor(index: number): string {
    return pollProgressColor(index);
  }

  pluralize(count: number, singular: string, plural: string): string {
    return pluralizePt(count, singular, plural);
  }

  protected vote() {
    if(!this.pollForm.getRawValue().option) {
      return this.noOptionChosenError = true
    }
    if(!this.isUserAllowedToVote()) {
      return this.alerts.open(
        'É preciso fazer o login antes de votar nesta enquete.', 
        { label: 'Faça o login', appearance: "negative" }
      ).subscribe();
    }
    this.noOptionChosenError = false;
    
    return this.pollApi.setVote({
      optionId: this.pollForm.getRawValue().option ?? 0,
      pollId: this.pollData.id
    }).subscribe({
      next: (res) => {
        this.pollData.options = res.options
        this.calcTotalVotes(this.pollData.options)
        this.idOptionChosen = this.pollForm.getRawValue().option
        this.voted = true
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        this.alerts.open(
          this.voteErrorMessage(error),
          { label: 'Não foi possível votar', appearance: 'negative' },
        ).subscribe();
      },
    })
  }

  private voteErrorMessage(error: HttpErrorResponse) {
    if (error.status === 401) {
      return 'É preciso fazer o login antes de votar nesta enquete.';
    }
    if (error.status === 409) {
      return 'Você já votou nesta enquete.';
    }
    if (error.status === 400 && error.error?.message === 'Poll has expired.') {
      return 'Esta enquete já expirou.';
    }
    return 'Não foi possível registrar o voto. Tente novamente.';
  }

  private calcTotalVotes(options: PollType["options"]) {
    this.totalVotes = pollTotalVotes(options);
  }

  private isUserValid() {
    if(this.pollData.voteRequireLogin) {
      return this.userApi.user() !== null;
    }
    return true
  }

  private isUserAllowedToVote() {
    const currentDate = new Date();
    const endDate = new Date(this.pollData.expirationDate);
    const validUser = this.isUserValid();

    return currentDate < endDate && validUser;
  }

  private calcDaysRemaining(date: string) {
    this.daysRemaining = pollDaysRemaining(date);
  }

  ngOnChanges() {
    this.calcDaysRemaining(this.pollData.expirationDate);
    this.calcTotalVotes(this.pollData.options);
  }
}
