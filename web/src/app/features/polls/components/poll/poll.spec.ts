import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TuiAlertService } from '@taiga-ui/core';
import { of, throwError } from 'rxjs';
import { UserApi } from '../../../auth/services/user-api';
import { PollApi } from '../../services/poll-api';
import { Poll } from './poll';

describe('Poll', () => {
  let fixture: ComponentFixture<Poll>;
  let pollApi: { setVote: ReturnType<typeof vi.fn> };
  let alerts: { open: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    pollApi = { setVote: vi.fn() };
    alerts = { open: vi.fn(() => of(undefined)) };

    await TestBed.configureTestingModule({
      imports: [Poll],
      providers: [
        { provide: PollApi, useValue: pollApi },
        { provide: UserApi, useValue: { user: signal(null) } },
        { provide: TuiAlertService, useValue: alerts },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Poll);
    fixture.componentRef.setInput('pollData', {
      id: 1,
      title: 'Question?',
      creatorName: 'Will',
      expirationDate: '2026-08-25T12:00:00.000Z',
      voteRequireLogin: false,
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
        expirationDate: '2026-08-25T12:00:00.000Z',
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
});
