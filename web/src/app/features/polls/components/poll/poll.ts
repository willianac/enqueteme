import { Component, Input } from '@angular/core';
import { TuiPlatform } from '@taiga-ui/cdk';
import { TuiButton } from '@taiga-ui/core';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { TuiLabel, TuiTitle} from '@taiga-ui/core';
import { TuiPin, TuiProgress, TuiRadio } from '@taiga-ui/kit';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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
export class Poll {
  @Input({ required: true }) title!: string
  @Input({ required: true }) options!: string[]
  @Input({ required: true }) totalVotes!: number
  @Input({ required: true }) daysRemaining!: number

  protected pollForm = new FormGroup({
    option: new FormControl(false)
  });
}
