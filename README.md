# Pişti Web

A modern, animated, single-player browser implementation of **Pişti**, the classic Turkish card game.

Pişti Web is designed as a fully client-side application. It does not require a backend, account system, API, or remote database. Game state is handled in the browser and persistent user data is stored locally with `localStorage`, which makes the project lightweight, privacy-friendly, easy to deploy, and suitable for Vercel.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-20232a?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)

## Overview

The goal of this project is to reproduce the core rules and feel of Pişti while presenting the game through a modern web interface.

The application includes multiple game modes, a lightweight decision-making bot, animated card interactions, local statistics, persistent preferences, responsive layouts, and reduced-motion support.

### Main features

- Single-player gameplay against a local bot
- Standard 52-card deck
- Traditional Pişti capture mechanics
- Normal Pişti and Jack-on-Jack Pişti scoring
- Special scoring cards
- Automatic dealing between hands
- Last-capture handling when the deck is exhausted
- Multiple match formats
- Animated card dealing and table movement
- Sound feedback through the Web Audio API
- Local statistics and match history
- Persistent settings using `localStorage`
- Reduced-motion option
- Responsive desktop and mobile layout
- No server-side persistence
- No authentication
- No environment variables required
- Direct Vercel deployment

## Game modes

### Single Game

One full deck is played. The player with the highest score at the end of the deck wins.

### 51 Points

Each completed deck contributes to the running match score. The first player to reach **51 points** wins the match.

### 101 Points

A longer version of the same cumulative scoring format. The first player to reach **101 points** wins.

### Countdown from 101

Both players start at **101**. The score earned in each round is subtracted from the player's remaining total. The first player to reach **0** wins.

This mode is represented internally as `countdown101`.

## Scoring

| Event | Points |
| --- | ---: |
| Normal Pişti | 10 |
| Jack on Jack Pişti | 20 |
| Most captured cards | 3 |
| Ten of Diamonds | 3 |
| Two of Clubs | 2 |
| Each Ace | 1 |
| Each Jack | 1 |

When the deck is exhausted, any cards still remaining on the table are awarded to the player who made the most recent capture.

For a more detailed description, see [docs/GAME_RULES.md](docs/GAME_RULES.md).

## Technology stack

### Application

- **Next.js 16** — application framework and App Router
- **React 19** — component model and UI state
- **TypeScript 5** — typed game domain and application code

### Browser APIs

- **localStorage** — statistics, preferences, and recent match history
- **Web Audio API** — generated sound effects without audio assets
- **Crypto API** — identifiers for local history records

### Styling

- Custom CSS
- CSS Grid and Flexbox
- CSS keyframe animations
- Responsive media queries
- `prefers-reduced-motion` support

There is intentionally no external UI framework or animation dependency. The card table, cards, responsive states, and animations are built directly with React and CSS.

## Architecture

The project keeps game rules separate from UI and browser persistence.

```text
pisti-web/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── CardView.tsx
│   └── PistiGame.tsx
├── lib/
│   ├── game.ts
│   └── storage.ts
├── public/
│   └── favicon.svg
└── docs/
    ├── ARCHITECTURE.md
    ├── GAME_RULES.md
    └── STATE_AND_PERSISTENCE.md
```

The most important architectural principle is that **domain logic does not depend on React**.

Functions such as deck creation, shuffling, capture checks, card scoring, and bot card selection live in `lib/game.ts`. React is primarily responsible for orchestrating turns, rendering state, animations, and browser persistence.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the detailed flow.

## How the game works internally

A round begins by generating and shuffling a standard 52-card deck.

```ts
const deck = shuffle(createDeck());
```

Four cards are placed on the table, four cards are dealt to the player, and four cards are dealt to the bot.

After both hands become empty, another four cards are dealt to each side. This continues until the deck has been consumed.

### Turn processing

```text
Player chooses card
        ↓
Validate current turn
        ↓
Compare card with top table card
        ↓
Capture or append to table
        ↓
Detect Pişti
        ↓
Switch turn
        ↓
Deal again if both hands are empty
        ↓
Finish and score round when deck is empty
```

A card captures the table when either:

1. its rank matches the top card on the table, or
2. the played card is a Jack.

If the table contains exactly one card when a qualifying capture is made, the move can qualify as a Pişti.

## Bot strategy

The bot is intentionally lightweight and understandable rather than acting as an opaque AI opponent.

Its priorities are:

1. Capture when possible.
2. Prefer a normal rank match over spending a Jack.
3. Preserve higher-value cards where practical.
4. Avoid discarding a Jack unless necessary.
5. Add a small random factor between similarly ranked discard options.

The strategy is implemented in `botChooseCard()` inside `lib/game.ts`.

This keeps gameplay entirely local and avoids network latency, model inference, API costs, and backend infrastructure.

## State model

The active round keeps the following information in memory:

```ts
type GameState = {
  deck: Card[];
  humanHand: Card[];
  botHand: Card[];
  table: Card[];
  human: RoundScore;
  bot: RoundScore;
  turn: "human" | "bot";
  lastCapture: "human" | "bot" | null;
  deal: number;
  status: "playing" | "round-end";
};
```

Active gameplay state is intentionally not persisted after every card. Persistent browser storage is reserved for information that should survive reloads over time:

- user preferences
- aggregate statistics
- recent game history

See [docs/STATE_AND_PERSISTENCE.md](docs/STATE_AND_PERSISTENCE.md).

## Local persistence

The application uses versioned keys:

```text
pisti.stats.v1
pisti.preferences.v1
pisti.history.v1
```

Versioned keys make future storage migrations safer if the data structures change.

No game data is sent to a server.

## Animations

Animations are implemented with CSS instead of an animation library.

Examples include:

- cards entering the player's hand
- hidden bot cards being dealt
- cards appearing on the center stack
- score/result overlays
- toast feedback
- hover lift for playable cards

The application also respects the operating system's `prefers-reduced-motion` setting and exposes an additional in-game reduced-animation preference.

## Running locally

### Requirements

- Node.js 20.19+ or Node.js 22+
- npm, pnpm, yarn, or Bun

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

Open `http://localhost:3000`.

### Type check

```bash
npm run typecheck
```

### Production build

```bash
npm run build
npm run start
```

## Deploying to Vercel

The repository can be imported directly into Vercel.

1. Open Vercel.
2. Select **Add New → Project**.
3. Import `battincik/pisti-web`.
4. Keep the detected framework as **Next.js**.
5. Deploy.

No environment variables or external services are required.

CLI deployment is also supported:

```bash
npx vercel
```

## Design principles

### Local-first

The game remains playable without an application backend. Persistence belongs to the browser unless a future feature explicitly requires synchronization.

### Domain logic before UI logic

Card rules remain understandable independently of rendering concerns.

### Minimal dependencies

A turn-based card game does not require a large state-management or animation stack. Browser capabilities are used where they are sufficient.

### Progressive complexity

The current architecture can later support:

- difficulty levels
- improved bot strategies
- replayable game logs
- multiplayer rooms
- user accounts
- synchronized statistics
- achievements
- PWA/offline installation
- automated game-engine tests

without rewriting the base card model.

## What this project demonstrates

- client-side application architecture
- game-state modeling
- turn-based state transitions
- TypeScript domain modeling
- browser persistence
- responsive interface development
- animation design
- accessibility preferences
- deployment-oriented frontend architecture

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Game Rules](docs/GAME_RULES.md)
- [State and Persistence](docs/STATE_AND_PERSISTENCE.md)
- [Contributing](CONTRIBUTING.md)

## License

This repository currently does not declare an open-source license. All rights remain with the repository owner unless a license is added later.

---

Built as a browser-first implementation of Pişti with a focus on clean game-state modeling, responsive interaction, and zero-backend deployment.
