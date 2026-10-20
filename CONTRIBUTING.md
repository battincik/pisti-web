# Contributing

Contributions, bug reports, and improvement proposals are welcome.

## Development setup

Clone the repository:

```bash
git clone https://github.com/battincik/pisti-web.git
cd pisti-web
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Before submitting changes

Run the type checker:

```bash
npm run typecheck
```

Create a production build:

```bash
npm run build
```

## Code organization

When contributing, keep responsibilities separated:

- game rules and card-domain helpers belong in `lib/game.ts`
- browser persistence belongs in `lib/storage.ts`
- reusable card rendering belongs in `components/CardView.tsx`
- application orchestration and screens belong in `components/PistiGame.tsx`
- visual behavior belongs in `app/globals.css`

Avoid placing scoring or capture rules directly inside visual card components.

## Game-rule changes

Pişti has several regional rule variations. If a contribution changes scoring or capture behavior:

1. describe the exact rule variation
2. update `docs/GAME_RULES.md`
3. keep the rule deterministic
4. avoid silently changing existing game modes

If the variation is substantially different, a configurable ruleset is preferable to replacing the default behavior.

## UI changes

UI changes should preserve:

- desktop usability
- mobile usability
- visible keyboard focus
- reduced-motion behavior
- readable card values and suits

Animations should not be required to understand game state.

## Persistence changes

Do not change existing `localStorage` structures without considering migration behavior.

If a stored model becomes incompatible with the current schema, introduce a new versioned key or an explicit migration.

## Commit style

Short conventional-style commit messages are preferred, for example:

```text
feat: add hard bot difficulty
fix: award remaining table cards correctly
docs: explain countdown scoring
refactor: extract round reducer
```

## Pull requests

A good pull request should explain:

- what changed
- why it changed
- whether game rules changed
- whether browser storage changed
- how the change was tested

Small, focused pull requests are easier to review and maintain.
