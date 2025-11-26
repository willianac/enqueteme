import { Component, inject } from '@angular/core';
import { Navbar } from "../../../../shared/components/navbar/navbar";
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { TuiPlatform } from '@taiga-ui/cdk';
import { TuiButton, TuiTextfield, TuiAppearance, TuiIcon } from '@taiga-ui/core';
import { TuiButtonClose, TuiSlider, TuiSwitch } from '@taiga-ui/kit';

import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PollApi } from '../../services/poll-api';

@Component({
  selector: 'app-new-poll',
  imports: [
    Navbar,
    TuiCardLarge,
    TuiPlatform,
    TuiButton,
    TuiTextfield,
    TuiAppearance,
    TuiButtonClose,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    TuiHeader,
    TuiIcon,
    TuiSlider,
    TuiSwitch
  ],
  templateUrl: './new-poll.html',
  styleUrl: './new-poll.less',
})
export class NewPoll {
  pollApi = inject(PollApi);

  protected newPollForm: FormGroup = new FormGroup({
    option1: new FormControl(""),
    option2: new FormControl(""),
  });

  protected pollTitle: string = "";
  protected pollDuration = 1
  protected requireLogin = true;
  protected readonly labels: number[] = [1, 2, 3, 4, 5, 6, 7];
  
  numberOfOptions = 2;

  public addOption() {
    this.numberOfOptions += 1;
    this.newPollForm.addControl(`option${this.numberOfOptions}`, new FormControl<string>("", { nonNullable: true }));
  }

  public getOptionsKeys(): string[] {
    return Object.keys(this.newPollForm.controls);
  }

  public removeOption(e: string) {
    if (this.numberOfOptions > 2) {
      this.newPollForm.removeControl(e);
      this.numberOfOptions -= 1;
    }
  }

  public createPoll() {
    const options = this.newPollForm.getRawValue();
    const title = this.pollTitle;
    this.pollApi.createPoll({ title, options: Object.values(options) }).subscribe({
      next: (response) => {
        console.log('Poll created successfully:', response);
      },
      error: (error) => {
        console.error('Error creating poll:', error);
      }
    });
  }
}
