import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TuiAlertService } from '@taiga-ui/core';
import { of, throwError } from 'rxjs';
import { PollApi } from '../../services/poll-api';
import { PollCopilot } from './poll-copilot';
import { GeneratePollResponse } from '../../../../shared/types/AiInspector';

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

  const pollApiMock = {
    generatePoll: vi.fn().mockReturnValue(of(mockResponse)),
  };

  const alertServiceMock = {
    open: vi.fn().mockReturnValue(of(undefined)),
  };

  beforeEach(async () => {
    pollApiMock.generatePoll.mockClear();
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
  });

  it('disables generate button when prompt is empty or too short', () => {
    component.prompt.set('ab');
    fixture.detectChanges();
    expect(component.canGenerate()).toBe(false);
  });

  it('enables generate button when prompt has at least 3 characters', () => {
    component.prompt.set('Bancos para analytics');
    fixture.detectChanges();
    expect(component.canGenerate()).toBe(true);
  });

  it('uses inspiration topic and generates', () => {
    component.useTopic('TypeScript vs Rust para novas APIs');
    expect(component.prompt()).toBe('TypeScript vs Rust para novas APIs');
    expect(pollApiMock.generatePoll).toHaveBeenCalled();
  });

  it('calls pollApi and sets generated result and title', () => {
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

  it('emits applyPoll when user applies generated poll', () => {
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

  it('handles API errors gracefully and notifies user', () => {
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
