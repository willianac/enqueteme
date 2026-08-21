# Plan: Standardize Poll Cards Across Main Page and My Polls

Status: planned (analysis and instructions only, no implementation yet)

## Context

`my-poll-card` (My Polls page) is the layout standard, implemented per
`docs/my-polls-ui-ux-plan.md`:

- Equal-height cards: `:host` flex column + `.poll-card { flex: 1 }` +
  `footer { margin-top: auto }`.
- Option rows: name on the left (`--tui-text-primary`), "N votos (X%)" on the
  right (`--tui-text-secondary`), with a full-width `tuiProgressBar size="s"`
  under each row, colored by `progressColor(index)`.
- Expired polls show an "Encerrada" `tui-chip` and no days counter.
- Helpers: `votePercentage()`, `progressColor()`, `pluralize()`,
  `totalVotes`, `daysRemaining`, `isExpired`.

The main page (`polls.html` + `poll` component) diverges from this standard.
Goal: make the main page cards follow the same layout rules.

## Root causes of the reported issues

### 1. Unequal card heights on the main page

`polls.less` uses a grid whose items stretch, but the card is buried under
four wrapper levels, none of which propagate height:

```
.poll-list (grid) > .poll > app-poll > .poll-wrapper > div[tuiPlatform] > .poll-card
```

So `div[tuiCardLarge]` sizes to content and cards with fewer options render
shorter, with footers at different vertical positions.

### 2. Result (progress bar) layout differs from my-polls

The voted state in `poll.html` renders a two-column layout (`.percentage` at
10% width + `.progress` holding the name and bar), unlike the my-polls
stacked row + full-width bar. Worse, `poll.less` still has
`.result .option-votes { color: white }` — a dark-theme leftover. On the light
card only the `.chosen` row is visible (accent color override); every other
option's percentage and name are white-on-white, which is why the screenshot
shows "empty" gray bars.

### 3. Related defects found while analyzing

- **Negative days**: an expired poll renders "-1 dias restantes" in the
  footer (`calcDaysRemaining` can go negative) and keeps an active "Votar"
  button; the failure only surfaces after clicking.
- `polls.less`: dead `flex-wrap: wrap` on a grid container, fixed
  `repeat(2, 1fr)` columns, `.no-polls { color: white }` (invisible empty
  state) and the English "No polls found" copy.
- `polls.html` wraps each card in a `.poll` div that has no styles;
  `poll.html` has a `.poll-wrapper` div with no styles and an inline
  `style="display: flex; flex-direction: column;"` on the header.
- Logic duplication with divergent implementations: `progressColors`,
  percentage, days remaining, and pluralization exist in both `poll.ts` and
  `my-poll-card.ts` (poll.ts computes percentage by mutating options after
  voting; my-poll-card computes via helpers).

## 1. Shared poll helpers (foundation for the standard)

New file: `web/src/app/shared/utils/poll-utils.ts`

Pure functions so both cards compute everything identically:

```ts
import { PollType } from '../types/Poll';

export const PROGRESS_COLORS = [
  'var(--tui-text-action)',
  'var(--tui-text-negative-hover)',
  'var(--tui-text-positive-hover)',
  'var(--tui-text-primary)',
  'var(--tui-text-tertiary)',
];

export function pollTotalVotes(options: PollType['options']): number;
export function pollVotePercentage(votes: number, totalVotes: number): number; // 0 when total is 0
export function pollProgressColor(index: number): string;
export function pluralizePt(count: number, singular: string, plural: string): string;
export function pollDaysRemaining(expirationDate: string): number;
export function pollIsExpired(expirationDate: string): boolean;
```

Refactor `my-poll-card.ts` to consume these (drop its local copies), keeping
its public template API unchanged.

## 2. Equal-height cards on the main page

File: `web/src/app/features/polls/polls.html`

Remove the unstyled `.poll` wrapper so grid children are the component hosts
(parity with `my-polls.html`):

```html
@for (poll of polls; track poll.id) {
  <app-poll [pollData]="poll" />
}
```

File: `web/src/app/features/polls/components/poll/poll.html`

Flatten the wrapper chain to a single card element carrying all directives
(they are all attribute directives and compose on one element):

```html
<div tuiPlatform="web" tuiSurface="floating" tuiCardLarge class="poll-card">
```

File: `web/src/app/features/polls/components/poll/poll.less`

Mirror the my-poll-card height pattern:

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
  margin-top: auto; // replaces the current footer block's positioning role
}
```

Keep the existing `footer` flex row (info left, action right); just add
`margin-top: auto`. Move the header's inline style to a `.poll-header` class.

Verification: if removing `tuiPlatform`'s wrapper regresses control styling
(radios/progress), keep one wrapper div and propagate `height: 100%` down the
chain instead — the visual check below catches this.

## 3. Standard result layout (voted state)

File: `web/src/app/features/polls/components/poll/poll.html`

Replace the `.percentage` / `.progress` columns in the `@else` (voted) block
with the my-polls stacked pattern, keeping the chosen-option highlight:

```html
<section class="result" animate.enter="enter-animation">
  @for (option of pollData.options; track option.id; let i = $index) {
    <div class="option-row">
      <span class="option-name" [class.chosen]="option.id === idOptionChosen">
        {{ option.name }}
        @if (option.id === idOptionChosen) {
          <tui-icon icon="@tui.circle-check" [style.color]="'var(--tui-background-accent-2)'" />
        }
      </span>
      <span class="option-votes" [class.chosen]="option.id === idOptionChosen">
        {{ pluralize(option.votes, 'voto', 'votos') }} ({{ percentage(option.votes) }}%)
      </span>
    </div>
    <progress
      size="s"
      tuiProgressBar
      [max]="100"
      [value]="percentage(option.votes)"
      [color]="progressColor(i)"
    ></progress>
  }
</section>
```

File: `poll.ts`

- Add thin delegators to the shared helpers: `percentage(votes)`,
  `progressColor(index)`, `pluralize(...)`, and an `isExpired` getter.
- Delete `returnOptionsWithPercentageAndColors` and the `progressColors`
  array (superseded by shared helpers); on vote success, keep
  `this.pollData.options = res.options` and `this.totalVotes++`.

File: `poll.less`

- Delete the stale `.result` block (including `color: white`) and replace
  with the standard classes copied from `my-poll-card.less`: `.option-row`
  with `--tui-text-primary` names and `--tui-text-secondary` votes.
- Keep `.chosen` (bold + accent) and the enter/leave animations.

## 4. Expired state on the main page

File: `web/src/app/features/polls/components/poll/poll.html` / `poll.ts`

- Show the "Encerrada" `tui-chip` (same as my-polls) when `isExpired`.
- When expired, render the result section read-only (no radios, no Votar
  button) — results are the only meaningful state for a closed poll, matching
  the my-polls summary. If that is considered too big a behavior change, the
  minimal alternative is: disable "Votar" and show "Encerrada" in the footer
  instead of the days counter.
- Footer: never render negative days — show
  `pluralize(daysRemaining, 'dia', 'dias') + ' restantes'` only when
  `!isExpired`.

## 5. Grid and page parity

File: `web/src/app/features/polls/polls.less`

Adopt the my-polls layout values:

```less
.content {
  max-width: 1200px;
  margin-inline: auto;
  padding: 0 1rem 2rem;
}

.poll-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(400px, 100%), 1fr));
  gap: 1.5rem;
  margin-top: 1rem; // keep existing vertical rhythm
}
```

- Remove `flex-wrap: wrap`, the fixed `repeat(2, 1fr)`, and both media
  queries (the auto-fit/minmax pattern and the padding-based container cover
  narrow screens).
- `.no-polls`: `color: var(--tui-text-secondary)` and change the copy to
  Portuguese ("Nenhuma enquete encontrada") for consistency with the rest of
  the app.

## 6. Tests

- `polls.spec.ts` — update the empty-state expectation from "No polls found"
  to "Nenhuma enquete encontrada".
- `poll.spec.ts` — add cases:
  - expired poll renders "Encerrada" and does not render "dias restantes" nor
    an enabled "Votar";
  - after a successful vote, the result view renders each option name, its
    "N votos (X%)" text, and one `progress[tuiProgressBar]` per option;
  - percentage helper returns 0 when the poll has no votes.
- `my-poll-card.spec.ts` — should stay green after the shared-helper refactor
  (no template API change).
- Run with `cd web && npm test` (Vitest).

## 7. Visual verification

`cd web && npm start`, then on the main page confirm:

1. Cards in the same row have equal heights and aligned footers, with polls
   of 2, 3, and 4+ options (covers both reported inconsistencies).
2. After voting, every option row shows name + "N votos (X%)" + colored bar;
   the chosen option keeps the accent highlight and check icon.
3. An expired poll shows "Encerrada", no negative days, and no active Votar.
4. Resize below ~500px: grid collapses to one column without media queries.

## Out of scope

- The pre-vote radio form keeps its current look (there is nothing to
  standardize against on my-polls, which has no voting UI).
- `new-poll` and `edit-poll` pages.
- The uncommitted `new-poll.ts` change in the working tree is unrelated; do
  not touch it.
