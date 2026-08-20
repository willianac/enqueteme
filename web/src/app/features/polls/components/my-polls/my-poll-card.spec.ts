import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MyPollCard } from './my-poll-card';
import { PollType } from '../../../../shared/types/Poll';
import { TuiDialogService } from '@taiga-ui/core';

describe('MyPollCard', () => {
  let fixture: ComponentFixture<MyPollCard>;
  let component: MyPollCard;
  let mockDialogs: { open: ReturnType<typeof vi.fn> };

  const activePoll: PollType = {
    id: 1,
    title: 'Minha enquete',
    creatorName: 'Will',
    expirationDate: '2099-12-31T23:59:59.000Z',
    voteRequireLogin: false,
    options: [
      { id: 1, name: 'Opção A', votes: 3 },
      { id: 2, name: 'Opção B', votes: 5 },
    ],
  };

  const expiredPoll: PollType = {
    ...activePoll,
    id: 2,
    expirationDate: '2020-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    mockDialogs = { open: vi.fn(() => of(true)) };

    await TestBed.configureTestingModule({
      imports: [MyPollCard],
      providers: [{ provide: TuiDialogService, useValue: mockDialogs }],
    }).compileComponents();

    fixture = TestBed.createComponent(MyPollCard);
    component = fixture.componentInstance;
  });

  it('renders poll data', () => {
    fixture.componentRef.setInput('pollData', activePoll);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Minha enquete');
    expect(el.textContent).toContain('Opção A');
    expect(el.textContent).toContain('Opção B');
    expect(el.textContent).toContain('8 votos');
  });

  it('emits edit, close, and delete outputs', () => {
    fixture.componentRef.setInput('pollData', activePoll);
    fixture.detectChanges();

    const editSpy = vi.fn();
    const closeSpy = vi.fn();
    const deleteSpy = vi.fn();
    component.edit.subscribe(editSpy);
    component.close.subscribe(closeSpy);
    component.delete.subscribe(deleteSpy);

    component.onEdit();
    expect(editSpy).toHaveBeenCalledWith(1);

    component.onClose();
    expect(closeSpy).toHaveBeenCalledWith(1);

    component.onDelete();
    expect(deleteSpy).toHaveBeenCalledWith(1);
  });

  it('disables Encerrar for expired polls', () => {
    fixture.componentRef.setInput('pollData', expiredPoll);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Encerrada');
    const closeBtn = Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Encerrar'),
    ) as HTMLButtonElement;
    expect(closeBtn.disabled).toBe(true);
  });

  it('does not emit delete when dialog is cancelled', () => {
    mockDialogs.open.mockReturnValue(of(false));
    fixture.componentRef.setInput('pollData', activePoll);
    fixture.detectChanges();

    const deleteSpy = vi.fn();
    component.delete.subscribe(deleteSpy);

    component.onDelete();
    expect(deleteSpy).not.toHaveBeenCalled();
  });
});
