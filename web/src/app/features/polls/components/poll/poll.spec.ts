import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TuiAlertService } from '@taiga-ui/core';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { UserApi } from '../../../auth/services/user-api';
import { PollApi } from '../../services/poll-api';
import { Poll } from './poll';

describe('Poll', () => {
  let fixture: ComponentFixture<Poll>;
  let pollApi: { setVote: ReturnType<typeof vi.fn>; explainPollDebate: ReturnType<typeof vi.fn> };
  let alerts: { open: ReturnType<typeof vi.fn> };
  let userSig: ReturnType<typeof signal<{ name: string } | null>>;

  beforeEach(async () => {
    userSig = signal<{ name: string } | null>(null);
    pollApi = {
      setVote: vi.fn(),
      explainPollDebate: vi.fn().mockReturnValue(of({ pollId: 1, overview: 'Contexto', options: [] })),
    };
    alerts = { open: vi.fn(() => of(undefined)) };

    await TestBed.configureTestingModule({
      imports: [Poll],
      providers: [
        provideRouter([]),
        { provide: PollApi, useValue: pollApi },
        { provide: UserApi, useValue: { user: userSig } },
        { provide: TuiAlertService, useValue: alerts },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Poll);
    fixture.componentRef.setInput('pollData', {
      id: 1,
      title: 'Question?',
      creatorName: 'Will',
      expirationDate: '2030-08-25T12:00:00.000Z',
      voteRequireLogin: false,
      allowMultiple: false,
      options: [
        { id: 1, name: 'A', votes: 0 },
        { id: 2, name: 'B', votes: 0 },
      ],
    });
    fixture.detectChanges();
  });

  it('renders the supplied poll', () => {
    expect(fixture.nativeElement.textContent).toContain('Question?');
  });

  it('shows an alert when the API rejects a duplicate vote', () => {
    pollApi.setVote.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            statusText: 'Conflict',
          }),
      ),
    );

    const component = fixture.componentInstance as Poll & {
      pollForm: { setValue: (value: { option: number }) => void };
      vote: () => void;
    };
    component.pollForm.setValue({ option: 1 });
    component.vote();

    expect(alerts.open).toHaveBeenCalledWith('Você já votou nesta enquete.', {
      label: 'Não foi possível votar',
      appearance: 'negative',
    });
  });

  it('renders "Encerrada" and no "dias restantes" for expired polls', () => {
    fixture.componentRef.setInput('pollData', {
      id: 2,
      title: 'Expired poll',
      creatorName: 'Will',
      expirationDate: '2020-01-01T00:00:00.000Z',
      voteRequireLogin: false,
      options: [
        { id: 1, name: 'A', votes: 5 },
        { id: 2, name: 'B', votes: 3 },
      ],
    });
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Encerrada');
    expect(el.textContent).not.toContain('dias restantes');

    const votarBtn = Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Votar'),
    );
    expect(votarBtn).toBeUndefined();
  });

  it('renders result view with option names, votes, and progress bars after voting', () => {
    pollApi.setVote.mockReturnValue(
      of({
        id: 1,
        title: 'Question?',
        creatorName: 'Will',
        expirationDate: '2030-08-25T12:00:00.000Z',
        voteRequireLogin: false,
        options: [
          { id: 1, name: 'A', votes: 3 },
          { id: 2, name: 'B', votes: 1 },
        ],
      }),
    );

    const component = fixture.componentInstance as Poll & {
      pollForm: { setValue: (value: { option: number }) => void };
      vote: () => void;
    };
    component.pollForm.setValue({ option: 1 });
    component.vote();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('A');
    expect(el.textContent).toContain('B');
    expect(el.textContent).toContain('3 votos');
    expect(el.textContent).toContain('1 voto');
    expect(el.textContent).toContain('75%');
    expect(el.textContent).toContain('25%');

    const progressBars = el.querySelectorAll('progress[tuiProgressBar]');
    expect(progressBars.length).toBe(2);
  });

  it('percentage helper returns 0 when poll has no votes', () => {
    const component = fixture.componentInstance;
    expect(component.percentage(0)).toBe(0);
  });

  it('renders result view and "Você votou" when poll has hasVoted true', () => {
    fixture.componentRef.setInput('pollData', {
      id: 3,
      title: 'Already voted poll',
      creatorName: 'Will',
      expirationDate: '2030-08-25T12:00:00.000Z',
      voteRequireLogin: false,
      hasVoted: true,
      votedOptionId: 1,
      options: [
        { id: 1, name: 'A', votes: 5 },
        { id: 2, name: 'B', votes: 3 },
      ],
    });
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Você votou');
    expect(el.textContent).not.toContain('Votar');

    const chosenOption = el.querySelector('.option-name.chosen');
    expect(chosenOption?.textContent).toContain('A');
  });

  it('renders checkboxes for multiple-choice polls and shows selection rule', () => {
    fixture.componentRef.setInput('pollData', {
      id: 6,
      title: 'Multiple Choice Poll',
      creatorName: 'Will',
      expirationDate: '2030-08-25T12:00:00.000Z',
      voteRequireLogin: false,
      allowMultiple: true,
      maxChoices: 2,
      options: [
        { id: 1, name: 'Option 1', votes: 0 },
        { id: 2, name: 'Option 2', votes: 0 },
        { id: 3, name: 'Option 3', votes: 0 },
      ],
    });
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Múltipla escolha • Escolha até 2 opções');

    const checkboxes = el.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBe(3);
    expect(checkboxes[0].hasAttribute('tuicheckbox')).toBe(true);

    const radios = el.querySelectorAll('input[type="radio"]');
    expect(radios.length).toBe(0);
  });

  it('toggles checkbox and selection on user click', () => {
    fixture.componentRef.setInput('pollData', {
      id: 11,
      title: 'Click test poll',
      creatorName: 'Will',
      expirationDate: '2030-08-25T12:00:00.000Z',
      voteRequireLogin: false,
      allowMultiple: true,
      options: [
        { id: 1, name: 'Option 1', votes: 0 },
        { id: 2, name: 'Option 2', votes: 0 },
      ],
    });
    fixture.detectChanges();

    const checkboxes: NodeListOf<HTMLInputElement> =
      fixture.nativeElement.querySelectorAll('input[type="checkbox"]');
    checkboxes[0].click();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.selectedOptionIds.has(1)).toBe(true);
    expect(checkboxes[0].checked).toBe(true);
  });

  it('disables remaining checkboxes and shows hint when maxChoices cap is reached', () => {
    fixture.componentRef.setInput('pollData', {
      id: 7,
      title: 'Capped Selection Poll',
      creatorName: 'Will',
      expirationDate: '2030-08-25T12:00:00.000Z',
      voteRequireLogin: false,
      allowMultiple: true,
      maxChoices: 2,
      options: [
        { id: 1, name: 'Option 1', votes: 0 },
        { id: 2, name: 'Option 2', votes: 0 },
        { id: 3, name: 'Option 3', votes: 0 },
      ],
    });
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.toggleOption(1, true);
    component.toggleOption(2, true);
    fixture.detectChanges();

    expect(component.isMaxChoicesReached).toBe(true);
    expect(component.isOptionDisabled(3)).toBe(true);
    expect(component.isOptionDisabled(1)).toBe(false);

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Limite de 2 opções atingido');
  });

  it('submits multiple optionIds when voting on multiple-choice poll', () => {
    fixture.componentRef.setInput('pollData', {
      id: 8,
      title: 'Multi Vote Submission',
      creatorName: 'Will',
      expirationDate: '2030-08-25T12:00:00.000Z',
      voteRequireLogin: false,
      allowMultiple: true,
      options: [
        { id: 1, name: 'Option 1', votes: 0 },
        { id: 2, name: 'Option 2', votes: 0 },
      ],
    });
    fixture.detectChanges();

    pollApi.setVote.mockReturnValue(
      of({
        id: 8,
        title: 'Multi Vote Submission',
        creatorName: 'Will',
        expirationDate: '2030-08-25T12:00:00.000Z',
        voteRequireLogin: false,
        allowMultiple: true,
        totalVoters: 1,
        votedOptionIds: [1, 2],
        options: [
          { id: 1, name: 'Option 1', votes: 1 },
          { id: 2, name: 'Option 2', votes: 1 },
        ],
      }),
    );

    const component = fixture.componentInstance;
    component.toggleOption(1, true);
    component.toggleOption(2, true);
    (component as any).vote();
    fixture.detectChanges();

    expect(pollApi.setVote).toHaveBeenCalledWith({
      pollId: 8,
      optionIds: [1, 2],
    });

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('1 participante');
    expect(el.textContent).toContain('2 votos computados');
    expect(el.textContent).toContain('100%');
  });

  it('renders checkmarks for all options in votedOptionIds in results view', () => {
    fixture.componentRef.setInput('pollData', {
      id: 9,
      title: 'Multi Vote Results Checkmarks',
      creatorName: 'Will',
      expirationDate: '2030-08-25T12:00:00.000Z',
      voteRequireLogin: false,
      allowMultiple: true,
      hasVoted: true,
      totalVoters: 2,
      votedOptionIds: [1, 3],
      options: [
        { id: 1, name: 'Option 1', votes: 2 },
        { id: 2, name: 'Option 2', votes: 1 },
        { id: 3, name: 'Option 3', votes: 2 },
      ],
    });
    fixture.detectChanges();

    const chosenOptions = fixture.nativeElement.querySelectorAll('.option-name.chosen');
    expect(chosenOptions.length).toBe(2);
    expect(chosenOptions[0].textContent).toContain('Option 1');
    expect(chosenOptions[1].textContent).toContain('Option 3');
  });
});
