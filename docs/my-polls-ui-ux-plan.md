# Plan: My Polls Page UI/UX Improvements (Minhas Enquetes)

Status: planned (analysis and instructions only, no implementation yet)

## Context

The app is mid-migration from a custom dark theme to a light theme:

- `web/src/app/app.less` no longer sets `background-color: black` on `.bg`
  (uncommitted change), so the page background is now white.
- `my-poll-card.html` uses Taiga UI `tuiCardLarge tuiSurface="floating"`
  **without** `tuiTheme="dark"` — every other card in the app (`poll.html`,
  `new-poll.html`, `signin.html`) still uses `tuiTheme="dark"`.
- `my-poll-card.less` and `my-polls.less` still carry text colors from the old
  dark design, which are now applied on light surfaces.

Decided direction: **light theme**, using Taiga text tokens
(`var(--tui-text-primary/secondary/tertiary)`). Other pages migrate later.

## Root causes of the reported issues

### 1. Option names are poorly visible

`my-poll-card.less` applies leftover dark-theme colors on the light Taiga card:

- `.option-name { color: #e0e0e0 }` — near-white gray on white card.
- `.option-votes { color: #9ca3af }` and `.card-info { color: #9ca3af }` — low
  contrast on a light background.

Same class of bug on the page itself: `.page-title { color: white }` in
`my-polls.less` makes the "Minhas Enquetes" heading invisible on the white
background, and `.state-message { color: #9ca3af }` is too faint.

### 2. Cards in the same row have different heights

`.poll-list` (`my-polls.less`) is a CSS grid, so the `app-my-poll-card` host
elements in a row already stretch to equal height (grid default
`align-items: stretch`). The inner `div[tuiCardLarge]`, however, only sizes to
its content, so the visible card is shorter for polls with fewer options and
the footer buttons sit at different vertical positions.

## Fix 1: Option-name contrast (light theme)

File: `web/src/app/features/polls/components/my-polls/my-poll-card.less`

Replace the hard-coded grays with Taiga text tokens:

```less
.option-row {
  .option-name {
    color: var(--tui-text-primary);
  }

  .option-votes {
    color: var(--tui-text-secondary);
  }
}

.card-info {
  color: var(--tui-text-tertiary);
}
```

File: `web/src/app/features/polls/components/my-polls/my-polls.less`

```less
.page-title {
  color: var(--tui-text-primary);
}

.state-message {
  color: var(--tui-text-secondary);
}
```

## Fix 2: Equal card heights with aligned footers

File: `web/src/app/features/polls/components/my-polls/my-poll-card.html`

Add a class hook to the card container:

```html
<div tuiCardLarge tuiSurface="floating" class="poll-card">
```

File: `web/src/app/features/polls/components/my-polls/my-poll-card.less`

```less
:host {
  display: flex;
  flex-direction: column;
}

.poll-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

footer {
  margin-top: auto;
}
```

The host fills the grid cell (grid already stretches it), the card grows to
fill the host, and `margin-top: auto` pins the footer to the bottom so the
Editar / Encerrar / Excluir buttons align across the row. No change to
`.poll-list` is needed.

## Cleanup

- `my-poll-card.less`: delete unused pre-Taiga selectors — `.my-poll-card`,
  `.card-header`, `.card-title`, `.badge`, `.card-footer`, `.btn`, `.btn-edit`,
  `.btn-close`, `.btn-delete` (none of these classes exist in the template).
- `my-polls.less`: delete unused `.btn-retry` (the retry button uses
  `tuiButton`) and the redundant `@media (max-width: 768px)` /
  `@media (max-width: 996px)` blocks — both set `grid-template-columns: 1fr`,
  which `repeat(auto-fit, minmax(min(400px, 100%), 1fr))` already handles.

## Prioritized improvement backlog

1. **Expired status badge** — expired polls currently only disable "Encerrar"
   and hide the days counter; there is no explicit state. Add an "Encerrada"
   indicator (e.g. `tui-chip`/`tui-badge` next to the title, or replacing the
   days counter). Note: `my-poll-card.spec.ts` already expects the text
   `'Encerrada'` for expired polls, so the spec appears to be failing today —
   this fix makes it pass.
2. **Per-option percentage + progress bar** — mirror the voting page results
   view (`poll.ts` computes `votePercentage` client-side and renders
   `tuiProgressBar`; `PollType.options[]` already has optional
   `votePercentage`/`progressColor`). Makes results scannable at a glance.
3. **Pluralization** — render "1 voto / N votos" and "1 dia / N dias" instead
   of "voto(s)" / "dia(s)".
4. **Layout container** — replace `.content { width: 70% }` with a `max-width`
   container (e.g. `1200px`, auto margins, side padding) and consider a
   3-column grid on wide screens via a smaller `minmax` (e.g. `320px`).
5. **Empty-state CTA** — add a "Criar enquete" button linking to `/new-poll`
   in the `polls().length === 0` state.
6. **Destructive-action UX** — separate "Excluir" visually/spatially from the
   safe actions and replace the native `confirm()` with a Taiga dialog
   (already flagged as future work in `poll-management-frontend-plan.md`).
7. **Navbar user greeting** (out of this page's scope, same migration issue) —
   `.user { color: white }` in `navbar.less` is invisible on the light navbar.

## Tests

- `my-poll-card.spec.ts` — keep the existing `'Encerrada'` expectation green
  once the badge lands; add a case asserting option names render (already
  covered) and that footers exist for both active and expired polls.
- `my-polls.spec.ts` — no behavioral change expected for the contrast/height
  fixes (style-only); update if the empty-state CTA is added.
- Run with `cd web && npm test` (Vitest).
