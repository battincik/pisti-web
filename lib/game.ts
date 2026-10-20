export type Suit = "clubs" | "diamonds" | "hearts" | "spades";
export type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";
export type Card = { id: string; suit: Suit; rank: Rank };
export type GameMode = "single" | "target51" | "target101" | "countdown101";
export type Player = "human" | "bot";

export const suits: Suit[] = ["clubs", "diamonds", "hearts", "spades"];
export const ranks: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

export const suitSymbol: Record<Suit, string> = {
  clubs: "♣",
  diamonds: "♦",
  hearts: "♥",
  spades: "♠",
};

export const suitName: Record<Suit, string> = {
  clubs: "Sinek",
  diamonds: "Karo",
  hearts: "Kupa",
  spades: "Maça",
};

export function createDeck(): Card[] {
  return suits.flatMap((suit) => ranks.map((rank) => ({ id: `${suit}-${rank}`, suit, rank })));
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function canCapture(card: Card, top?: Card): boolean {
  return Boolean(top && (card.rank === "J" || card.rank === top.rank));
}

export function cardPoints(card: Card): number {
  if (card.rank === "A" || card.rank === "J") return 1;
  if (card.rank === "2" && card.suit === "clubs") return 2;
  if (card.rank === "10" && card.suit === "diamonds") return 3;
  return 0;
}

export function capturedBasePoints(cards: Card[]): number {
  return cards.reduce((total, card) => total + cardPoints(card), 0);
}

export function botChooseCard(hand: Card[], table: Card[]): Card {
  const top = table.at(-1);
  if (!top) return [...hand].sort((a, b) => discardRisk(a) - discardRisk(b))[0];

  const captures = hand.filter((card) => canCapture(card, top));
  if (captures.length) {
    const matching = captures.filter((card) => card.rank !== "J");
    if (matching.length) return matching.sort((a, b) => discardRisk(a) - discardRisk(b))[0];
    return captures[0];
  }

  return [...hand].sort((a, b) => discardRisk(a) - discardRisk(b))[0];
}

function discardRisk(card: Card): number {
  let risk = cardPoints(card) * 6;
  if (card.rank === "J") risk += 40;
  if (["A", "K", "Q"].includes(card.rank)) risk += 2;
  return risk + Math.random() * 2;
}

export function getModeLabel(mode: GameMode): string {
  return {
    single: "Tek Oyun",
    target51: "51 Puan",
    target101: "101 Puan",
    countdown101: "101'den Düşme",
  }[mode];
}
