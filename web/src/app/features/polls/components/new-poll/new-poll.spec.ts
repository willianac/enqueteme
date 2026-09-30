import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TuiAlertService } from '@taiga-ui/core';
import { of } from 'rxjs';
import { UserApi } from '../../../auth/services/user-api';
import { PollApi } from '../../services/poll-api';
import { NewPoll } from './new-poll';

describe('NewPoll', () => {
  let fixture: ComponentFixture<NewPoll>;
  let component: NewPoll;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewPoll],
      providers: [
        provideRouter([]),
        {
          provide: UserApi,
          useValue: {
            user: signal({ id: 1, name: 'Will', email: 'will@example.com' }),
          },
        },
        {
          provide: PollApi,
          useValue: {
            createPoll: vi.fn(),
            inspectPollBias: vi.fn().mockReturnValue(of({ isNeutral: true, score: 100 })),
            generatePoll: vi.fn().mockReturnValue(
              of({
                title: 'Qual linguagem você prefere para microsserviços?',
                options: ['Go', 'Rust', 'Java', 'Node.js', 'Outro'],
              }),
            ),
          },
        },
        { provide: TuiAlertService, useValue: { open: () => of(undefined) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NewPoll);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the authenticated poll form', () => {
    expect(component).toBeTruthy();
  });

  it('switches between Manual and Co-pilot tabs', async () => {
    expect(component.activeTabIndex).toBe(0);

    component.activeTabIndex = 1;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.activeTabIndex).toBe(1);

    component.activeTabIndex = 0;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.activeTabIndex).toBe(0);
  });

  it('updates poll title when onApplySuggestedTitle is called', () => {
    component.onApplySuggestedTitle('Qual banco de dados relacional você prefere?');
    expect((component as any).pollTitle).toBe('Qual banco de dados relacional você prefere?');
  });

  it('adds suggested option to the form controls', () => {
    expect(component.numberOfOptions).toBe(2);

    component.onAddSuggestedOption('Nenhum dos anteriores');

    expect(component.numberOfOptions).toBe(3);
    const formValues = component.getOptionsValues();
    expect(formValues).toContain('Nenhum dos anteriores');
  });

  it('respects maximum limit of 5 options when adding suggested options', () => {
    component.onAddSuggestedOption('Opção 3');
    component.onAddSuggestedOption('Opção 4');
    component.onAddSuggestedOption('Opção 5');
    expect(component.numberOfOptions).toBe(5);
    expect(component.canAddMoreOptions).toBe(false);

    component.onAddSuggestedOption('Opção 6');
    expect(component.numberOfOptions).toBe(5);
  });

  it('applies full poll from co-pilot and switches to manual tab', () => {
    component.activeTabIndex = 1;
    component.onApplyCopilotPoll({
      title: 'Melhor framework web em 2026',
      options: ['Angular', 'Next.js', 'Vue / Nuxt'],
    });

    expect((component as any).pollTitle).toBe('Melhor framework web em 2026');
    expect(component.numberOfOptions).toBe(3);
    expect(component.getOptionsValues()).toEqual(['Angular', 'Next.js', 'Vue / Nuxt']);
    expect(component.activeTabIndex).toBe(0);
  });

  it('suggests options for existing title and allows replacing options', () => {
    (component as any).pollTitle = 'Qual linguagem você prefere para microsserviços?';
    fixture.detectChanges();

    expect(component.canSuggestOptionsForTitle).toBe(true);

    component.suggestOptionsForTitle();
    expect(component.copilotLoading()).toBe(false);
    expect(component.showOptionCopilotPreview()).toBe(true);
    expect(component.suggestedOptions().length).toBe(5);

    component.replaceWithSuggestedOptions();
    expect(component.showOptionCopilotPreview()).toBe(false);
    expect(component.numberOfOptions).toBe(5);
    expect(component.getOptionsValues()).toContain('Go');
    expect(component.getOptionsValues()).toContain('Rust');
  });
});

