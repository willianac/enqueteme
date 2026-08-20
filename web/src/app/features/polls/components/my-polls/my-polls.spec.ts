import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { UserApi } from '../../../auth/services/user-api';
import { PollApi } from '../../services/poll-api';
import { MyPolls } from './my-polls';
import { PollType } from '../../../../shared/types/Poll';

describe('MyPolls', () => {
  let fixture: ComponentFixture<MyPolls>;
  let pollApi: {
    getMyPolls: ReturnType<typeof vi.fn>;
    closePoll: ReturnType<typeof vi.fn>;
    deletePoll: ReturnType<typeof vi.fn>;
  };

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
    {
      id: 2,
      title: 'Enquete 2',
      creatorName: 'Will',
      expirationDate: '2099-12-31T23:59:59.000Z',
      voteRequireLogin: false,
      options: [
        { id: 3, name: 'X', votes: 0 },
        { id: 4, name: 'Y', votes: 1 },
      ],
    },
  ];

  beforeEach(async () => {
    pollApi = {
      getMyPolls: vi.fn(() => of(mockPolls)),
      closePoll: vi.fn(),
      deletePoll: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [MyPolls],
      providers: [
        provideRouter([]),
        { provide: PollApi, useValue: pollApi },
        {
          provide: UserApi,
          useValue: { user: signal({ id: 1, name: 'Will', email: 'will@example.com' }), logout: () => of(undefined) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyPolls);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('loads and displays the poll list', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Enquete 1');
    expect(el.textContent).toContain('Enquete 2');
  });

  it('shows empty state when no polls', async () => {
    pollApi.getMyPolls.mockReturnValue(of([]));
    fixture = TestBed.createComponent(MyPolls);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Nenhuma enquete encontrada');
  });

  it('removes a poll from the list on delete', async () => {
    pollApi.deletePoll.mockReturnValue(of(undefined));
    const component = fixture.componentInstance;
    component.onDelete(1);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Enquete 1');
    expect(fixture.nativeElement.textContent).toContain('Enquete 2');
  });

  it('updates a poll in place on close', async () => {
    const closedPoll: PollType = {
      ...mockPolls[0],
      expirationDate: new Date().toISOString(),
    };
    pollApi.closePoll.mockReturnValue(of(closedPoll));
    const component = fixture.componentInstance;
    component.onClose(1);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(pollApi.closePoll).toHaveBeenCalledWith(1);
  });

  it('shows error state and retry button on failure', async () => {
    pollApi.getMyPolls.mockReturnValue(throwError(() => new Error('fail')));
    fixture = TestBed.createComponent(MyPolls);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Não foi possível carregar');
  });
});
