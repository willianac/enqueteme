# Plan: Complete Items 7 & 8 from IMPROVEMENTS.md

## Goal

Close the two verified gaps in the polls app:

- **Item 7 (missing part):** a persistent, explicit "current user has already voted" state.
- **Item 8 (missing part):** loading / error / retry / empty-with-action states on the main `/polls` list (the pattern already exists in `MyPolls`; it was never applied to the public list).

## Verified gaps and current code

### Item 7 — "already voted" state is session-only

- `PollType` (`web/src/app/shared/types/Poll.ts`) has no `hasVoted` field.
- The API (`api/src/enquetes/enquetes.service.ts` `toResponse`, line 228) never exposes whether the caller voted; duplicate voting is only rejected at vote time with 409 (`ConflictException`).
- `Poll` component (`web/.../poll/poll.ts` line 55, 99) sets `voted = true` only after an in-session successful vote, so a refresh loses the state and re-renders the voting form.
- `GET /polls` (`api/src/enquetes/enquetes.controller.ts` line 33) is public, but the same optional-session pattern already exists in `vote()` (line 89) via `auth.resolveSession(cookie)` — reuse it; no guard needed.
- The `Voto` table (`api/prisma/schema.prisma` line 63) already records `enqueteId`, `opcaoId`, `usuarioId` with `@@unique([enqueteId, usuarioId])` — **no migration needed**, only query/DTO changes.

### Item 8 — main list has no states

- `web/src/app/features/polls/polls.ts` is `polls$ = this.pollApi.getAllPolls()`, and `polls.html` only branches on `polls?.length` — a failed request and an empty list both render "Nenhuma enquete encontrada".
- `getAllPolls` can return **204 No Content** → Angular delivers a `null` body; the rewrite must handle `polls ?? []`.
- The target pattern to mirror already exists in `my-polls.ts/.html/.less` (signals `loading`/`error`, `loadPolls()`, "Tentar novamente", "Criar enquete") and its specs (`my-polls.spec.ts` lines 74, 111).

## Commit sequence (atomic, conventional)

### Commit 0 — `docs: add implementation plan for improvements 7 and 8`

Create `docs/PLAN-items-7-8.md` (this document). Nothing else.

### Commit 1 — `feat(api): mark polls the current user has already voted on`

1. `api/src/enquetes/enquetes.controller.ts` — in `findAll`, accept `@Req() request: Request`, resolve the optional session with `this.auth.resolveSession(request.cookies?.[SESSION_COOKIE] as string | undefined)` (identical to `vote()`), and pass the result to the service.
2. `api/src/enquetes/enquetes.service.ts`:
   - Extend the payload type: `type EnqueteCompleta = Prisma.EnqueteGetPayload<{ include: { usuario: true; opcoes: true } }> & { votos?: { opcaoId: bigint }[] }`.
   - `findAll(usuario: AuthenticatedUser | null)`: add conditional include — `votos: usuario ? { where: { usuarioId: BigInt(usuario.id) }, select: { opcaoId: true } } : false`.
   - `findMine`: include the owner's `votos` the same way (owner state stays consistent).
   - `toResponse`: append `hasVoted: Boolean(enquete.votos?.length)` and `votedOptionId: enquete.votos?.[0] ? toSafeNumber(enquete.votos[0].opcaoId) : null`.
3. `api/test/enquetes.e2e-spec.ts` — add/adjust `GET /polls` specs:
   - Anonymous: body entries contain `hasVoted: false`, `votedOptionId: null`.
   - Authenticated (session cookie, `findMany` returning a poll with `votos: [{ opcaoId: 20n }]`): expect `hasVoted: true`, `votedOptionId: 20`.
4. Verify: `cd api && npm test`.

**Limitation (documented, accepted):** anonymous votes have `usuarioId: null` and MySQL treats NULLs as distinct, so `hasVoted` only works for authenticated users. Anonymous repeat voters keep the 409-less behavior they have today.

### Commit 2 — `feat(web): show persistent "already voted" state on poll cards`

1. `web/src/app/shared/types/Poll.ts` — add optional fields `hasVoted?: boolean; votedOptionId?: number | null;`.
2. `web/.../poll/poll.ts` — in `ngOnChanges`, initialize from the input: `this.voted = Boolean(this.pollData.hasVoted)` and, when `voted`, `this.idOptionChosen = this.pollData.votedOptionId ?? null`. (In-session voting still flips `voted`/`idOptionChosen` immediately; `ngOnChanges` doesn't re-trigger because the vote handler mutates `pollData.options` in place.)
3. `web/.../poll/poll.html` — add an explicit chip next to "Requer login"/"Encerrada": `@if (voted) { <tui-chip size="xs" appearance="positive">Você votou</tui-chip> }`. The existing result view already hides the form and highlights `idOptionChosen` with the check icon, so the persisted identifier makes the chosen option survive a refresh.
4. `web/.../poll/poll.spec.ts` — new spec: poll with `hasVoted: true, votedOptionId: 1` renders the result view (no "Votar" button), shows "Você votou", and marks the chosen option.
5. Verify: `cd web && npm test`.

### Commit 3 — `feat(web): add loading, error, retry and empty states to the poll list`

1. `web/src/app/features/polls/polls.ts` — replace `polls$` with the `MyPolls` pattern: `polls = signal<PollType[]>([])`, `loading = signal(true)`, `error = signal(false)`; `implements OnInit` calling `loadPolls()`; `loadPolls()` sets `loading(true)`/`error(false)`, subscribes `getAllPolls()`, on next sets `polls(polls ?? [])` + `loading(false)`, on error sets `error(true)` + `loading(false)`. Import `TuiButton` and `RouterLink`.
2. `web/src/app/features/polls/polls.html` — four branches mirroring `my-polls.html`:
   - `loading()` → "Carregando enquetes..."
   - `error()` → "Não foi possível carregar as enquetes." + "Tentar novamente" button calling `loadPolls()`
   - `polls().length === 0` → "Nenhuma enquete encontrada" + "Criar enquete" button with `routerLink="/new-poll"` (the **Create the first poll** action from item 8)
   - else → existing `app-poll` grid.
3. `web/src/app/features/polls/polls.less` — add `.state-message`, `.error-state`, `.empty-state` copied from `my-polls.less`; remove the now-unused `.no-polls`.
4. `web/src/app/features/polls/polls.spec.ts` — rewrite the mock as `getAllPolls: vi.fn()`; cover: (a) empty state shows message + "Criar enquete"; (b) `throwError` shows the failure message + "Tentar novamente"; (c) clicking retry re-calls `getAllPolls` and renders the list on success; (d) successful load renders poll cards.
5. Verify: `cd web && npm test`.

## Final verification checklist

- [ ] `cd api && npm test` — all green, including the two new `hasVoted` specs.
- [ ] `cd web && npm test` — all green, including new poll-card and poll-list specs.
- [ ] Manual smoke: sign in → vote → refresh → card shows results, "Você votou", and the check icon on the chosen option.
- [ ] Manual smoke: stop the API → list shows error + retry; restart and retry → list loads.
- [ ] Manual smoke: empty database → list shows empty state with "Criar enquete".

No `AGENTS.md` update needed — no structure, commands, or conventions change. No Prisma migration needed.
