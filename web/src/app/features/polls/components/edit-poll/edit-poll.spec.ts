import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { UserApi } from '../../../auth/services/user-api';
import { PollApi } from '../../services/poll-api';
import { EditPoll } from './edit-poll';
import { PollType } from '../../../../shared/types/Poll';

describe('EditPoll', () => {
  let fixture: ComponentFixture<EditPoll>;
  let pollApi: {
    getMyPolls: ReturnType<typeof vi.fn>;
    updatePoll: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  const mockPoll: PollType = {
    id: 10,
    title: 'Enquete original',
    creatorName: 'Will',
    expirationDate: '2099-12-31T23:59:59.000Z',
    voteRequireLogin: true,
    options: [
      { id: 1, name: 'Opção A', votes: 0 },
      { id: 2, name: 'Opção B', votes: 0 },
    ],
  };

  beforeEach(async () => {
    pollApi = {
      getMyPolls: vi.fn(() => of([mockPoll])),
      updatePoll: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [EditPoll],
      providers: [
        provideRouter([{ path: 'my-polls/:id/edit', component: EditPoll }]),
        { provide: PollApi, useValue: pollApi },
        {
          provide: UserApi,
          useValue: {
            user: signal({ id: 1, name: 'Will', email: 'will@example.com' }),
            logout: () => of(undefined),
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  function createWithParam(id: string): ComponentFixture<EditPoll> {
    const f = TestBed.createComponent(EditPoll);
    (f.componentInstance as unknown as { route: { snapshot: { paramMap: { get: (k: string) => string } } } }).route = {
      snapshot: { paramMap: { get: (key: string) => (key === 'id' ? id : null) } },
    } as unknown as never;
    f.detectChanges();
    return f;
  }

  it('pre-fills the form from the loaded poll', async () => {
    fixture = createWithParam('10');
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.editForm.get('title')?.value).toBe('Enquete original');
    expect(component.options.length).toBe(2);
    expect(component.editForm.get('voteRequireLogin')?.value).toBe(true);
  });

  it('validates that at least 2 options are required', async () => {
    fixture = createWithParam('10');
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.options.removeAt(1);
    fixture.detectChanges();

    component.editForm.get('title')?.setValue('Novo título');
    component.onSubmit();

    expect(component.errorMessage()).toContain('pelo menos 2 opções');
    expect(pollApi.updatePoll).not.toHaveBeenCalled();
  });

  it('shows 409 error message when poll has votes', async () => {
    fixture = createWithParam('10');
    await fixture.whenStable();
    fixture.detectChanges();

    pollApi.updatePoll.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 409 })),
    );

    const component = fixture.componentInstance;
    component.editForm.get('title')?.setValue('Novo título');
    component.onSubmit();
    await fixture.whenStable();

    expect(component.errorMessage()).toContain('já possui votos');
  });

  it('navigates back on successful submit', async () => {
    fixture = createWithParam('10');
    await fixture.whenStable();
    fixture.detectChanges();

    pollApi.updatePoll.mockReturnValue(of(mockPoll));

    const component = fixture.componentInstance;
    component.editForm.get('title')?.setValue('Novo título');
    component.onSubmit();
    await fixture.whenStable();

    expect(router.navigate).toHaveBeenCalledWith(['/my-polls']);
  });
});
