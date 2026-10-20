import type { Card } from "@/lib/game";
import { suitName, suitSymbol } from "@/lib/game";

function FaceCard({ card }: { card: Card }) {
  const suit = suitSymbol[card.suit];
  const red = card.suit === "diamonds" || card.suit === "hearts";
  const role = card.rank === "K" ? "KING" : card.rank === "Q" ? "QUEEN" : "JACK";

  return (
    <div className={`face-art ${red ? "red" : "black"}`} aria-hidden="true">
      <div className="face-half face-half-top">
        <span className="face-role">{role}</span>
        <span className="face-crown">{card.rank === "K" ? "♛" : card.rank === "Q" ? "♕" : "✦"}</span>
        <div className="face-portrait">
          <span className="face-hair" />
          <span className="face-head" />
          <span className="face-eye face-eye-left" />
          <span className="face-eye face-eye-right" />
          <span className="face-mouth" />
        </div>
        <div className="face-costume">
          <span className="face-shoulder face-shoulder-left" />
          <span className="face-shoulder face-shoulder-right" />
          <span className="face-suit">{suit}</span>
        </div>
      </div>
      <div className="face-half face-half-bottom">
        <span className="face-role">{role}</span>
        <span className="face-crown">{card.rank === "K" ? "♛" : card.rank === "Q" ? "♕" : "✦"}</span>
        <div className="face-portrait">
          <span className="face-hair" />
          <span className="face-head" />
          <span className="face-eye face-eye-left" />
          <span className="face-eye face-eye-right" />
          <span className="face-mouth" />
        </div>
        <div className="face-costume">
          <span className="face-shoulder face-shoulder-left" />
          <span className="face-shoulder face-shoulder-right" />
          <span className="face-suit">{suit}</span>
        </div>
      </div>
    </div>
  );
}

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
  const faceCard = card.rank === "J" || card.rank === "Q" || card.rank === "K";
  const content = (
    <div className={`playing-card card-face ${red ? "red" : "black"} ${faceCard ? "face-card" : ""} ${playable ? "playable" : ""} ${selected ? "selected" : ""} ${compact ? "compact" : ""}`}>
      <div className="card-corner top"><b>{card.rank}</b><span>{suitSymbol[card.suit]}</span></div>
      <div className="card-center">{faceCard ? <FaceCard card={card} /> : suitSymbol[card.suit]}</div>
      <div className="card-corner bottom"><b>{card.rank}</b><span>{suitSymbol[card.suit]}</span></div>
    </div>
  );

  if (!onClick) return content;
  return <button className="card-button" type="button" onClick={onClick} aria-label={`${suitName[card.suit]} ${card.rank} oyna`}>{content}</button>;
}
