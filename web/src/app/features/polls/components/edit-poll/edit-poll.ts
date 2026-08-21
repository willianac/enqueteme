import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Navbar } from '../../../../shared/components/navbar/navbar';
import { PollApi } from '../../services/poll-api';
import { PollType } from '../../../../shared/types/Poll';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { TuiValidationError } from '@taiga-ui/cdk';
import {
  TuiButton,
  TuiTextfield,
  TuiSurface,
  TuiError,
  TuiLabel,
  TuiTitle,
} from '@taiga-ui/core';
import { TuiButtonClose, TuiSwitch } from '@taiga-ui/kit';

@Component({
  selector: 'app-edit-poll',
  imports: [
    CommonModule,
    Navbar,
    ReactiveFormsModule,
    RouterLink,
    TuiCardLarge,
    TuiHeader,
    TuiButton,
    TuiTextfield,
    TuiSurface,
    TuiError,
    TuiLabel,
    TuiTitle,
    TuiButtonClose,
    TuiSwitch,
  ],
  templateUrl: './edit-poll.html',
  styleUrl: './edit-poll.less',
})
export class EditPoll implements OnInit {
  private readonly pollApi = inject(PollApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal<TuiValidationError | null>(null);
  readonly pollNotFound = signal(false);

  pollId = 0;

  editForm = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    options: new FormArray<FormControl<string>>([]),
    voteRequireLogin: new FormControl(false),
    pollExpirationInDays: new FormControl<number | null>(null, {
      validators: [Validators.min(1)],
    }),
  });

  ngOnInit(): void {
    this.pollId = Number(this.route.snapshot.paramMap.get('id'));
    this.pollApi.getMyPolls().subscribe({
      next: (polls) => {
        const poll = polls.find((p) => p.id === this.pollId);
        if (!poll) {
          this.pollNotFound.set(true);
          this.loading.set(false);
          return;
        }
        this.prefillForm(poll);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set(new TuiValidationError('Não foi possível carregar a enquete.'));
        this.loading.set(false);
      },
    });
  }

  get options(): FormArray<FormControl<string>> {
    return this.editForm.get('options') as FormArray<FormControl<string>>;
  }

  addOption(): void {
    this.options.push(new FormControl('', { nonNullable: true, validators: [Validators.required] }));
  }

  removeOption(index: number): void {
    if (this.options.length > 2) {
      this.options.removeAt(index);
    }
  }

  onSubmit(): void {
    if (this.editForm.invalid) {
      return;
    }

    const raw = this.editForm.getRawValue();
    const trimmedOptions = raw.options.map((o) => o.trim()).filter((o) => o !== '');

    if (trimmedOptions.length < 2) {
      this.errorMessage.set(new TuiValidationError('A enquete precisa de pelo menos 2 opções.'));
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);

    this.pollApi
      .updatePoll(this.pollId, {
        title: raw.title.trim(),
        options: trimmedOptions,
        voteRequireLogin: raw.voteRequireLogin ?? false,
        pollExpirationInDays: raw.pollExpirationInDays ?? undefined,
      })
      .subscribe({
        next: () => this.router.navigate(['/my-polls']),
        error: (err) => {
          this.saving.set(false);
          if (err.status === 409) {
            this.errorMessage.set(new TuiValidationError('Esta enquete já possui votos e não pode ser editada.'));
          } else if (err.status === 403 || err.status === 404) {
            this.errorMessage.set(new TuiValidationError('Enquete não encontrada.'));
          } else {
            this.errorMessage.set(new TuiValidationError('Não foi possível salvar as alterações.'));
          }
        },
      });
  }

  private prefillForm(poll: PollType): void {
    this.editForm.patchValue({
      title: poll.title,
      voteRequireLogin: poll.voteRequireLogin,
    });

    const now = new Date();
    const end = new Date(poll.expirationDate);
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 3600 * 24));
    if (daysLeft > 0) {
      this.editForm.patchValue({ pollExpirationInDays: daysLeft });
    }

    const optionsArray = this.options;
    for (const opt of poll.options) {
      optionsArray.push(
        new FormControl(opt.name, { nonNullable: true, validators: [Validators.required] }),
      );
    }
  }
}
