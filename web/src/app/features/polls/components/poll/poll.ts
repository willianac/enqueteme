import { Component } from '@angular/core';
import { TuiPlatform } from '@taiga-ui/cdk';
import { TuiButton } from '@taiga-ui/core';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { TuiLabel, TuiTitle} from '@taiga-ui/core';
import { TuiPin, TuiRadio } from '@taiga-ui/kit';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-poll',
  imports: [TuiPlatform, TuiCardLarge, TuiHeader, TuiButton, TuiLabel, TuiTitle, ReactiveFormsModule, TuiRadio, TuiPin],
  templateUrl: './poll.html',
  styleUrl: './poll.less',
})
export class Poll {
  protected pollForm = new FormGroup({
    option: new FormControl(false)
  });
}
