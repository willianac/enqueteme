import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TuiAlertService } from '@taiga-ui/core';
import { of } from 'rxjs';
import { UserApi } from '../../../auth/services/user-api';
import { PollApi } from '../../services/poll-api';
import { NewPoll } from './new-poll';

describe('NewPoll', () => {
  let fixture: ComponentFixture<NewPoll>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewPoll],
      providers: [
        provideRouter([]),
        {
          provide: UserApi,
          useValue: {
            user: signal({ id: 1, name: 'Will', email: 'will@example.com' }),
          },
        },
        { provide: PollApi, useValue: { createPoll: vi.fn() } },
        { provide: TuiAlertService, useValue: { open: () => of(undefined) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NewPoll);
    fixture.detectChanges();
  });

  it('creates the authenticated poll form', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
