import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { UserApi } from '../auth/services/user-api';
import { PollApi } from './services/poll-api';
import { Polls } from './polls';
import { PollType } from '../../shared/types/Poll';

describe('Polls', () => {
  let fixture: ComponentFixture<Polls>;
  let pollApi: { getAllPolls: ReturnType<typeof vi.fn> };

  const mockPolls: PollType[] = [
    {
      id: 1,
      title: 'Enquete 1',
      creatorName: 'Will',
      expirationDate: '2099-12-31T23:59:59.000Z',
      voteRequireLogin: false,
      options: [
        { id: 1, name: 'A', votes: 2 },
        { id: 2, name: 'B', votes: 3 },
      ],
    },
  ];

  beforeEach(async () => {
    pollApi = {
      getAllPolls: vi.fn(() => of(mockPolls)),
    };

    await TestBed.configureTestingModule({
      imports: [Polls],
      providers: [
        provideRouter([]),
        { provide: PollApi, useValue: pollApi },
        {
          provide: UserApi,
          useValue: { user: signal(null), logout: () => of(undefined) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Polls);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('renders poll cards on successful load', () => {
    expect(fixture.nativeElement.textContent).toContain('Enquete 1');
  });

  it('shows empty state with "Criar enquete" button when no polls', async () => {
    pollApi.getAllPolls.mockReturnValue(of([]));
    fixture = TestBed.createComponent(Polls);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Nenhuma enquete encontrada');
    expect(el.textContent).toContain('Criar enquete');
  });

  it('shows error state with "Tentar novamente" button on failure', async () => {
    pollApi.getAllPolls.mockReturnValue(throwError(() => new Error('fail')));
    fixture = TestBed.createComponent(Polls);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Não foi possível carregar');
    expect(el.textContent).toContain('Tentar novamente');
  });

  it('re-calls getAllPolls when retry button is clicked', async () => {
    pollApi.getAllPolls.mockReturnValueOnce(throwError(() => new Error('fail')));
    fixture = TestBed.createComponent(Polls);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    pollApi.getAllPolls.mockClear();
    pollApi.getAllPolls.mockReturnValue(of(mockPolls));
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const button = Array.from(buttons).find((b: unknown) =>
      (b as Element).textContent?.includes('Tentar novamente'),
    );
    (button as HTMLButtonElement)?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(pollApi.getAllPolls).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.textContent).toContain('Enquete 1');
  });

  it('loads more polls when "Carregar mais" button is clicked', async () => {
    const tenPolls: PollType[] = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      title: `Enquete ${i + 1}`,
      creatorName: 'Will',
      expirationDate: '2099-12-31T23:59:59.000Z',
      voteRequireLogin: false,
      options: [{ id: 1, name: 'A', votes: 1 }],
    }));
    const nextPolls: PollType[] = [
      {
        id: 11,
        title: 'Enquete 11',
        creatorName: 'Will',
        expirationDate: '2099-12-31T23:59:59.000Z',
        voteRequireLogin: false,
        options: [{ id: 1, name: 'A', votes: 1 }],
      },
    ];

    pollApi.getAllPolls.mockReturnValue(of(tenPolls));
    fixture = TestBed.createComponent(Polls);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Carregar mais');

    pollApi.getAllPolls.mockReturnValue(of(nextPolls));
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const loadMoreBtn = Array.from(buttons).find((b: unknown) =>
      (b as Element).textContent?.includes('Carregar mais'),
    );
    (loadMoreBtn as HTMLButtonElement)?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(pollApi.getAllPolls).toHaveBeenCalledWith(2, 10);
    expect(fixture.nativeElement.textContent).toContain('Enquete 1');
    expect(fixture.nativeElement.textContent).toContain('Enquete 11');
  });

  it('filters polls by "Ativas" and "Encerradas"', async () => {
    const mixedPolls: PollType[] = [
      {
        id: 1,
        title: 'Enquete Ativa',
        creatorName: 'Will',
        expirationDate: '2099-12-31T23:59:59.000Z',
        voteRequireLogin: false,
        options: [{ id: 1, name: 'A', votes: 1 }],
      },
      {
        id: 2,
        title: 'Enquete Encerrada',
        creatorName: 'Will',
        expirationDate: '2020-01-01T00:00:00.000Z',
        voteRequireLogin: false,
        options: [{ id: 1, name: 'B', votes: 2 }],
      },
    ];

    pollApi.getAllPolls.mockReturnValue(of(mixedPolls));
    fixture = TestBed.createComponent(Polls);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;

    // Default "Todas" shows both
    expect(fixture.nativeElement.textContent).toContain('Enquete Ativa');
    expect(fixture.nativeElement.textContent).toContain('Enquete Encerrada');

    // Filter "Ativas" (index 1)
    component.onFilterChange(1);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Enquete Ativa');
    expect(fixture.nativeElement.textContent).not.toContain('Enquete Encerrada');

    // Filter "Encerradas" (index 2)
    component.onFilterChange(2);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Enquete Ativa');
    expect(fixture.nativeElement.textContent).toContain('Enquete Encerrada');
  });
});
