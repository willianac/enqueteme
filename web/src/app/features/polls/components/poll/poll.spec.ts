import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TuiAlertService } from '@taiga-ui/core';
import { of } from 'rxjs';
import { UserApi } from '../../../auth/services/user-api';
import { PollApi } from '../../services/poll-api';
import { Poll } from './poll';

describe('Poll', () => {
  let fixture: ComponentFixture<Poll>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Poll],
      providers: [
        { provide: PollApi, useValue: { setVote: vi.fn() } },
        { provide: UserApi, useValue: { user: signal(null) } },
        { provide: TuiAlertService, useValue: { open: () => of(undefined) } },
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
});
