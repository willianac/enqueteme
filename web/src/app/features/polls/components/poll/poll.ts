import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, DestroyRef, inject, Input, OnChanges } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TuiPlatform } from '@taiga-ui/cdk';
import { TuiAlertService, TuiButton, TuiIcon } from '@taiga-ui/core';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { TuiLabel, TuiSurface, TuiTitle } from '@taiga-ui/core';
import {
  TuiChip,
  TuiPin,
  TuiProgress,
  TuiRadio,
  TuiCheckbox,
  TuiMessage,
  TuiProgressBar,
} from '@taiga-ui/kit';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PollType } from '../../../../shared/types/Poll';
import { PollApi } from '../../services/poll-api';
import { UserApi } from '../../../auth/services/user-api';
import { RouterLink } from '@angular/router';
import { PollDebateDrawer } from '../poll-debate-drawer/poll-debate-drawer';
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
    TuiCheckbox,
    TuiPin,
    TuiProgress,
    TuiProgressBar,
    TuiIcon,
    TuiChip,
    TuiMessage,
    CommonModule,
    RouterLink,
    PollDebateDrawer,
  ],
  templateUrl: './poll.html',
  styleUrl: './poll.less',
})
export class Poll implements OnChanges {
  readonly pollApi = inject(PollApi);
  readonly userApi = inject(UserApi);
  readonly cdr = inject(ChangeDetectorRef);
  readonly alerts = inject(TuiAlertService);
  readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) pollData!: PollType;

  daysRemaining = 0;
  totalVotes = 0;
  voted = false;
  idOptionChosen: null | number = null;
  votedOptionIds: number[] = [];
  selectedOptionIds = new Set<number>();
  readonly optionControls = new Map<number, FormControl<boolean>>();
  private lastPollId: number | null = null;
  noOptionChosenError = false;
  copied = false;
  isDebateDrawerOpen = false;

  get pollOptionsNames(): string[] {
    return this.pollData.options?.map((o) => o.name) ?? [];
  }

  get isMaxChoicesReached(): boolean {
    return Boolean(
      this.pollData.allowMultiple &&
        this.pollData.maxChoices &&
        this.selectedOptionIds.size >= this.pollData.maxChoices,
    );
  }

  isOptionDisabled(optionId: number): boolean {
    const control = this.optionControls.get(optionId);
    if (control) {
      return control.disabled;
    }
    return Boolean(this.isMaxChoicesReached && !this.selectedOptionIds.has(optionId));
  }

  get selectionRuleText(): string {
    if (!this.pollData.allowMultiple) {
      return '';
    }
    if (this.pollData.maxChoices) {
      return `Múltipla escolha • Escolha até ${this.pollData.maxChoices} opções`;
    }
    return 'Múltipla escolha • Selecione todas que se aplicam';
  }

  getOptionControl(optionId: number): FormControl<boolean> {
    let control = this.optionControls.get(optionId);
    if (!control) {
      const isSelected = this.selectedOptionIds.has(optionId);
      control = new FormControl(isSelected, { nonNullable: true });
      control.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((checked) => {
        this.onOptionChange(optionId, checked);
      });
      this.optionControls.set(optionId, control);
    }
    return control;
  }

  private onOptionChange(optionId: number, checked: boolean): void {
    if (checked) {
      this.selectedOptionIds.add(optionId);
    } else {
      this.selectedOptionIds.delete(optionId);
    }
    this.noOptionChosenError = false;
    this.updateControlsDisabledState();
    this.cdr.markForCheck();
  }

  private updateControlsDisabledState(): void {
    const isCapReached = Boolean(
      this.pollData?.allowMultiple &&
        this.pollData?.maxChoices &&
        this.selectedOptionIds.size >= this.pollData.maxChoices,
    );

    for (const [id, control] of this.optionControls.entries()) {
      const isSelected = this.selectedOptionIds.has(id);
      if (isCapReached && !isSelected) {
        if (control.enabled) {
          control.disable({ emitEvent: false });
        }
      } else {
        if (control.disabled) {
          control.enable({ emitEvent: false });
        }
      }
    }
  }

  toggleOption(optionId: number, checked: boolean): void {
    const control = this.getOptionControl(optionId);
    if (
      checked &&
      this.pollData.maxChoices &&
      this.selectedOptionIds.size >= this.pollData.maxChoices &&
      !this.selectedOptionIds.has(optionId)
    ) {
      return;
    }
    control.setValue(checked);
  }

  isOptionChosen(optionId: number): boolean {
    return this.votedOptionIds.includes(optionId) || this.idOptionChosen === optionId;
  }

  explainDebate(event?: Event): void {
    event?.stopPropagation();
    if (!this.userApi.user()) {
      this.alerts
        .open('É necessário fazer login para ver a explicação do debate com IA.', {
          label: 'Faça login',
          appearance: 'warning',
        })
        .subscribe();
      return;
    }
    this.isDebateDrawerOpen = true;
  }

  protected pollForm = new FormGroup({
    option: new FormControl<null | number>(null),
  });

  get isExpired(): boolean {
    return pollIsExpired(this.pollData.expirationDate);
  }

  percentage(votes: number): number {
    const total = this.pollData.allowMultiple
      ? (this.pollData.totalVoters ?? 0)
      : this.totalVotes;
    return pollVotePercentage(votes, total);
  }

  progressColor(isChosenOrIndex: boolean | number): string {
    return pollProgressColor(isChosenOrIndex);
  }

  copyShareLink(event?: Event): void {
    event?.stopPropagation();
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/polls/${this.pollData.id}`
        : `/polls/${this.pollData.id}`;

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        this.copied = true;
        this.cdr.markForCheck();
        this.alerts
          .open('Link da enquete copiado para a área de transferência!', {
            label: 'Link copiado',
            appearance: 'positive',
          })
          .subscribe();
        setTimeout(() => {
          this.copied = false;
          this.cdr.markForCheck();
        }, 2000);
      });
    }
  }

  pluralize(count: number, singular: string, plural: string): string {
    return pluralizePt(count, singular, plural);
  }

  protected vote() {
    let optionIds: number[];
    if (this.pollData.allowMultiple) {
      optionIds = Array.from(this.selectedOptionIds);
    } else {
      const chosen = this.pollForm.getRawValue().option;
      optionIds = chosen !== null && chosen !== undefined ? [chosen] : [];
    }

    if (optionIds.length === 0) {
      this.noOptionChosenError = true;
      return;
    }
    if (this.isExpired) {
      return this.alerts
        .open('Esta enquete já expirou.', {
          label: 'Não foi possível votar',
          appearance: 'negative',
        })
        .subscribe();
    }
    if (!this.isUserValid()) {
      return this.alerts
        .open('É preciso fazer o login antes de votar nesta enquete.', {
          label: 'Faça o login',
          appearance: 'negative',
        })
        .subscribe();
    }
    this.noOptionChosenError = false;

    return this.pollApi
      .setVote({
        pollId: this.pollData.id,
        optionIds,
      })
      .subscribe({
        next: (res) => {
          this.pollData.options = res.options;
          this.pollData.totalVoters =
            res.totalVoters ?? (this.pollData.totalVoters ?? 0) + 1;
          this.calcTotalVotes(this.pollData.options);
          this.voted = true;
          this.votedOptionIds = res.votedOptionIds ?? optionIds;
          this.idOptionChosen = this.votedOptionIds[0] ?? null;
          this.cdr.detectChanges();
        },
        error: (error: HttpErrorResponse) => {
          this.alerts
            .open(this.voteErrorMessage(error), {
              label: 'Não foi possível votar',
              appearance: 'negative',
            })
            .subscribe();
        },
      });
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
    if (error.status === 400 && typeof error.error?.message === 'string') {
      return error.error.message;
    }
    return 'Não foi possível registrar o voto. Tente novamente.';
  }

  private calcTotalVotes(options: PollType['options']) {
    this.totalVotes = pollTotalVotes(options);
  }

  private isUserValid() {
    if (this.pollData.voteRequireLogin) {
      return this.userApi.user() !== null;
    }
    return true;
  }

  private calcDaysRemaining(date: string) {
    this.daysRemaining = pollDaysRemaining(date);
  }

  ngOnChanges() {
    this.calcDaysRemaining(this.pollData.expirationDate);
    this.calcTotalVotes(this.pollData.options);
    this.voted = Boolean(this.pollData.hasVoted);
    this.votedOptionIds =
      this.pollData.votedOptionIds ??
      (this.pollData.votedOptionId ? [this.pollData.votedOptionId] : []);
    if (this.voted) {
      this.idOptionChosen = this.votedOptionIds[0] ?? this.pollData.votedOptionId ?? null;
    }

    if (this.lastPollId !== this.pollData.id) {
      this.lastPollId = this.pollData.id;
      this.selectedOptionIds.clear();
      this.optionControls.clear();
      this.pollForm.reset({ option: null });
    }

    if (this.pollData.allowMultiple && this.pollData.options) {
      for (const opt of this.pollData.options) {
        this.getOptionControl(opt.id);
      }
      this.updateControlsDisabledState();
    }
  }
}
