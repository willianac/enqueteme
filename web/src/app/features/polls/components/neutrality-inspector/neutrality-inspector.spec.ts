import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TuiAlertService } from '@taiga-ui/core';
import { of, throwError } from 'rxjs';
import { PollApi } from '../../services/poll-api';
import { NeutralityInspector } from './neutrality-inspector';
import { InspectPollBiasResponse } from '../../../../shared/types/AiInspector';

describe('NeutralityInspector', () => {
  let component: NeutralityInspector;
  let fixture: ComponentFixture<NeutralityInspector>;

  const mockResponse: InspectPollBiasResponse = {
    isNeutral: false,
    score: 65,
    summary: 'A pergunta apresenta viés indutivo sutil.',
    issues: [
      {
        type: 'leading_question',
        severity: 'warning',
        title: 'Pergunta indutiva',
        description: 'A pergunta sugere concordância prévia.',
        suggestion: 'Reformule para tom neutro.',
      },
      {
        type: 'missing_escape_hatch',
        severity: 'info',
        title: 'Sem válvula de escape',
        description: 'Falta opção para quem não concorda com nenhuma.',
        suggestion: 'Adicione "Outro" ou "Nenhum".',
      },
    ],
    suggestedTitle: 'Qual a sua opinião sobre o framework X?',
    suggestedOptionsToAdd: ['Nenhum dos anteriores', 'Outro'],
  };

  const pollApiMock = {
    inspectPollBias: vi.fn().mockReturnValue(of(mockResponse)),
  };

  const alertServiceMock = {
    open: vi.fn().mockReturnValue(of(undefined)),
  };

  beforeEach(async () => {
    pollApiMock.inspectPollBias.mockClear();
    alertServiceMock.open.mockClear();

    await TestBed.configureTestingModule({
      imports: [NeutralityInspector],
      providers: [
        { provide: PollApi, useValue: pollApiMock },
        { provide: TuiAlertService, useValue: alertServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NeutralityInspector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('disables inspect trigger when inputs are insufficient', () => {
    component.title = '';
    component.options = ['Opção 1'];
    fixture.detectChanges();

    expect(component.canInspect).toBe(false);
  });

  it('enables inspect trigger when inputs are valid', () => {
    component.title = 'Pergunta de teste válida';
    component.options = ['Opção 1', 'Opção 2'];
    fixture.detectChanges();

    expect(component.canInspect).toBe(true);
  });

  it('calls pollApi and renders result report', () => {
    component.title = 'Você não concorda que X é melhor?';
    component.options = ['Sim', 'Certamente'];
    fixture.detectChanges();

    component.inspect();

    expect(pollApiMock.inspectPollBias).toHaveBeenCalledWith({
      title: 'Você não concorda que X é melhor?',
      options: ['Sim', 'Certamente'],
    });
    expect(component.loading()).toBe(false);
    expect(component.result()).toEqual(mockResponse);
  });

  it('handles API errors gracefully and notifies user', () => {
    pollApiMock.inspectPollBias.mockReturnValueOnce(throwError(() => new Error('API Error')));
    component.title = 'Pergunta de teste válida';
    component.options = ['Opção 1', 'Opção 2'];
    fixture.detectChanges();

    component.inspect();

    expect(component.loading()).toBe(false);
    expect(component.result()).toBeNull();
    expect(alertServiceMock.open).toHaveBeenCalled();
  });

  it('emits applyTitle when user applies suggested title', () => {
    const emitSpy = vi.spyOn(component.applyTitle, 'emit');
    component.result.set(mockResponse);
    fixture.detectChanges();

    component.onApplyTitle(mockResponse.suggestedTitle!);

    expect(emitSpy).toHaveBeenCalledWith('Qual a sua opinião sobre o framework X?');
    expect(component.appliedTitle()).toBe(true);
  });

  it('emits addOption when user clicks to add suggested option', () => {
    const emitSpy = vi.spyOn(component.addOption, 'emit');
    component.result.set(mockResponse);
    fixture.detectChanges();

    component.onAddOption('Nenhum dos anteriores');

    expect(emitSpy).toHaveBeenCalledWith('Nenhum dos anteriores');
    expect(component.addedOptions().has('Nenhum dos anteriores')).toBe(true);
  });

  it('dismisses report when dismiss is called', () => {
    component.result.set(mockResponse);
    fixture.detectChanges();

    component.dismiss();

    expect(component.result()).toBeNull();
  });
});
