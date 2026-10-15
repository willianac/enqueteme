import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TuiAlertService } from '@taiga-ui/core';
import { of, throwError } from 'rxjs';
import { PollApi } from '../../services/poll-api';
import { PollCopilot } from './poll-copilot';
import {
  GeneratePollFromContentResponse,
  GeneratePollResponse,
} from '../../../../shared/types/AiInspector';

describe('PollCopilot', () => {
  let component: PollCopilot;
  let fixture: ComponentFixture<PollCopilot>;

  const mockResponse: GeneratePollResponse = {
    title: 'Qual o melhor banco de dados para analytics em tempo real?',
    options: [
      'ClickHouse',
      'Apache Pinot',
      'Rockset / Databricks',
      'PostgreSQL com TimescaleDB',
      'Outro / Ver resultados',
    ],
  };

  const mockContentResponse: GeneratePollFromContentResponse = {
    title: 'Qual a prioridade no roadmap pós-reestruturação?',
    options: ['Foco em estabilidade', 'Novas funcionalidades', 'Redução de custos'],
    contextRationale: 'O artigo aborda o trade-off entre segurança financeira e crescimento acelerado.',
  };

  const pollApiMock = {
    generatePoll: vi.fn().mockReturnValue(of(mockResponse)),
    generatePollFromContent: vi.fn().mockReturnValue(of(mockContentResponse)),
  };

  const alertServiceMock = {
    open: vi.fn().mockReturnValue(of(undefined)),
  };

  beforeEach(async () => {
    pollApiMock.generatePoll.mockClear();
    pollApiMock.generatePollFromContent.mockClear();
    alertServiceMock.open.mockClear();

    await TestBed.configureTestingModule({
      imports: [PollCopilot],
      providers: [
        { provide: PollApi, useValue: pollApiMock },
        { provide: TuiAlertService, useValue: alertServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PollCopilot);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
    expect(component.mode()).toBe('quick');
    expect(component.contentSubMode()).toBe('url');
  });

  it('switches modes between quick and content, and submodes between url and text', () => {
    component.setMode('content');
    expect(component.mode()).toBe('content');

    component.setContentSubMode('text');
    expect(component.contentSubMode()).toBe('text');

    component.setContentSubMode('url');
    expect(component.contentSubMode()).toBe('url');

    component.setMode('quick');
    expect(component.mode()).toBe('quick');
  });

  it('disables generate button when prompt is empty or too short in quick mode', () => {
    component.prompt.set('ab');
    fixture.detectChanges();
    expect(component.canGenerate()).toBe(false);
  });

  it('enables generate button when prompt has at least 3 characters in quick mode', () => {
    component.prompt.set('Bancos para analytics');
    fixture.detectChanges();
    expect(component.canGenerate()).toBe(true);
  });

  it('validates URL correctly in content url mode', () => {
    component.setMode('content');
    component.setContentSubMode('url');

    component.contentUrl.set('invalid-url');
    expect(component.isValidUrl()).toBe(false);
    expect(component.canGenerateFromContent()).toBe(false);

    component.contentUrl.set('ftp://example.com/file');
    expect(component.isValidUrl()).toBe(false);
    expect(component.canGenerateFromContent()).toBe(false);

    component.contentUrl.set('https://techblog.example.com/article/123');
    expect(component.isValidUrl()).toBe(true);
    expect(component.canGenerateFromContent()).toBe(true);
  });

  it('validates text length correctly in content text mode (minimum 50 chars)', () => {
    component.setMode('content');
    component.setContentSubMode('text');

    component.contentText.set('Texto muito curto.');
    expect(component.isValidText()).toBe(false);
    expect(component.canGenerateFromContent()).toBe(false);

    component.contentText.set(
      'Este é um texto longo o suficiente com mais de 50 caracteres para ser analisado pela IA com sucesso.',
    );
    expect(component.isValidText()).toBe(true);
    expect(component.canGenerateFromContent()).toBe(true);
  });

  it('calls generatePollFromContent with URL and emits applyContentPoll', () => {
    component.setMode('content');
    component.setContentSubMode('url');
    component.contentUrl.set('https://exemplo.com/artigo-reestruturacao');

    const emitSpy = vi.spyOn(component.applyContentPoll, 'emit');

    component.generateFromContent();

    expect(pollApiMock.generatePollFromContent).toHaveBeenCalledWith(
      'url',
      'https://exemplo.com/artigo-reestruturacao',
    );
    expect(component.loading()).toBe(false);
    expect(emitSpy).toHaveBeenCalledWith(mockContentResponse);
  });

  it('calls generatePollFromContent with text and emits applyContentPoll', () => {
    component.setMode('content');
    component.setContentSubMode('text');
    const validText =
      'Reunião sobre corte de custos versus investimento em novas features para o próximo trimestre.';
    component.contentText.set(validText);

    const emitSpy = vi.spyOn(component.applyContentPoll, 'emit');

    component.generateFromContent();

    expect(pollApiMock.generatePollFromContent).toHaveBeenCalledWith('text', validText);
    expect(component.loading()).toBe(false);
    expect(emitSpy).toHaveBeenCalledWith(mockContentResponse);
  });

  it('handles URL generation errors with contextual contingency message', () => {
    pollApiMock.generatePollFromContent.mockReturnValueOnce(
      throwError(() => new Error('SSRF or Blocked')),
    );
    component.setMode('content');
    component.setContentSubMode('url');
    component.contentUrl.set('https://exemplo.com/bloqueado');

    component.generateFromContent();

    expect(component.loading()).toBe(false);
    expect(alertServiceMock.open).toHaveBeenCalledWith(
      "Não foi possível ler a página. Se o site exigir login ou bloquear leitura, copie e cole o texto na aba 'Colar Texto'.",
      expect.objectContaining({
        label: 'Erro ao processar URL',
        appearance: 'negative',
      }),
    );
  });

  it('uses inspiration topic and generates', () => {
    component.useTopic('TypeScript vs Rust para novas APIs');
    expect(component.prompt()).toBe('TypeScript vs Rust para novas APIs');
    expect(pollApiMock.generatePoll).toHaveBeenCalled();
  });

  it('calls pollApi and sets generated result and title in quick mode', () => {
    component.prompt.set('Analytics em tempo real');
    component.generate();

    expect(pollApiMock.generatePoll).toHaveBeenCalledWith({
      prompt: 'Analytics em tempo real',
      currentOptions: undefined,
    });
    expect(component.loading()).toBe(false);
    expect(component.result()).toEqual(mockResponse);
    expect(component.customTitle()).toBe(mockResponse.title);
    expect(component.selectedCount()).toBe(5);
  });

  it('toggles option selection and enforces minimum of 2 options', () => {
    component.result.set(mockResponse);
    component.customTitle.set(mockResponse.title);
    component.selectedOptions.set(new Set(['ClickHouse', 'Apache Pinot', 'Rockset']));
    fixture.detectChanges();

    // Toggle off Rockset -> now 2
    component.toggleOption('Rockset');
    expect(component.selectedOptions().has('Rockset')).toBe(false);
    expect(component.selectedCount()).toBe(2);

    // Attempting to toggle off Apache Pinot when only 2 remain should be prevented
    component.toggleOption('Apache Pinot');
    expect(component.selectedOptions().has('Apache Pinot')).toBe(true);
    expect(alertServiceMock.open).toHaveBeenCalled();
  });

  it('emits applyPoll when user applies generated poll in quick mode', () => {
    const emitSpy = vi.spyOn(component.applyPoll, 'emit');
    component.result.set(mockResponse);
    component.customTitle.set('Título customizado pelo usuário?');
    component.selectedOptions.set(new Set(['ClickHouse', 'Apache Pinot']));
    fixture.detectChanges();

    component.onApply();

    expect(emitSpy).toHaveBeenCalledWith({
      title: 'Título customizado pelo usuário?',
      options: ['ClickHouse', 'Apache Pinot'],
    });
  });

  it('handles API errors gracefully and notifies user in quick mode', () => {
    pollApiMock.generatePoll.mockReturnValueOnce(
      throwError(() => new Error('AI Service Unavailable')),
    );
    component.prompt.set('Banco de dados');

    component.generate();

    expect(component.loading()).toBe(false);
    expect(component.result()).toBeNull();
    expect(alertServiceMock.open).toHaveBeenCalled();
  });

  it('dismisses result when dismiss is called', () => {
    component.result.set(mockResponse);
    fixture.detectChanges();

    component.dismiss();
    expect(component.result()).toBeNull();
  });
});
