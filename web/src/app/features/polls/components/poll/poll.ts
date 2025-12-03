import { Component, Input, OnChanges } from '@angular/core';
import { TuiPlatform } from '@taiga-ui/cdk';
import { TuiButton } from '@taiga-ui/core';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { TuiLabel, TuiTitle} from '@taiga-ui/core';
import { TuiPin, TuiProgress, TuiRadio } from '@taiga-ui/kit';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PollType } from '../../../../shared/types/Poll';

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
  @Input({ required: true }) pollData!: PollType;
  daysRemaining = 0;

  protected pollForm = new FormGroup({
    option: new FormControl(false)
  });

  ngOnChanges() {
    const currentDate = new Date();
    const endDate = new Date(this.pollData.expirationDate);
    const timeDiff = endDate.getTime() - currentDate.getTime();
    this.daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
  }
}
