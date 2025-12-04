import { Component, inject, Input, OnChanges } from '@angular/core';
import { TuiPlatform } from '@taiga-ui/cdk';
import { TuiButton } from '@taiga-ui/core';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { TuiLabel, TuiTitle} from '@taiga-ui/core';
import { TuiPin, TuiProgress, TuiRadio } from '@taiga-ui/kit';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PollType } from '../../../../shared/types/Poll';
import { PollApi } from '../../services/poll-api';

@Component({
  selector: 'app-poll',
  imports: [ 
    TuiPlatform, 
    TuiCardLarge, 
    TuiHeader, 
    TuiButton, 
    TuiLabel, 
    TuiTitle, 
    ReactiveFormsModule, 
    TuiRadio, 
    TuiPin, 
    TuiProgress,
    CommonModule
  ],
  templateUrl: './poll.html',
  styleUrl: './poll.less',
})
export class Poll implements OnChanges {
  pollApi = inject(PollApi);
  @Input({ required: true }) pollData!: PollType;
  daysRemaining = 0;
  totalVotes = 0;

  protected pollForm = new FormGroup({
    option: new FormControl(0)
  });

  protected vote() {
    this.pollApi.setVote({
      optionId: this.pollForm.getRawValue().option ?? 0,
      pollId: this.pollData.id
    }).subscribe({
      next: (res) => console.log(res)
    })
  }

  private calcTotalVotes(options: PollType["options"]) {
    this.totalVotes = options.reduce((acc, opt) => {
      return acc + opt.votes;
    }, 0);
  }

  private calcDaysRemaining(date: string) {
    const currentDate = new Date();
    const endDate = new Date(this.pollData.expirationDate);
    const timeDiff = endDate.getTime() - currentDate.getTime();
    this.daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  ngOnChanges() {
    this.calcDaysRemaining(this.pollData.expirationDate);
    this.calcTotalVotes(this.pollData.options);
  }
}
