# Edit Poll — Taiga UI Migration Plan

## Context & findings

- `edit-poll` (`web/src/app/features/polls/components/edit-poll/`) is the only polls page built with
  pure CSS + native elements. Every other page (`new-poll`, `my-polls`, `my-poll-card`, `poll`,
  `signin`, `navbar`) already uses Taiga UI v4.61 (`@taiga-ui/core`, `kit`, `layout`, `cdk` are
  installed; `TuiRoot` + animations already configured in `app.config.ts`).
- **White text bug:** `edit-poll.less` hardcodes dark-theme colors (`.page-title { color: white }`,
  labels `#d1d5db`, inputs `#1e1e1e`), but the app runs Taiga UI's default **light** theme — so the
  "Editar Enquete" title is invisible on the light background. `my-polls.less` already shows the
  correct fix pattern (`var(--tui-text-primary)` / `var(--tui-text-secondary)`).
- Reference implementation: `new-poll` — identical form shape (title, options list, login toggle,
  duration, actions), fully migrated.

## Component mapping

| Current (pure CSS)                | Taiga UI replacement                                                            | Precedent                     |
| --------------------------------- | ------------------------------------------------------------------------------- | ----------------------------- |
| Plain `<form>`                    | `tuiCardLarge` + `tuiSurface="floating"` card with `tuiHeader`/`tuiTitle`       | new-poll, signin              |
| `.form-input` title input         | `<tui-textfield tuiTextfieldSize="l"><input tuiTextfield formControlName="title">` | new-poll                      |
| `.form-input` option inputs       | `<tui-textfield tuiTextfieldSize="s" [tuiTextfieldCleaner]="false">`            | new-poll                      |
| `.btn-remove` "Remover"           | `tuiButtonClose tuiIconButton` size `xs`                                        | new-poll                      |
| `.btn-add` "Adicionar opção"      | `tuiButton appearance="outline"` size `s`                                       | new-poll                      |
| Native checkbox                   | `<input tuiSwitch type="checkbox">` inside `<label tuiLabel>`                   | new-poll (switch), poll (tuiLabel) |
| Duration number input             | `<tui-textfield tuiTextfieldSize="m">` with `type="number"`, `min="1"`          | — (decision: no slider)       |
| `.form-error` paragraph           | `<tui-error [error]="errorMessage()" />` + `TuiValidationError`                 | new-poll                      |
| `.btn-cancel` anchor              | `<a tuiButton appearance="secondary" size="m" routerLink="/my-polls">`          | signin (tuiButton on anchor)  |
| `.btn-save` submit                | `tuiButton appearance="primary" size="m"` with `[disabled]`                     | new-poll                      |
| `.state-message` texts            | keep `<p>`, fix color only                                                      | my-polls                      |

### Decisions (confirmed with user)

- **Duration field:** keep a number textfield (any value >= 1, pre-filled with days remaining).
  Do **not** use new-poll's `tuiSlider` (1–7 cap would change behavior for existing polls).
- **Remove-option button:** close icon button (`tuiButtonClose tuiIconButton` size `xs`), matching
  new-poll's option rows.

## Changes per file

### 1. `edit-poll.ts`

- Add to component `imports`:
  - `TuiCardLarge`, `TuiHeader` from `@taiga-ui/layout`
  - `TuiButton`, `TuiTextfield`, `TuiSurface`, `TuiError`, `TuiLabel`, `TuiTitle` from `@taiga-ui/core`
  - `TuiButtonClose`, `TuiSwitch` from `@taiga-ui/kit`
  - Import `TuiValidationError` from `@taiga-ui/cdk` (value import, used in code below)
- Change the error signal to match new-poll's pattern:
  - `readonly errorMessage = signal('')` → `readonly errorMessage = signal<TuiValidationError | null>(null)`
  - `this.errorMessage.set('msg')` → `this.errorMessage.set(new TuiValidationError('msg'))`
  - `this.errorMessage.set('')` → `this.errorMessage.set(null)`
- No other logic changes (form structure, prefill, submit, error-status mapping stay identical).

### 2. `edit-poll.html`

- Keep `<app-navbar>` + `<main class="content">` + `<h1 class="page-title">Editar Enquete</h1>`.
- Keep loading / not-found `<p class="state-message">` states as-is.
- Wrap the form in `<div tuiCardLarge tuiSurface="floating" class="poll-card">` with
  `<header tuiHeader>` (title + subtitle `Enquete #{{ pollId }}`), `<section>`, and `<footer>`
  structure mirroring new-poll.
- Swap all elements per the mapping table above. Reactive Forms bindings (`formControlName`,
  `[formControl]`, `formArrayName`) stay identical — Taiga textfields work with Reactive Forms
  unchanged.

Target structure (reference):

```html
<app-navbar></app-navbar>
<main class="content">
  <h1 class="page-title">Editar Enquete</h1>

  @if (loading()) {
    <p class="state-message">Carregando...</p>
  } @else if (pollNotFound()) {
    <p class="state-message">Enquete não encontrada.</p>
  } @else {
    <div tuiCardLarge tuiSurface="floating" class="poll-card">
      <header tuiHeader>
        <h3 tuiTitle>
          Dados da enquete
          <span tuiSubtitle>Enquete #{{ pollId }}</span>
        </h3>
      </header>
      <section>
        <form [formGroup]="editForm" (ngSubmit)="onSubmit()" class="edit-form">
          <tui-textfield tuiTextfieldSize="l">
            <input tuiTextfield formControlName="title" placeholder="Título da enquete" />
          </tui-textfield>

          <div class="options-block" formArrayName="options">
            <span class="text-muted">Opções</span>
            @for (option of options.controls; track $index) {
              <div class="option-wrapper">
                <tui-textfield tuiTextfieldSize="s" class="input" [tuiTextfieldCleaner]="false">
                  <input tuiTextfield [formControl]="option" [placeholder]="'Opção ' + ($index + 1)" />
                </tui-textfield>
                @if (options.length > 2) {
                  <button tuiButtonClose tuiIconButton type="button" size="xs" (click)="removeOption($index)">
                    Remover
                  </button>
                }
              </div>
            }
            <button tuiButton appearance="outline" size="s" type="button" (click)="addOption()">
              Adicionar opção
            </button>
          </div>

          <div class="settings-row">
            <label tuiLabel class="switch-label">
              Exigir login para votar
              <input tuiSwitch type="checkbox" formControlName="voteRequireLogin" />
            </label>
            <tui-textfield tuiTextfieldSize="m" class="duration-input">
              <input
                tuiTextfield
                type="number"
                formControlName="pollExpirationInDays"
                min="1"
                placeholder="Duração (dias)"
              />
            </tui-textfield>
          </div>

          <tui-error [error]="errorMessage()" />

          <footer>
            <a tuiButton appearance="secondary" size="m" routerLink="/my-polls">Cancelar</a>
            <button
              tuiButton
              appearance="primary"
              size="m"
              type="submit"
              [disabled]="saving() || editForm.invalid"
            >
              {{ saving() ? 'Salvando...' : 'Salvar' }}
            </button>
          </footer>
        </form>
      </section>
    </div>
  }
</main>
```

### 3. `edit-poll.less`

- **Fix the invisible text:**
  - `.page-title` → `color: var(--tui-text-primary)` (was `white`)
  - `.state-message` → `color: var(--tui-text-secondary)` (was `#9ca3af`)
- **Delete** all CSS replaced by Taiga components:
  - `.form-input` (including `.short` and `:focus` border)
  - `.btn`, `.btn-save`, `.btn-cancel`, `.btn-add`, `.btn-remove`
  - `.form-label`, `.checkbox-label`
  - `.form-error`
- **Keep/adjust** layout-only CSS:
  - `.content` (50% width, centered) + existing media queries (768px / 576px)
  - `.edit-form` (flex column, gap)
  - `.options-block` — outlined box like new-poll's `.add-options`
  - `.option-wrapper` — flex row, `.input { flex: 1 }`
  - `.settings-row` — flex, switch and duration side by side
  - `.duration-input { width: 160px }` (replaces `.form-input.short`)
  - `footer` — flex-end with gap, inside the card (like new-poll)

### 4. `edit-poll.spec.ts`

- Update only the 3 error assertions from string matching to the `TuiValidationError.message`:
  - `expect(component.errorMessage()).toContain('pelo menos 2 opções')`
    → `expect(component.errorMessage()?.message).toContain('pelo menos 2 opções')`
  - same pattern for the `'já possui votos'` assertion and any other `errorMessage()` assertion.
- Nothing else changes: specs assert component state (not DOM selectors), and `new-poll.spec.ts`
  proves Taiga components render in Vitest/jsdom with no extra providers.

## Verification

1. `cd web && npm test` — all specs green.
2. `cd web && npm run build` — compiles.
3. Manual smoke (`npm start`): open `/my-polls/:id/edit` and confirm
   - title readable on light background,
   - form visually consistent with new-poll,
   - add/remove options works,
   - login switch and duration input work,
   - 409 error message renders via `tui-error`,
   - Cancel/Save navigation works.

## Out of scope

- No behavior changes (duration stays min 1 / no max, same error handling, same routes).
- No global dark-mode introduction — the fix aligns edit-poll to the existing light theme, like the
  rest of the app.
