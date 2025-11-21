import { Component } from '@angular/core';
import { TuiPlatform } from '@taiga-ui/cdk';
import { TuiButton } from '@taiga-ui/core';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { TuiLabel, TuiTitle} from '@taiga-ui/core';
import { TuiCheckbox } from '@taiga-ui/kit';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-poll',
  imports: [TuiPlatform, TuiCardLarge, TuiHeader, TuiButton, TuiCheckbox, TuiLabel, TuiTitle, ReactiveFormsModule],
  templateUrl: './poll.html',
  styleUrl: './poll.less',
})
export class Poll {
   protected testForm = new FormGroup({
        testValue1: new FormControl(false),
        testValue2: new FormControl(false),
        testValue3: new FormControl(false),
    });

}
