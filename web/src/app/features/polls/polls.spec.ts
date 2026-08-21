import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { UserApi } from '../auth/services/user-api';
import { PollApi } from './services/poll-api';
import { Polls } from './polls';

describe('Polls', () => {
  let fixture: ComponentFixture<Polls>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Polls],
      providers: [
        provideRouter([]),
        { provide: PollApi, useValue: { getAllPolls: () => of([]) } },
        {
          provide: UserApi,
          useValue: { user: signal(null), logout: () => of(undefined) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Polls);
    fixture.detectChanges();
  });

  it('renders the empty poll state', () => {
    expect(fixture.nativeElement.textContent).toContain('Nenhuma enquete encontrada');
  });
});
