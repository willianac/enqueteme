import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { UserApi } from '../auth/services/user-api';
import { Home } from './home';

describe('Home (Landing Page)', () => {
  let fixture: ComponentFixture<Home>;
  const user = signal<ReturnType<UserApi['user']>>(null);
  const logout = vi.fn(() => of(undefined));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([]),
        { provide: UserApi, useValue: { user, logout } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
  });

  it('creates the home component and renders the hero headline', () => {
    expect(fixture.componentInstance).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.hero-title')?.textContent).toContain(
      'Crie enquetes e descubra opiniões em tempo real',
    );
  });

  it('renders call-to-action buttons for exploring polls and signing in', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = Array.from(compiled.querySelectorAll('a'));

    const exploreLink = links.find((a) => a.textContent?.includes('Explorar enquetes'));
    expect(exploreLink).toBeDefined();
    expect(exploreLink?.getAttribute('routerLink')).toBe('/polls');

    const createLink = links.find((a) => a.textContent?.includes('Criar uma enquete'));
    expect(createLink).toBeDefined();
    expect(createLink?.getAttribute('routerLink')).toBe('/signin');
  });

  it('renders feature cards and how-it-works steps', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const featureCards = compiled.querySelectorAll('.feature-card');
    expect(featureCards.length).toBe(4);

    const stepCards = compiled.querySelectorAll('.step-card');
    expect(stepCards.length).toBe(3);
  });
});
