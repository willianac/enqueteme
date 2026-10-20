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
import {
  GeneratePollFromContentResponse,
  GeneratePollResponse,
} from '../../../../shared/types/AiInspector';

export type CopilotMode = 'quick' | 'content';
export type ContentSubMode = 'url' | 'text';

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
  @Output() applyContentPoll = new EventEmitter<GeneratePollFromContentResponse>();
  @Output() addOption = new EventEmitter<string>();

  readonly mode = signal<CopilotMode>('quick');
  readonly contentSubMode = signal<ContentSubMode>('url');

  readonly prompt = signal('');
  readonly contentUrl = signal('');
  readonly contentText = signal('');

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

  readonly isValidUrl = computed(() => {
    const raw = this.contentUrl().trim();
    try {
      const parsed = new URL(raw);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  });

  readonly isValidText = computed(() => {
    return this.contentText().trim().length >= 50;
  });

  readonly canGenerateFromContent = computed(() => {
    if (this.loading()) return false;
    if (this.contentSubMode() === 'url') {
      return this.isValidUrl();
    }
    return this.isValidText();
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

  setMode(mode: CopilotMode): void {
    this.mode.set(mode);
  }

  setContentSubMode(subMode: ContentSubMode): void {
    this.contentSubMode.set(subMode);
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

  generateFromContent(): void {
    const subMode = this.contentSubMode();
    if (subMode === 'url') {
      const url = this.contentUrl().trim();
      if (!this.isValidUrl()) {
        this.alerts
          .open('Por favor, insira uma URL válida iniciando com http:// ou https://', {
            label: 'URL inválida',
            appearance: 'warning',
          })
          .subscribe();
        return;
      }

      this.loading.set(true);
      this.pollApi.generatePollFromContent('url', url).subscribe({
        next: (res) => {
          this.loading.set(false);
          this.applyContentPoll.emit(res);
        },
        error: (err) => {
          this.loading.set(false);
          console.error(err);
          this.alerts
            .open(
              "Não foi possível ler a página. Se o site exigir login ou bloquear leitura, copie e cole o texto na aba 'Colar Texto'.",
              { label: 'Erro ao processar URL', appearance: 'negative' },
            )
            .subscribe();
        },
      });
    } else {
      const text = this.contentText().trim();
      if (!this.isValidText()) {
        this.alerts
          .open('Cole um texto com pelo menos 50 caracteres para gerar a enquete.', {
            label: 'Texto muito curto',
            appearance: 'warning',
          })
          .subscribe();
        return;
      }

      this.loading.set(true);
      this.pollApi.generatePollFromContent('text', text).subscribe({
        next: (res) => {
          this.loading.set(false);
          this.applyContentPoll.emit(res);
        },
        error: (err) => {
          this.loading.set(false);
          console.error(err);
          this.alerts
            .open(
              'Não foi possível processar o texto fornecido. Tente novamente mais tarde.',
              { label: 'Erro ao processar texto', appearance: 'negative' },
            )
            .subscribe();
        },
      });
    }
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
