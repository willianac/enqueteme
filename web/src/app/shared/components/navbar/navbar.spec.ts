import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { UserApi } from '../../../features/auth/services/user-api';
import { Navbar } from './navbar';

describe('Navbar', () => {
  let fixture: ComponentFixture<Navbar>;
  const user = signal({ id: 1, name: 'Will', email: 'will@example.com' });
  const logout = vi.fn(() => of(undefined));

  beforeEach(async () => {
    logout.mockClear();
    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [
        provideRouter([]),
        { provide: UserApi, useValue: { user, logout } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();
  });

  it('shows the restored user and opens dropdown to log out', () => {
    expect(fixture.nativeElement.textContent).toContain('Olá, Will');

    const trigger: HTMLButtonElement | null = fixture.nativeElement.querySelector('.user-trigger');
    expect(trigger).not.toBeNull();
    trigger?.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.open()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Minhas enquetes');

    const logoutBtn: HTMLButtonElement | null = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ).find((b: unknown) => (b as HTMLElement).textContent?.includes('Sair')) as HTMLButtonElement;

    expect(logoutBtn).toBeDefined();
    logoutBtn?.click();

    expect(logout).toHaveBeenCalledOnce();
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('toggles dropdown open and closed on trigger clicks', () => {
    const trigger: HTMLButtonElement | null = fixture.nativeElement.querySelector('.user-trigger');
    expect(trigger).not.toBeNull();
    expect(fixture.componentInstance.open()).toBe(false);

    trigger?.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(true);

    trigger?.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('closes dropdown when escape key is pressed', () => {
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();

    fixture.componentInstance.onEscape();
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('closes dropdown when clicking outside', () => {
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();

    const outsideEvent = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(outsideEvent, 'target', { value: document.body });

    fixture.componentInstance.onDocumentClick(outsideEvent);
    expect(fixture.componentInstance.open()).toBe(false);
  });
});
