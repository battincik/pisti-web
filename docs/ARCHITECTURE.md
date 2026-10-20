# Architecture

This document describes the internal structure of **Pişti Web**, the boundaries between the game engine and the UI, and the reasoning behind the current implementation.

## Architectural goals

The project is intentionally small, but the code is structured around a few principles that make it easy to extend:

1. Keep card rules independent from React.
2. Keep browser persistence behind a small abstraction.
3. Keep the active game state explicit and serializable.
4. Avoid backend infrastructure unless a feature actually requires it.
5. Prefer native browser capabilities over unnecessary dependencies.

## High-level structure

```text
Browser
  │
  ├── React UI
  │     ├── menu
  │     ├── game table
  │     ├── statistics
  │     └── settings / rules dialogs
  │
  ├── Game controller
  │     ├── turn orchestration
  │     ├── dealing
  │     ├── round completion
  │     └── match-mode progression
  │
  ├── Game domain
  │     ├── deck generation
  │     ├── shuffle
  │     ├── capture rules
  │     ├── card points
  │     └── bot card selection
  │
  └── Browser persistence
        ├── preferences
        ├── statistics
        └── recent history
```

## Source boundaries

### `lib/game.ts`

This file contains the domain primitives used by the game.

It does not import React and does not know anything about the visual interface.

Responsibilities include:

- card, rank, and suit types
- creating a standard 52-card deck
- shuffling
- determining whether a played card captures the table
- evaluating card-specific points
- calculating base points from captured cards
- selecting a card for the local bot
- translating game-mode identifiers into display names

This separation makes the rule layer easier to test later.

### `lib/storage.ts`

This file provides a minimal persistence layer around `localStorage`.

The UI does not need to repeat JSON parsing, error handling, or storage-key definitions.

The storage layer also uses versioned keys so future data migrations can be introduced without silently breaking older data.

### `components/CardView.tsx`

`CardView` is a presentation component responsible for rendering:

- card faces
- suits
- ranks
- card backs
- compact cards
- clickable/playable cards

It does not contain capture logic or scoring logic.

### `components/PistiGame.tsx`

`PistiGame` is the application controller.

It connects the domain layer to the UI and owns the active runtime state.

Responsibilities include:

- screen navigation
- current deck and hands
- current table pile
- whose turn it is
- invoking the bot
- handling round transitions
- accumulating 51/101 match scores
- handling countdown mode
- persisting completed-game statistics
- triggering sound and UI feedback

## Game-state transition

Each played card is processed using the same transition sequence.

```text
Current GameState
      │
      ▼
Validate player + card
      │
      ▼
Inspect table top card
      │
      ├── same rank ──┐
      │               │
      ├── Jack ───────┤ capture
      │               │
      └── otherwise ──┘ append
      │
      ▼
Detect Pişti condition
      │
      ▼
Update captured pile / table
      │
      ▼
Switch turn
      │
      ▼
Deal if both hands are empty
      │
      ▼
Finish round if deck is exhausted
```

The transition is kept deterministic except for deck shuffling and the small random weighting used by the bot when choosing between similar discard candidates.

## Round lifecycle

A round starts with a shuffled 52-card deck.

Initial distribution:

```text
4 cards -> table
4 cards -> human
4 cards -> bot
```

This leaves 40 cards in the deck.

When both hands become empty, the game deals another four cards to each player. No additional cards are added to the table during these later deals.

After all remaining cards have been distributed and both hands are empty, the round finishes.

If cards are still present on the table, they are transferred to `lastCapture`, which stores the player who most recently captured a pile.

## Match modes

The same round engine is reused across every mode.

The modes only change how round scores are accumulated.

### Single

```text
round score -> final result
```

### Target 51 / Target 101

```text
round score
   +
previous match score
   ↓
new cumulative score
```

A new round is created until either player reaches the configured target.

### Countdown 101

```text
remaining score - round score = new remaining score
```

Values are clamped at zero.

## Bot architecture

The bot is intentionally heuristic-based rather than search-based.

A full minimax/card-counting agent would add complexity that is unnecessary for the initial version.

Current decision priorities:

1. Find cards that can capture the current table.
2. Prefer a matching-rank capture over a Jack capture.
3. If no capture is available, evaluate discard risk.
4. Assign large discard cost to Jacks.
5. Assign additional cost to point-bearing cards.
6. Use a small random value to avoid perfectly repetitive choices.

This strategy provides instant local decisions with no API requests.

## Why no global state library?

The entire application is centered around one active game controller.

Introducing Redux, Zustand, MobX, or another global state dependency would currently add more indirection than value.

React state is sufficient because:

- there is a single game surface
- state ownership is clear
- there are no deeply distributed write operations
- persistence needs are small

If the project later gains multiplayer lobbies, accounts, inventories, achievements, or multiple simultaneous game sessions, extracting state into a dedicated store could become useful.

## Why no backend?

The current feature set has no authoritative-server requirement.

All rules can be computed locally, and all persistent information belongs to the local player.

Avoiding a backend provides:

- zero database cost
- zero authentication complexity
- zero API latency
- simpler deployment
- privacy by default
- offline-friendly foundations

A backend would become appropriate for features such as multiplayer, cross-device synchronization, public rankings, user accounts, or anti-cheat enforcement.

## Future extraction opportunities

As the project grows, the next useful architectural changes would be:

### Pure round reducer

Move the complete turn transition into a reducer-style pure function.

```ts
nextState = reduceGame(state, action);
```

This would simplify replay and automated testing.

### Bot strategy interface

```ts
interface BotStrategy {
  chooseCard(hand: Card[], table: Card[]): Card;
}
```

Different implementations could represent Easy, Normal, and Hard difficulty levels.

### Event log

Each move could emit a structured domain event:

```ts
{
  type: "CARD_PLAYED",
  player: "human",
  card: "clubs-7"
}
```

An event log would enable replays, debugging, deterministic tests, and multiplayer synchronization.

## Summary

The project follows a deliberately lightweight architecture:

- React orchestrates the experience.
- TypeScript models the game domain.
- Pure helpers contain the fundamental rules.
- CSS handles visual motion.
- Browser APIs provide persistence and audio.
- Vercel provides deployment without backend infrastructure.

The result is small enough to understand quickly while preserving clear extension points for future features.
