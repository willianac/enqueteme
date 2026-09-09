import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { UserApi } from '../../../auth/services/user-api';
import { PollApi } from '../../services/poll-api';
import { PollDetail } from './poll-detail';
import { PollType } from '../../../../shared/types/Poll';

describe('PollDetail', () => {
  let fixture: ComponentFixture<PollDetail>;
  let pollApi: { getPoll: ReturnType<typeof vi.fn> };

  const mockPoll: PollType = {
    id: 1,
    title: 'Enquete Teste',
    creatorName: 'Will',
    expirationDate: '2030-12-31T23:59:59.000Z',
    voteRequireLogin: false,
    options: [
      { id: 1, name: 'Opção 1', votes: 2 },
      { id: 2, name: 'Opção 2', votes: 3 },
    ],
  };

  function setupTestBed(paramId: string | null) {
    pollApi = {
      getPoll: vi.fn(() => of(mockPoll)),
    };

    return TestBed.configureTestingModule({
      imports: [PollDetail],
      providers: [
        provideRouter([]),
        { provide: PollApi, useValue: pollApi },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap(paramId ? { id: paramId } : {})),
          },
        },
        {
          provide: UserApi,
          useValue: { user: signal(null), logout: () => of(undefined) },
        },
      ],
    }).compileComponents();
  }

  it('loads and displays the poll on successful fetch', async () => {
    await setupTestBed('1');
    fixture = TestBed.createComponent(PollDetail);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(pollApi.getPoll).toHaveBeenCalledWith(1);
    expect(fixture.nativeElement.textContent).toContain('Enquete Teste');
  });

  it('shows error state when API call fails', async () => {
    await setupTestBed('1');
    pollApi.getPoll.mockReturnValue(throwError(() => new Error('Not found')));

    fixture = TestBed.createComponent(PollDetail);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Não foi possível carregar a enquete');
    expect(el.textContent).toContain('Ver todas as enquetes');
  });

  it('shows error state when route id is not a valid number', async () => {
    await setupTestBed('invalid-id');
    fixture = TestBed.createComponent(PollDetail);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(pollApi.getPoll).not.toHaveBeenCalled();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Não foi possível carregar a enquete');
  });
});
