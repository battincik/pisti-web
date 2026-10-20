# Pişti Web

A polished, animated, single-player browser implementation of **Pişti**, the classic Turkish card game. The project is built as a local-first Next.js application: no account, backend, database, or external API is required to play.

## Highlights

- Single-player gameplay against a lightweight rule-based bot
- Multiple match formats: Single Game, 51 Points, 101 Points, and 101 Countdown
- Standard Pişti scoring with Jack Pişti support
- Player-specific Pişti effects: human in green, bot in blue
- Blue / gray / black application theme while preserving classic red/black playing-card colors
- Illustrated mirrored J, Q, and K face cards
- Ascending hand sorting from lowest to highest card value
- Animated dealing sequence for every new hand
- Directional collection animation: bot collects left, player collects right
- Animated card throws, captures, and Pişti celebrations
- Paper/card/table-inspired procedural Web Audio effects
- Bot and player Pişti counters shown during the game
- Responsive layout with reduced-motion support
- Local statistics, preferences, and recent match history
- Vercel-ready deployment with zero environment variables

## Technology

- **Next.js** — application framework and production build
- **React** — interactive game interface and local state
- **TypeScript** — game-state and rules safety
- **CSS** — card visuals, responsive layout, and animations
- **Web Audio API** — generated paper, card, capture, and table-hit sound effects
- **localStorage** — local-first persistence for settings, stats, and history
- **Vercel** — static/serverless-friendly deployment target

## How the Game Works

A standard 52-card deck is shuffled at the beginning of each round. Four cards are placed on the table and four cards are dealt to each player. After both hands are exhausted, another four-card hand is dealt until the deck is empty.

A card captures the table when its rank matches the top card. A Jack can capture any non-empty table. If the table contains exactly one card and the matching card captures it, the move is a Pişti. A Jack on a single Jack is treated as a Jack Pişti.

The final cards left on the table are awarded to the player who most recently captured the table.

## Scoring

| Event | Points |
| --- | ---: |
| Ace | 1 |
| Jack | 1 |
| Clubs 2 | 2 |
| Diamonds 10 | 3 |
| Most captured cards | 3 |
| Pişti | 10 |
| Jack Pişti | 20 |

## Game Modes

### Single Game

One full deck is played and the player with the highest round score wins.

### 51 Points

Round scores accumulate until either the player or bot reaches 51 points.

### 101 Points

A longer cumulative format. The first side to reach 101 wins.

### 101 Countdown

Both sides begin at 101. Each round score is subtracted from the remaining total. The first side to reach zero wins.

## Hand Ordering

The visible hand is kept in deterministic ascending rank order:

`A → 2 → 3 → ... → 10 → J → Q → K`

Cards with the same rank are then ordered consistently by suit. This makes the hand easier to scan and avoids random reordering between deals.

## Bot Strategy

The bot uses a compact rule-based strategy rather than random card selection.

It prioritizes:

1. Capturing the current table when possible.
2. Using a matching rank before spending a Jack.
3. Avoiding high-value or strategically useful cards when discarding.
4. Adding small randomness to otherwise equivalent discard decisions.

This keeps the implementation understandable while producing more believable gameplay than purely random choices.

## Animation Model

Visual effects are intentionally separated from the core rules.

- Cards are visually dealt from the center toward both players.
- Played cards animate toward the table.
- Captured piles animate toward the correct owner: **bot to the left, player to the right**.
- Pişti triggers a dedicated full-screen effect. The human effect is green and the bot effect is blue.
- Reduced-motion preferences disable the larger motion sequences without changing gameplay.

This separation keeps the game engine deterministic and prevents animation timing from becoming part of the rule logic.

## Audio Design

The game does not depend on downloaded audio assets. Short procedural sounds are synthesized through the Web Audio API using filtered noise and low-frequency table taps.

Different sound profiles are used for:

- placing a card,
- sweeping/capturing the table,
- Pişti.

The goal is a dry paper-and-table character closer to playing physical cards than a traditional UI beep.

## Local-First Persistence

The application stores only local browser data. No gameplay or identity data is sent to a remote server.

Persisted information includes:

- game preferences,
- sound and motion settings,
- completed-game statistics,
- recent match history.

See `docs/STATE_AND_PERSISTENCE.md` for more detail.

## Project Structure

```text
app/
├── globals.css
├── layout.tsx
├── page.tsx
└── theme.css

components/
├── CardView.tsx
├── GameEffects.tsx
├── GameEffects.module.css
└── PistiGame.tsx

lib/
├── game.ts
└── storage.ts

docs/
├── ARCHITECTURE.md
├── GAME_RULES.md
└── STATE_AND_PERSISTENCE.md
```

## Running Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

For a production build:

```bash
npm run build
npm start
```

## Deploying to Vercel

The repository can be imported directly into Vercel.

1. Create a new Vercel project.
2. Import `battincik/pisti-web` from GitHub.
3. Keep the automatically detected Next.js settings.
4. Deploy.

No environment variables, database provisioning, or external services are required.

## Design Principles

### Local first

The game should remain instantly playable without login, network latency, or service dependencies.

### Rules before presentation

Gameplay rules remain independent from animation and visual effects so that UI changes do not alter scoring behavior.

### Small, explicit game state

The entire live game can be represented using the deck, hands, table, captured piles, active turn, and last-capture owner.

### Progressive complexity

The bot is intentionally understandable and replaceable. A stronger probability-aware strategy can be introduced later without redesigning the UI or scoring engine.

### Deployment simplicity

The application is intentionally suitable for GitHub → Vercel deployment without infrastructure configuration.

## Possible Future Work

- Difficulty levels and probability-aware bot strategy
- Multiplayer rooms using WebSockets
- Replay/event-log system
- Installable PWA support
- More configurable rulesets
- Additional deck designs and themes
- Cloud synchronization as an optional layer
- Accessibility-focused keyboard gameplay

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — architecture and technical decisions
- [`docs/GAME_RULES.md`](docs/GAME_RULES.md) — implemented rules and scoring
- [`docs/STATE_AND_PERSISTENCE.md`](docs/STATE_AND_PERSISTENCE.md) — local state and persistence model
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — contribution guidelines

## License

This repository is currently provided as a portfolio and personal project. Add a dedicated license file before reusing the project in another product.
