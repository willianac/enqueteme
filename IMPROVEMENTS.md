# Application Improvement Roadmap

The application works as a small poll MVP, but its most important rules are
currently enforced only by the frontend. Improvements should first make voting
trustworthy, then improve the product experience and production reliability.

## Highest priority

### 1. Add real authentication and persistent sessions

The current sign-in flow only finds or creates a user by name, and the frontend
forgets the user after a refresh. Add an authentication method such as a
passwordless email link, OAuth, or username and password, backed by secure
cookies.

### 2. Enforce voting rules in the API

The backend must reject:

- Votes after a poll expires.
- Anonymous votes when login is required.
- Multiple votes from the same user.
- Votes for invalid or deleted polls.

These checks must live in the API because frontend checks can be bypassed.

### 3. Record individual votes

Add a `Voto` model containing at least:

- `pollId`
- `optionId`
- `userId`, or an anonymous voter token if anonymous voting is supported
- `createdAt`

A unique database constraint on `(pollId, userId)` should enforce one vote per
authenticated user. Vote totals can then be calculated from these records or
maintained transactionally.

### 4. Add poll ownership and management

Allow creators to:

- View their polls.
- Close a poll early.
- Delete a poll.
- Optionally edit a poll before it receives a vote.

The API must verify ownership for every management action.

### 5. Strengthen database constraints

Poll titles, option names, creator IDs, expiration dates, and vote counts should
generally be required rather than nullable. Introduce these constraints through
new Prisma migrations.

## Product improvements

### 6. Add individual, shareable poll pages

Add `GET /polls/:id` and a frontend route such as `/polls/42`. This allows users
to share a specific poll instead of only the complete poll list.

### 7. Make voting states explicit

Display clear states for:

- Open polls.
- Closed or expired polls.
- Polls the current user has already voted on.
- Polls requiring login.

Results should also handle polls with zero votes without invalid percentages.

### 8. Improve loading, empty, and error states

Differentiate an empty poll list from a request failure. Add loading feedback,
a retry action, and a useful empty-state action such as **Create the first
poll**.

### 9. Add ordering and pagination

Return polls newest-first and limit the number returned per request. Add search
only when the number of polls makes it necessary.

### 10. Restore the signed-in user after refresh

Use the authentication session with a `GET /user/me` endpoint so Angular can
restore the current user when the application starts.

## Engineering improvements

### 11. Add focused MySQL integration tests

Keep the existing mocked API contract tests and add a small database-backed test
set for high-risk behavior:

- Duplicate-vote prevention.
- Poll expiration.
- Poll ownership.
- Concurrent voting.

### 12. Prepare production operations

Before a public deployment, add:

- Environment-specific secrets.
- HTTPS and secure cookies.
- Rate limiting for sign-in, poll creation, and voting.
- Structured request and error logs.
- Database backups.
- Prisma migration execution as a release step.

## Recommended order

1. Authentication.
2. Individual vote records and server-side voting rules.
3. Poll ownership and management.
4. Shareable poll pages.
5. User-experience improvements and pagination.
6. Production hardening.

## Deferred until needed

Comments, notifications, categories, analytics dashboards, real-time updates,
and admin panels should wait until actual usage demonstrates a need. They add
surface area without first solving the core trust and voting-integrity problems.
