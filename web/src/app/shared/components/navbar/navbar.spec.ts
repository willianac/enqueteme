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

  it('shows the restored user and logs out', () => {
    expect(fixture.nativeElement.textContent).toContain('Olá, Will');

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    buttons.find((button) => button.textContent?.includes('Sair'))?.click();

    expect(logout).toHaveBeenCalledOnce();
  });
});
