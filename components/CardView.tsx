import type { Card } from "@/lib/game";
import { suitName, suitSymbol } from "@/lib/game";

function CourtCard({ card }: { card: Card }) {
  const red = card.suit === "diamonds" || card.suit === "hearts";
  const symbol = suitSymbol[card.suit];
  const accent = red ? "#c92d3d" : "#17273a";
  const accent2 = red ? "#1f4d8f" : "#b12734";
  const gold = "#d5ab42";
  const skin = "#e5b58c";
  const ink = "#17191d";

  const isKing = card.rank === "K";
  const isQueen = card.rank === "Q";

  const Half = ({ flipped = false }: { flipped?: boolean }) => (
    <g transform={flipped ? "translate(100 140) rotate(180)" : undefined}>
      <path d="M21 64 L35 44 L65 44 L79 64 L69 70 L31 70 Z" fill={accent} stroke={ink} strokeWidth="2" />
      <path d="M30 61 L40 50 L50 61 L60 50 L70 61 L66 70 L34 70 Z" fill={accent2} opacity=".95" />
      <path d="M39 45 C39 34 43 27 50 27 C57 27 61 34 61 45 Z" fill="#4b3326" stroke={ink} strokeWidth="1.6" />
      <ellipse cx="50" cy="40" rx="12" ry="14" fill={skin} stroke={ink} strokeWidth="1.5" />
      <path d="M44 39 l3 -1 M53 38 l3 1" stroke={ink} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M49 41 l-1 5 l4 0" stroke="#8f6149" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M45 50 C48 52 52 52 55 50" stroke="#8e4c52" strokeWidth="1.3" fill="none" strokeLinecap="round" />

      {isKing && (
        <g>
          <path d="M37 28 L40 15 L46 23 L50 11 L55 23 L61 15 L64 28 Z" fill={gold} stroke={ink} strokeWidth="1.7" strokeLinejoin="round" />
          <circle cx="40" cy="16" r="2" fill={accent2} />
          <circle cx="50" cy="12" r="2" fill={accent} />
          <circle cx="61" cy="16" r="2" fill={accent2} />
          <path d="M19 27 L25 24 L31 59" stroke={gold} strokeWidth="4" strokeLinecap="round" />
          <path d="M16 25 L25 18 L31 25 L25 31 Z" fill={gold} stroke={ink} strokeWidth="1.5" />
        </g>
      )}

      {isQueen && (
        <g>
          <path d="M38 29 L40 18 L46 24 L50 14 L55 24 L61 18 L63 29 Z" fill={gold} stroke={ink} strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M22 25 C17 21 18 15 23 14 C28 15 29 21 25 25 C30 24 33 29 30 33 C26 36 22 33 22 29 C20 33 15 34 12 30 C10 26 14 22 18 24" fill="#d8c25e" stroke={ink} strokeWidth="1.3" />
          <path d="M22 31 L29 59" stroke="#6b7f37" strokeWidth="2.3" strokeLinecap="round" />
        </g>
      )}

      {!isKing && !isQueen && (
        <g>
          <path d="M36 29 Q50 14 64 29 L61 34 Q50 27 39 34 Z" fill={accent2} stroke={ink} strokeWidth="1.5" />
          <circle cx="42" cy="24" r="2.3" fill={gold} />
          <circle cx="50" cy="20" r="2.3" fill={gold} />
          <circle cx="58" cy="24" r="2.3" fill={gold} />
          <path d="M20 23 L29 19 L30 59" stroke={gold} strokeWidth="3.5" strokeLinecap="round" />
        </g>
      )}

      <path d="M31 69 L19 92 L42 104 L50 88 L58 104 L81 92 L69 69 Z" fill={accent} stroke={ink} strokeWidth="2" />
      <path d="M39 70 L50 82 L61 70" fill={gold} stroke={ink} strokeWidth="1.4" />
      <path d="M31 76 L43 84 L36 96" fill={accent2} opacity=".95" />
      <path d="M69 76 L57 84 L64 96" fill={accent2} opacity=".95" />
      <circle cx="50" cy="91" r="9" fill="#f6ead7" stroke={ink} strokeWidth="1.5" />
      <text x="50" y="96" textAnchor="middle" fontFamily="Georgia, serif" fontSize="17" fontWeight="700" fill={accent}>{symbol}</text>
      <path d="M18 93 L30 104 L25 111 L13 101 Z" fill={gold} stroke={ink} strokeWidth="1.5" />
      <path d="M82 93 L70 104 L75 111 L87 101 Z" fill={gold} stroke={ink} strokeWidth="1.5" />
    </g>
  );

  return (
    <svg className="court-svg" viewBox="0 0 100 140" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="98" height="138" rx="5" fill="#f4eadb" stroke="rgba(20,20,20,.18)" />
      <path d="M8 70 H92" stroke={gold} strokeWidth="1" opacity=".7" />
      <Half />
      <Half flipped />
    </svg>
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
  const court = card.rank === "J" || card.rank === "Q" || card.rank === "K";
  const content = (
    <div className={`playing-card card-face ${red ? "red" : "black"} ${court ? "face-card" : ""} ${playable ? "playable" : ""} ${selected ? "selected" : ""} ${compact ? "compact" : ""}`}>
      <div className="card-corner top"><b>{card.rank}</b><span>{suitSymbol[card.suit]}</span></div>
      <div className="card-center">{court ? <CourtCard card={card} /> : suitSymbol[card.suit]}</div>
      <div className="card-corner bottom"><b>{card.rank}</b><span>{suitSymbol[card.suit]}</span></div>
    </div>
  );

  if (!onClick) return content;
  return <button className="card-button" type="button" onClick={onClick} aria-label={`${suitName[card.suit]} ${card.rank} oyna`}>{content}</button>;
}
