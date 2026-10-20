# State and Persistence

Pişti Web is designed around a **local-first** state model.

The game has two different categories of data:

1. temporary runtime state used while a round is being played
2. persistent browser data that should survive page reloads

These categories are intentionally kept separate.

## Runtime game state

The active round is stored in React state.

Conceptually, it contains:

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

This state changes frequently and is only needed for the current session.

It is therefore kept in memory rather than written to `localStorage` after every move.

## Why active rounds are not persisted

Persisting every card movement would introduce additional complexity:

- partial-state migration requirements
- stale-session recovery
- validation of unfinished matches
- more frequent browser writes
- additional edge cases after code updates

For the current project, reopening the page starts from the menu and a new round can be created immediately.

Persistent storage is reserved for long-lived user data.

## Persistent data

Three categories are stored locally:

### Preferences

```ts
type Preferences = {
  sound: boolean;
  reducedMotion: boolean;
  mode: GameMode;
};
```

This allows the game to remember the player's selected mode and interface preferences.

### Statistics

```ts
type Stats = {
  games: number;
  wins: number;
  losses: number;
  draws: number;
  pistis: number;
  bestScore: number;
  totalCaptured: number;
};
```

Statistics are updated after a completed round.

### Match history

Each history entry contains:

```ts
type HistoryItem = {
  id: string;
  at: string;
  mode: GameMode;
  human: number;
  bot: number;
  result: "win" | "loss" | "draw";
};
```

Only the most recent **20** entries are retained.

This prevents unbounded local data growth while still giving the statistics screen useful historical context.

## Storage keys

The project uses explicit versioned keys:

```text
pisti.stats.v1
pisti.preferences.v1
pisti.history.v1
```

The `v1` suffix is intentional.

If a future release changes the shape of a stored value, the application can either:

- migrate the previous version, or
- introduce a new key such as `pisti.stats.v2`

without assuming incompatible JSON has the newest structure.

## Storage abstraction

All direct `localStorage` operations are centralized in `lib/storage.ts`.

The two primary helpers are:

```ts
loadLocal(key, fallback)
saveLocal(key, value)
```

`loadLocal` catches malformed or inaccessible storage and returns a safe fallback.

This matters because browser storage can fail for reasons such as:

- privacy restrictions
- manually modified data
- malformed JSON
- browser-specific storage behavior

The game should remain playable even if persistence fails.

## Server rendering and hydration

Next.js can render components in environments where `window` does not exist.

The storage functions therefore guard browser-only access:

```ts
if (typeof window === "undefined") return fallback;
```

The game loads persistent values after the component mounts in the browser and sets a hydration-ready flag before rendering data-dependent screens.

This prevents server/client output from relying on different storage values.

## Data ownership and privacy

No stored game data is transmitted to an external service by this application.

There is currently:

- no analytics integration
- no account service
- no remote database
- no persistence API
- no authentication token

The browser owns the data.

Clearing browser storage or using the in-game reset option removes the locally stored statistics, preferences, and history.

## Reset behavior

The settings screen exposes a complete local-data reset.

Internally, the storage layer removes every application-owned key:

```ts
Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
```

React state is then reset to the application's defaults.

## Future persistence options

The local-first model can remain the default even if cloud features are added later.

A future synchronization architecture could look like:

```text
React state
   │
   ├── localStorage cache
   │
   └── optional sync adapter
          │
          └── API / user account
```

This would allow anonymous users to continue using the application without an account while signed-in users could synchronize statistics between devices.

## Possible future migrations

Future stored models could include:

- achievements
- bot difficulty preference
- replay logs
- accessibility settings
- custom rulesets
- theme preferences

If full in-progress round recovery is added, it should use a separately versioned session object rather than mixing transient game state into aggregate statistics.

## Summary

The persistence strategy is intentionally conservative:

- frequently changing game state stays in memory
- useful long-term information is stored locally
- storage operations are isolated from UI code
- keys are versioned
- failures fall back safely
- no backend is required

This keeps the application simple today without blocking more advanced synchronization later.
