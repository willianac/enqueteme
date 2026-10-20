import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TuiAlertService } from '@taiga-ui/core';
import { of, throwError } from 'rxjs';
import { PollApi } from '../../services/poll-api';
import { PollDebateDrawer } from './poll-debate-drawer';
import { ExplainPollDebateResponse } from '../../../../shared/types/AiInspector';

describe('PollDebateDrawer', () => {
  let component: PollDebateDrawer;
  let fixture: ComponentFixture<PollDebateDrawer>;

  const mockResponse: ExplainPollDebateResponse = {
    pollId: 10,
    overview: 'O debate envolve comparar tipagem estática versus tipagem dinâmica para desenvolvimento backend.',
    options: [
      {
        name: 'TypeScript',
        pros: ['Erros prevenidos em tempo de compilação', 'Tipagem estática robusta'],
        cons: ['Etapa de build necessária', 'Curva de aprendizado inicial'],
      },
      {
        name: 'Python',
        pros: ['Sintaxe limpa e ágil', 'Ecossistema enorme em dados'],
        cons: ['Desempenho inferior em loops intensivos', 'Erros de tipo em runtime'],
      },
    ],
  };

  const pollApiMock = {
    explainPollDebate: vi.fn().mockReturnValue(of(mockResponse)),
  };

  const alertServiceMock = {
    open: vi.fn().mockReturnValue(of(undefined)),
  };

  beforeEach(async () => {
    pollApiMock.explainPollDebate.mockClear();
    pollApiMock.explainPollDebate.mockReturnValue(of(mockResponse));
    alertServiceMock.open.mockClear();

    await TestBed.configureTestingModule({
      imports: [PollDebateDrawer],
      providers: [
        { provide: PollApi, useValue: pollApiMock },
        { provide: TuiAlertService, useValue: alertServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PollDebateDrawer);
    component = fixture.componentInstance;
    component.pollId = 10;
    component.pollTitle = 'TypeScript vs Python para novas APIs?';
    component.options = ['TypeScript', 'Python'];
  });

  it('creates the component and fetches debate explanation on init', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(pollApiMock.explainPollDebate).toHaveBeenCalledWith({
      pollId: 10,
      title: 'TypeScript vs Python para novas APIs?',
      options: ['TypeScript', 'Python'],
    });
    expect(component.loading()).toBe(false);
    expect(component.explanation()).toEqual(mockResponse);
  });

  it('renders overview and options pros/cons in the template', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Entenda o debate');
    expect(compiled.textContent).toContain('TypeScript vs Python para novas APIs?');
    expect(compiled.textContent).toContain('O debate envolve comparar tipagem estática');
    expect(compiled.textContent).toContain('TypeScript');
    expect(compiled.textContent).toContain('Erros prevenidos em tempo de compilação');
    expect(compiled.textContent).toContain('Python');
    expect(compiled.textContent).toContain('Sintaxe limpa e ágil');
  });

  it('handles API errors and allows retry', () => {
    pollApiMock.explainPollDebate.mockReturnValueOnce(
      throwError(() => new Error('AI service error')),
    );

    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBeTruthy();
    expect(component.explanation()).toBeNull();

    // Now retry successfully
    pollApiMock.explainPollDebate.mockReturnValueOnce(of(mockResponse));
    component.loadExplanation();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
    expect(component.explanation()).toEqual(mockResponse);
  });

  it('emits close event when onClose is called', () => {
    const closeSpy = vi.fn();
    component.close.subscribe(closeSpy);

    component.onClose();

    expect(closeSpy).toHaveBeenCalled();
  });

  it('emits close event on Escape key', () => {
    const closeSpy = vi.fn();
    component.close.subscribe(closeSpy);

    component.onEscape();

    expect(closeSpy).toHaveBeenCalled();
  });
});
