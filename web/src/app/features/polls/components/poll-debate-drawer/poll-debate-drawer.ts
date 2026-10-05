import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  inject,
  Input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  TuiAlertService,
  TuiButton,
  TuiIcon,
  TuiLoader,
} from '@taiga-ui/core';
import { TuiButtonClose, TuiDrawer } from '@taiga-ui/kit';
import { PollApi } from '../../services/poll-api';
import { ExplainPollDebateResponse } from '../../../../shared/types/AiInspector';

@Component({
  selector: 'app-poll-debate-drawer',
  standalone: true,
  imports: [
    CommonModule,
    TuiDrawer,
    TuiButton,
    TuiIcon,
    TuiLoader,
    TuiButtonClose,
  ],
  templateUrl: './poll-debate-drawer.html',
  styleUrl: './poll-debate-drawer.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollDebateDrawer implements OnInit {
  private readonly pollApi = inject(PollApi);
  private readonly alerts = inject(TuiAlertService);

  @Input({ required: true }) pollId!: number;
  @Input({ required: true }) pollTitle!: string;
  @Input({ required: true }) options: string[] = [];

  @Output() close = new EventEmitter<void>();

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly explanation = signal<ExplainPollDebateResponse | null>(null);

  ngOnInit(): void {
    this.loadExplanation();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.onClose();
  }

  loadExplanation(): void {
    this.loading.set(true);
    this.error.set(null);

    this.pollApi
      .explainPollDebate({
        pollId: this.pollId,
        title: this.pollTitle,
        options: this.options,
      })
      .subscribe({
        next: (response) => {
          this.explanation.set(response);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(
            'Não foi possível gerar a explicação do debate neste momento. Tente novamente.',
          );
          console.error('Failed to load debate explanation', err);
        },
      });
  }

  onClose(): void {
    this.close.emit();
  }
}
