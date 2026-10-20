# Game Rules

This document describes the rule set implemented by **Pişti Web**.

Pişti has regional and household variations. This project uses a consistent rule set intended for a fast two-player browser game.

## Deck

The game uses one standard **52-card deck** with no Jokers.

Suits:

- Clubs
- Diamonds
- Hearts
- Spades

Ranks:

```text
A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K
```

## Players

The current version is a two-player game:

- Human player
- Local computer opponent

Players alternate one card at a time.

## Initial deal

At the beginning of each round:

1. The deck is shuffled.
2. Four cards are placed on the table.
3. Four cards are dealt to the human player.
4. Four cards are dealt to the bot.

After both players have used their four cards, another four cards are dealt to each player.

This repeats until the deck is empty.

## Capturing the table

The current top card of the table determines whether the newly played card captures the pile.

A capture occurs when:

- the played card has the same rank as the top card, or
- the played card is a Jack.

Example:

```text
Table top: 7♥
Played:    7♣
Result:    capture
```

A Jack can capture regardless of the top card's rank.

```text
Table top: Q♦
Played:    J♠
Result:    capture
```

When a capture occurs, the complete table pile plus the newly played card is moved to that player's captured-card collection.

If the played card does not capture, it is appended to the table and becomes the new top card.

## Pişti

A Pişti occurs when the table contains exactly **one card** and the next player captures it with a card of the same rank.

Example:

```text
Table:  [9♦]
Played: 9♠
```

This awards **10 points** in addition to the normal value of captured scoring cards.

## Jack Pişti

The implementation also recognizes a Jack played onto a single Jack as a special Pişti.

```text
Table:  [J♦]
Played: J♣
```

This awards **20 points**.

A Jack used to collect a single non-Jack card is treated as a normal capture, not a standard Pişti in this implementation.

## Card points

Most cards are worth zero direct points. The following cards contribute to the round score:

| Card | Points |
| --- | ---: |
| Every Ace | 1 |
| Every Jack | 1 |
| Two of Clubs | 2 |
| Ten of Diamonds | 3 |

## Most cards bonus

At the end of a round, the player with more captured cards receives **3 additional points**.

If both players captured the same number of cards, neither player receives this bonus.

## End-of-round table cards

When the deck and both hands are empty, cards may still remain on the table.

Those cards are awarded to the player who made the **most recent successful capture**.

The game stores this player as `lastCapture` during the round.

## Round score

A player's round score is calculated as:

```text
points from scoring cards
+ normal Pişti count × 10
+ Jack Pişti count × 20
+ most-cards bonus
```

The calculation is performed independently for both players.

## Match formats

### Single Game

One full round is played. The higher round score wins.

### 51 Points

Round scores are added to a cumulative match score.

The first player whose cumulative score reaches or exceeds **51** wins.

### 101 Points

The same system is used with a target of **101**.

### Countdown from 101

Each player begins at 101.

After each round:

```text
new remaining score = previous remaining score - earned round score
```

The remaining score cannot drop below zero.

The first player to reach zero wins.

## Bot knowledge

The bot does not inspect hidden future deck order and does not know the human player's hand.

Its decision is based only on:

- its own hand
- the current table
- static card-risk heuristics

This keeps the opponent within the same visible-information model expected from normal play.

## Rule variations

Because Pişti rules can vary, future versions may expose selectable rulesets for details such as:

- Jack Pişti handling
- opening-table behavior
- most-cards bonus value
- match target presets
- alternative special-card values

The current implementation deliberately uses one fixed rule set so scoring remains predictable across games.
