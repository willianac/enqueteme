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
});
