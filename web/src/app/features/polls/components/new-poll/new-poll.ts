import { Component, inject } from '@angular/core';
import { Navbar } from "../../../../shared/components/navbar/navbar";
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { TuiPlatform, TuiValidationError } from '@taiga-ui/cdk';
import { TuiButton, TuiTextfield, TuiAppearance, TuiIcon, TuiAlertService, TuiError } from '@taiga-ui/core';
import { TuiButtonClose, TuiSlider, TuiSwitch } from '@taiga-ui/kit';

import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PollApi } from '../../services/poll-api';
import { RouterLink } from '@angular/router';

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
    TuiSwitch,
    RouterLink,
    TuiError
  ],
  templateUrl: './new-poll.html',
  styleUrl: './new-poll.less',
})
export class NewPoll {
  readonly pollApi = inject(PollApi);
  readonly alerts = inject(TuiAlertService);

  protected newPollForm: FormGroup = new FormGroup({
    option1: new FormControl(""),
    option2: new FormControl(""),
  });

  protected cannotCreatePollError: TuiValidationError | null = null;

  protected pollTitle: string = "";
  protected pollDuration = 1
  protected requireLogin = true;
  protected readonly labels: number[] = [1, 2, 3, 4, 5, 6, 7];
  
  numberOfOptions = 2;

  pollWasCreated = false;

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

  public onPollCreation() {
    this.alerts.open('Sua enquete foi criada com sucesso!', { label: 'Criada' }).subscribe();
    this.pollWasCreated = true;
  }

  public onPollCreationError(err: any) {
    this.alerts.open('Houve um erro ao criar sua enquete. Tente novamente mais tarde.', { label: 'Erro' }).subscribe();
    console.error(err);
  }

  public isPollCreationAllowed(): boolean {
    const options = this.newPollForm.getRawValue() as Record<string, string>;

    return Object.values(options).every(option => option.trim() !== "") 
      && this.pollTitle.trim() !== ""
      && this.numberOfOptions >= 1
      && this.numberOfOptions <= 5
      && !this.pollWasCreated;
  }

  public createPoll() {
    if(!this.isPollCreationAllowed()) {
      this.cannotCreatePollError = new TuiValidationError('Por favor, preencha todos os campos para criar a enquete.');
      return;
    }
    this.cannotCreatePollError = null;
    const options = this.newPollForm.getRawValue();
    const title = this.pollTitle;
    this.pollApi.createPoll({ 
      title, 
      options: Object.values(options), 
      voteRequireLogin: this.requireLogin, 
      durationDays: this.pollDuration
    }).subscribe({
      next: () => this.onPollCreation(),
      error: (err) => this.onPollCreationError(err)
    });
  }
}
