import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  TuiAlertService,
  TuiButton,
  TuiIcon,
  TuiLoader,
  TuiSurface,
  TuiTitle,
} from '@taiga-ui/core';
import { TuiButtonClose, TuiChip } from '@taiga-ui/kit';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { PollApi } from '../../services/poll-api';
import {
  BiasInspectorIssue,
  InspectPollBiasResponse,
} from '../../../../shared/types/AiInspector';

@Component({
  selector: 'app-neutrality-inspector',
  standalone: true,
  imports: [
    CommonModule,
    TuiButton,
    TuiIcon,
    TuiLoader,
    TuiSurface,
    TuiTitle,
    TuiChip,
    TuiButtonClose,
    TuiCardLarge,
    TuiHeader,
  ],
  templateUrl: './neutrality-inspector.html',
  styleUrl: './neutrality-inspector.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NeutralityInspector {
  private readonly pollApi = inject(PollApi);
  private readonly alerts = inject(TuiAlertService);

  @Input() title = '';
  @Input() options: string[] = [];
  @Input() canAddMoreOptions = true;

  @Output() applyTitle = new EventEmitter<string>();
  @Output() addOption = new EventEmitter<string>();

  readonly loading = signal(false);
  readonly result = signal<InspectPollBiasResponse | null>(null);
  readonly appliedTitle = signal(false);
  readonly addedOptions = signal<Set<string>>(new Set());

  get canInspect(): boolean {
    const validTitle = this.title.trim().length >= 3;
    const validOptions = this.options.filter((o) => o.trim().length > 0).length >= 2;
    return validTitle && validOptions && !this.loading();
  }

  inspect(): void {
    const validOptions = this.options.filter((o) => o.trim().length > 0);
    if (this.title.trim().length < 3 || validOptions.length < 2) {
      this.alerts
        .open(
          'Preencha o título e pelo menos 2 opções para inspecionar a neutralidade com IA.',
          { label: 'Campos incompletos', appearance: 'warning' },
        )
        .subscribe();
      return;
    }

    this.loading.set(true);
    this.appliedTitle.set(false);
    this.addedOptions.set(new Set());

    this.pollApi
      .inspectPollBias({
        title: this.title.trim(),
        options: validOptions,
      })
      .subscribe({
        next: (res) => {
          this.result.set(res);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          console.error(err);
          this.alerts
            .open(
              'Não foi possível analisar a enquete no momento. Tente novamente mais tarde.',
              { label: 'Erro ao inspecionar', appearance: 'negative' },
            )
            .subscribe();
        },
      });
  }

  onApplyTitle(suggestedTitle: string): void {
    this.applyTitle.emit(suggestedTitle);
    this.appliedTitle.set(true);
    this.alerts
      .open('Título neutro aplicado à enquete!', { label: 'Atualizado', appearance: 'positive' })
      .subscribe();
  }

  onAddOption(option: string): void {
    if (!this.canAddMoreOptions) {
      this.alerts
        .open('Limite máximo de 5 opções atingido.', { label: 'Aviso', appearance: 'warning' })
        .subscribe();
      return;
    }
    this.addOption.emit(option);
    this.addedOptions.update((prev) => {
      const next = new Set(prev);
      next.add(option);
      return next;
    });
    this.alerts
      .open(`Opção "${option}" adicionada!`, { label: 'Opção adicionada', appearance: 'positive' })
      .subscribe();
  }

  dismiss(): void {
    this.result.set(null);
  }

  getScoreAppearance(score: number): string {
    if (score >= 80) return 'positive';
    if (score >= 50) return 'warning';
    return 'negative';
  }

  getScoreLabel(score: number): string {
    if (score >= 80) return 'Neutro e Equilibrado';
    if (score >= 50) return 'Sugestões de Ajuste';
    return 'Viés Detectado';
  }

  getIssueTypeLabel(type: BiasInspectorIssue['type']): string {
    switch (type) {
      case 'leading_question':
        return 'Pergunta Indutiva';
      case 'missing_alternatives':
        return 'Alternativa Ausente';
      case 'missing_escape_hatch':
        return 'Válvula de Escape Ausente';
      default:
        return 'Qualidade';
    }
  }

  getIssueChipAppearance(severity: BiasInspectorIssue['severity']): string {
    switch (severity) {
      case 'critical':
        return 'negative';
      case 'warning':
        return 'warning';
      default:
        return 'neutral';
    }
  }
}
