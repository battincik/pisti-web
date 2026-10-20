import type { Card } from "@/lib/game";
import { suitName, suitSymbol } from "@/lib/game";

export default function CardView({ card, hidden = false, playable = false, selected = false, onClick, compact = false }: {
  card?: Card;
  hidden?: boolean;
  playable?: boolean;
  selected?: boolean;
  onClick?: () => void;
  compact?: boolean;
}) {
  if (hidden || !card) {
    return <div className={`playing-card card-back ${compact ? "compact" : ""}`} aria-label="Kapalı kart"><div className="back-pattern" /></div>;
  }

  const red = card.suit === "diamonds" || card.suit === "hearts";
  const content = (
    <div className={`playing-card card-face ${red ? "red" : "black"} ${playable ? "playable" : ""} ${selected ? "selected" : ""} ${compact ? "compact" : ""}`}>
      <div className="card-corner top"><b>{card.rank}</b><span>{suitSymbol[card.suit]}</span></div>
      <div className="card-center">{suitSymbol[card.suit]}</div>
      <div className="card-corner bottom"><b>{card.rank}</b><span>{suitSymbol[card.suit]}</span></div>
    </div>
  );

  if (!onClick) return content;
  return <button className="card-button" type="button" onClick={onClick} aria-label={`${suitName[card.suit]} ${card.rank} oyna`}>{content}</button>;
}
