import { Component, inject, OnInit, signal } from '@angular/core';
import { Navbar } from '../../../../shared/components/navbar/navbar';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { TuiPlatform, TuiValidationError } from '@taiga-ui/cdk';
import {
  TuiButton,
  TuiTextfield,
  TuiAppearance,
  TuiIcon,
  TuiAlertService,
  TuiError,
  TuiSurface,
  TuiLoader,
} from '@taiga-ui/core';
import { TuiButtonClose, TuiSlider, TuiSwitch, TuiTabs } from '@taiga-ui/kit';

import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PollApi } from '../../services/poll-api';
import { RouterLink } from '@angular/router';
import { UserApi } from '../../../auth/services/user-api';
import { NeutralityInspector } from '../neutrality-inspector/neutrality-inspector';
import { PollCopilot } from '../poll-copilot/poll-copilot';

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
    TuiError,
    TuiSurface,
    NeutralityInspector,
    PollCopilot,
    TuiTabs,
    TuiLoader,
  ],
  templateUrl: './new-poll.html',
  styleUrl: './new-poll.less',
})
export class NewPoll implements OnInit {
  readonly pollApi = inject(PollApi);
  readonly userApi = inject(UserApi);
  readonly alerts = inject(TuiAlertService);

  protected newPollForm: FormGroup = new FormGroup({
    option1: new FormControl(''),
    option2: new FormControl(''),
  });

  protected cannotCreatePollError: TuiValidationError | null = null;

  protected pollTitle: string = '';
  protected pollDuration = 1;
  protected requireLogin = true;
  protected readonly labels: number[] = [1, 2, 3, 4, 5, 6, 7];

  numberOfOptions = 2;

  pollWasCreated = false;
  activeTabIndex = 0;

  readonly copilotLoading = signal(false);
  readonly showOptionCopilotPreview = signal(false);
  readonly suggestedOptions = signal<string[]>([]);

  public get canSuggestOptionsForTitle(): boolean {
    return this.pollTitle.trim().length >= 3 && !this.copilotLoading();
  }

  public suggestOptionsForTitle(): void {
    if (!this.canSuggestOptionsForTitle) {
      this.alerts
        .open('Digite ao menos 3 caracteres no título para sugerir opções com IA.', {
          label: 'Título muito curto',
          appearance: 'warning',
        })
        .subscribe();
      return;
    }

    this.copilotLoading.set(true);
    const existingOptions = this.getOptionsValues().filter((o) => o.trim().length > 0);

    this.pollApi
      .generatePoll({
        prompt: this.pollTitle.trim(),
        currentOptions: existingOptions.length > 0 ? existingOptions : undefined,
      })
      .subscribe({
        next: (res) => {
          this.suggestedOptions.set(res.options);
          this.showOptionCopilotPreview.set(true);
          this.copilotLoading.set(false);
        },
        error: (err) => {
          this.copilotLoading.set(false);
          console.error(err);
          this.alerts
            .open('Não foi possível sugerir opções no momento.', {
              label: 'Erro com IA',
              appearance: 'negative',
            })
            .subscribe();
        },
      });
  }

  public setOptionsList(options: string[]): void {
    const valid = options.filter((o) => o.trim().length > 0).slice(0, 5);
    const count = Math.max(2, valid.length);
    const newGroup: Record<string, FormControl<string>> = {};
    for (let i = 1; i <= count; i++) {
      newGroup[`option${i}`] = new FormControl<string>(valid[i - 1] || '', { nonNullable: true });
    }
    this.newPollForm = new FormGroup(newGroup);
    this.numberOfOptions = count;
  }

  public onApplyCopilotPoll(poll: { title: string; options: string[] }): void {
    this.pollTitle = poll.title;
    this.setOptionsList(poll.options);
    this.activeTabIndex = 0;
    this.alerts
      .open('Enquete preenchida com sucesso pelo Co-pilot!', {
        label: 'Sucesso',
        appearance: 'positive',
      })
      .subscribe();
  }

  public replaceWithSuggestedOptions(): void {
    const options = this.suggestedOptions();
    if (options.length >= 2) {
      this.setOptionsList(options);
      this.showOptionCopilotPreview.set(false);
      this.alerts
        .open('Opções atualizadas com sucesso!', {
          label: 'Atualizado',
          appearance: 'positive',
        })
        .subscribe();
    }
  }

  public dismissOptionCopilotPreview(): void {
    this.showOptionCopilotPreview.set(false);
  }

  public addOption() {
    this.numberOfOptions += 1;
    this.newPollForm.addControl(
      `option${this.numberOfOptions}`,
      new FormControl<string>('', { nonNullable: true })
    );
  }

  public getOptionsKeys(): string[] {
    return Object.keys(this.newPollForm.controls);
  }

  public getOptionsValues(): string[] {
    const raw = this.newPollForm.getRawValue() as Record<string, string>;
    return Object.values(raw);
  }

  public get canAddMoreOptions(): boolean {
    return this.numberOfOptions < 5;
  }

  public onApplySuggestedTitle(title: string): void {
    this.pollTitle = title;
  }

  public onAddSuggestedOption(optionText: string): void {
    if (this.numberOfOptions >= 5) {
      this.alerts
        .open('Limite máximo de 5 opções já atingido.', { label: 'Aviso', appearance: 'warning' })
        .subscribe();
      return;
    }
    this.numberOfOptions += 1;
    this.newPollForm.addControl(
      `option${this.numberOfOptions}`,
      new FormControl<string>(optionText, { nonNullable: true })
    );
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
    this.alerts
      .open('Houve um erro ao criar sua enquete. Tente novamente mais tarde.', { label: 'Erro' })
      .subscribe();
    console.error(err);
  }

  public isPollCreationAllowed(): boolean {
    const options = this.newPollForm.getRawValue() as Record<string, string>;

    return (
      Object.values(options).every((option) => option.trim() !== '') &&
      this.pollTitle.trim() !== '' &&
      this.numberOfOptions >= 1 &&
      this.numberOfOptions <= 5 &&
      !this.pollWasCreated
    );
  }

  public createPoll() {
    if(!this.userApi.user()) {
      this.alerts.open('Por favor, faça o login antes.', { label: 'Erro', appearance: "negative" }).subscribe();
      return;
    }

    if (!this.isPollCreationAllowed()) {
      this.cannotCreatePollError = new TuiValidationError(
        'Por favor, preencha todos os campos para criar a enquete.'
      );
      return;
    }
    this.cannotCreatePollError = null;
    const options = this.newPollForm.getRawValue();
    const title = this.pollTitle;
    this.pollApi
      .createPoll({
        title,
        options: Object.values(options),
        voteRequireLogin: this.requireLogin,
        durationDays: this.pollDuration,
      })
      .subscribe({
        next: () => this.onPollCreation(),
        error: (err) => this.onPollCreationError(err),
      });
  }

  ngOnInit() {
    if(!this.userApi.user()) {
      this.alerts
      .open('É necessário realizar o login antes de criar uma enquete.', { label: 'Atenção', appearance: "warning" })
      .subscribe();
    }
  }
}
