import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Signin } from './signin';

describe('Signin', () => {
  let fixture: ComponentFixture<Signin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Signin],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({
                error: 'google_auth_failed',
              }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Signin);
    fixture.detectChanges();
  });

  it('links to Google and displays callback failures', () => {
    const element = fixture.nativeElement as HTMLElement;
    const googleLink = element.querySelector<HTMLAnchorElement>(
      'a[href="/api/auth/google"]',
    );

    expect(googleLink?.textContent).toContain('Continuar com o Google');
    expect(element.textContent).toContain('Não foi possível entrar com o Google');
  });
});
