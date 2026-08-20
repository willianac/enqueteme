# Plan: Poll Management Frontend (Minhas Enquetes)

Status: planned (scaffold only, no implementation yet)

## Context

Backend commit `910bbed` (feat: add poll ownership and management API) exposed the
following endpoints, all requiring an authenticated session except where noted:

- `GET /api/polls/mine` → `PollType[]` (same shape as the existing `PollType` in
  `web/src/app/shared/types/Poll.ts`)
- `PATCH /api/polls/:id` → edit a poll the user owns
  - Body: `title` (required), `options: string[]` (required, min 2, replaces all
    options), `voteRequireLogin?`, `pollExpirationInDays?`
  - Returns `409 Conflict` if the poll already has votes
  - Ownership errors: `401` / `403` / `404`
- `PATCH /api/polls/:id/close` → close early (sets `expirationDate` to now),
  returns the updated poll
- `DELETE /api/polls/:id` → hard delete, returns `204 No Content`

## Constraints

- **No Taiga UI** kits, components, directives, or styles in the new code. Plain
  Angular only (`CommonModule`, `ReactiveFormsModule`, `RouterLink`).
- UI feedback uses component-level message signals and native `confirm()` as
  placeholders so Taiga alerts/dialogs can be swapped in later.
- Follow existing conventions: two spaces, single quotes, strict TypeScript,
  LESS stylesheets, Portuguese domain names (`Enquete`, `Opcao`).

## 1. Extend `PollApi`

File: `web/src/app/features/polls/services/poll-api.ts`

Add to the existing service (no new service needed):

- `getMyPolls(): Observable<PollType[]>` → `GET /api/polls/mine`
- `updatePoll(id: number, request: UpdatePollRequest): Observable<PollType>` →
  `PATCH /api/polls/:id` (request mirrors `UpdateEnqueteDto`: `title`,
  `options`, optional `voteRequireLogin`, optional `pollExpirationInDays`)
- `closePoll(id: number): Observable<PollType>` → `PATCH /api/polls/:id/close`
- `deletePoll(id: number): Observable<void>` → `DELETE /api/polls/:id`
  (expects `204`)

## 2. Components

Directory: `web/src/app/features/polls/components/my-polls/`

Each component gets its `.ts`, `.html`, `.less`, and `.spec.ts` files together,
matching the repo layout.

### `my-polls` (page)

- Loads polls via `PollApi.getMyPolls()` into signals.
- Renders states: `loading`, `error` (with retry), empty ("no polls found"), and
  the list of `my-poll-card` components.
- Exposes handlers passed down to cards:
  - delete → remove the poll from the list signal after `204`
  - close → replace the poll in place with the updated `PollType` returned by
    the API
  - edit → navigate to the `edit-poll` route for that poll

### `my-poll-card`

- Inputs: `pollData: PollType` (required).
- Outputs: `edit`, `close`, `delete` (emit the poll id).
- Displays: title, option names with vote counts, days remaining
  (reuse the `calcDaysRemaining` logic from `poll.ts`), total votes, expired
  badge when `expirationDate <= now`.
- Plain buttons for Editar / Encerrar / Excluir; Encerrar disabled when already
  expired; Excluir triggers native `confirm()` as a placeholder.

### `edit-poll`

- Route parameter: poll id. Loads the poll from `getMyPolls()` result (or
  re-fetches) and pre-fills the form.
- Reactive form:
  - `title: FormControl<string>` (required, non-empty)
  - `options: FormArray<FormControl<string>>` (min 2 controls, each required and
    trimmed non-empty; add/remove option buttons)
  - `voteRequireLogin: FormControl<boolean>`
  - `pollExpirationInDays: FormControl<number>` (optional, min 1)
- Submit calls `PollApi.updatePoll`; while saving, the submit button is disabled.
- Error mapping:
  - `409` → "Esta enquete já possui votos e não pode ser editada."
  - `403` / `404` → "Enquete não encontrada."
  - other → generic error message
- Success → navigate back to `/my-polls`.

## 3. Routing & navigation

- `web/src/app/app.routes.ts`: add

  ```ts
  {
    path: 'my-polls',
    component: MyPolls,
    canActivate: [authGuard],
    title: 'Minhas enquetes',
  },
  ```

  plus a parametrized edit route (e.g. `my-polls/:id/edit`) guarded by
  `authGuard`.

- Navbar (`web/src/app/shared/components/navbar/navbar.*`): add a "Minhas
  enquetes" link shown only when `userApi.user()` is set.

## 4. Tests

- `my-polls.spec.ts` — loads list, empty state, delete removes item, close
  updates item in place.
- `my-poll-card.spec.ts` — renders poll data, emits outputs on button clicks,
  disables Encerrar for expired polls.
- `edit-poll.spec.ts` — form pre-fill, min 2 options validation, 409 error
  message, successful submit navigates back.
- Run with `cd web && npm test` (Vitest).

## 5. Future UI work (out of scope for the scaffold)

- Replace native `confirm()` and message signals with Taiga dialogs/alerts.
- Replace plain form controls with Taiga textfields/sliders/switches.
