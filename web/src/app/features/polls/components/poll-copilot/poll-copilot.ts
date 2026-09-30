import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  TuiAlertService,
  TuiButton,
  TuiIcon,
  TuiLoader,
  TuiTextfield,
} from '@taiga-ui/core';
import { TuiButtonClose, TuiChip } from '@taiga-ui/kit';
import { PollApi } from '../../services/poll-api';
import { GeneratePollResponse } from '../../../../shared/types/AiInspector';

@Component({
  selector: 'app-poll-copilot',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TuiButton,
    TuiIcon,
    TuiLoader,
    TuiTextfield,
    TuiChip,
    TuiButtonClose,
  ],
  templateUrl: './poll-copilot.html',
  styleUrl: './poll-copilot.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollCopilot implements OnInit {
  private readonly pollApi = inject(PollApi);
  private readonly alerts = inject(TuiAlertService);

  @Input() initialPrompt = '';
  @Input() currentOptions: string[] = [];
  @Input() canAddMoreOptions = true;

  @Output() applyPoll = new EventEmitter<{ title: string; options: string[] }>();
  @Output() addOption = new EventEmitter<string>();

  readonly prompt = signal('');
  readonly loading = signal(false);
  readonly result = signal<GeneratePollResponse | null>(null);
  readonly customTitle = signal('');
  readonly selectedOptions = signal<Set<string>>(new Set());

  readonly inspirationTopics = [
    'Melhor banco para analytics em tempo real',
    'TypeScript vs Rust para novas APIs',
    'Retorno ao escritório: presencial, híbrido ou remoto?',
    'Qual metodologia ágil sua equipe realmente usa?',
  ];

  readonly canGenerate = computed(() => {
    return this.prompt().trim().length >= 3 && !this.loading();
  });

  readonly selectedCount = computed(() => {
    return this.selectedOptions().size;
  });

  readonly canApply = computed(() => {
    return (
      this.customTitle().trim().length >= 3 &&
      this.selectedCount() >= 2 &&
      this.selectedCount() <= 5 &&
      !this.loading()
    );
  });

  ngOnInit(): void {
    if (this.initialPrompt) {
      this.prompt.set(this.initialPrompt);
    }
  }

  useTopic(topic: string): void {
    this.prompt.set(topic);
    this.generate();
  }

  generate(): void {
    const trimmedPrompt = this.prompt().trim();
    if (trimmedPrompt.length < 3) {
      this.alerts
        .open('Digite um tema ou ideia com pelo menos 3 caracteres.', {
          label: 'Tema muito curto',
          appearance: 'warning',
        })
        .subscribe();
      return;
    }

    this.loading.set(true);

    const validCurrentOptions = this.currentOptions.filter(
      (opt) => opt.trim().length > 0,
    );

    this.pollApi
      .generatePoll({
        prompt: trimmedPrompt,
        currentOptions:
          validCurrentOptions.length > 0 ? validCurrentOptions : undefined,
      })
      .subscribe({
        next: (res) => {
          this.result.set(res);
          this.customTitle.set(res.title);
          this.selectedOptions.set(new Set(res.options));
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          console.error(err);
          this.alerts
            .open(
              'Não foi possível gerar a enquete no momento. Tente novamente mais tarde.',
              { label: 'Erro ao gerar', appearance: 'negative' },
            )
            .subscribe();
        },
      });
  }

  toggleOption(option: string): void {
    const current = new Set(this.selectedOptions());
    if (current.has(option)) {
      if (current.size <= 2) {
        this.alerts
          .open('A enquete precisa de no mínimo 2 opções.', {
            label: 'Mínimo de opções',
            appearance: 'warning',
          })
          .subscribe();
        return;
      }
      current.delete(option);
    } else {
      if (current.size >= 5) {
        this.alerts
          .open('O limite máximo é de 5 opções.', {
            label: 'Limite atingido',
            appearance: 'warning',
          })
          .subscribe();
        return;
      }
      current.add(option);
    }
    this.selectedOptions.set(current);
  }

  onApply(): void {
    const res = this.result();
    if (!res || !this.canApply()) return;

    // Preserve original AI order for selected options
    const finalOptions = res.options.filter((opt) =>
      this.selectedOptions().has(opt),
    );

    this.applyPoll.emit({
      title: this.customTitle().trim(),
      options: finalOptions,
    });
  }

  onAddSingle(option: string): void {
    if (!this.canAddMoreOptions) {
      this.alerts
        .open('Limite máximo de 5 opções já atingido.', {
          label: 'Aviso',
          appearance: 'warning',
        })
        .subscribe();
      return;
    }
    this.addOption.emit(option);
    this.alerts
      .open(`Opção "${option}" adicionada!`, {
        label: 'Opção adicionada',
        appearance: 'positive',
      })
      .subscribe();
  }

  dismiss(): void {
    this.result.set(null);
  }
}
