import { Component } from '@angular/core';
import { Navbar } from "../../../../shared/components/navbar/navbar";
import { TuiCardLarge } from '@taiga-ui/layout';
import { TuiPlatform } from '@taiga-ui/cdk';
import { TuiButton, TuiTextfield, TuiAppearance } from '@taiga-ui/core';
import { TuiButtonClose } from '@taiga-ui/kit';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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
    CommonModule
  ],
  templateUrl: './new-poll.html',
  styleUrl: './new-poll.less',
})
export class NewPoll {
  protected newPollForm: FormGroup = new FormGroup({
    option1: new FormControl(""),
    option2: new FormControl(""),
  });
  
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
}
