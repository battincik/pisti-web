"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CardView from "./CardView";
import {
  botChooseCard,
  canCapture,
  capturedBasePoints,
  createDeck,
  getModeLabel,
  shuffle,
  type Card,
  type GameMode,
  type Player,
} from "@/lib/game";
import {
  clearAllLocal,
  defaultPreferences,
  defaultStats,
  loadLocal,
  saveLocal,
  type HistoryItem,
  type Preferences,
  type Stats,
} from "@/lib/storage";

type RoundScore = { captured: Card[]; pistis: number; jackPistis: number };
type GameState = {
  deck: Card[];
  humanHand: Card[];
  botHand: Card[];
  table: Card[];
  human: RoundScore;
  bot: RoundScore;
  turn: Player;
  lastCapture: Player | null;
  deal: number;
  status: "playing" | "round-end";
};

const emptyScore = (): RoundScore => ({ captured: [], pistis: 0, jackPistis: 0 });

function createInitialState(): GameState {
  const deck = shuffle(createDeck());
  const table = deck.splice(0, 4);
  const humanHand = deck.splice(0, 4);
  const botHand = deck.splice(0, 4);

  return {
    deck,
    table,
    humanHand,
    botHand,
    human: emptyScore(),
    bot: emptyScore(),
    turn: "human",
    lastCapture: null,
    deal: 1,
    status: "playing",
  };
}

function scoreRound(state: GameState) {
  const humanMostCards = state.human.captured.length > state.bot.captured.length ? 3 : 0;
  const botMostCards = state.bot.captured.length > state.human.captured.length ? 3 : 0;

  return {
    human:
      capturedBasePoints(state.human.captured) +
      state.human.pistis * 10 +
      state.human.jackPistis * 20 +
      humanMostCards,
    bot:
      capturedBasePoints(state.bot.captured) +
      state.bot.pistis * 10 +
      state.bot.jackPistis * 20 +
      botMostCards,
  };
}

function playCard(prev: GameState, player: Player, card: Card) {
  const handKey = player === "human" ? "humanHand" : "botHand";
  const hand = prev[handKey];

  if (
    prev.status !== "playing" ||
    prev.turn !== player ||
    !hand.some((item) => item.id === card.id)
  ) {
    return { state: prev, captured: false, pisti: false, jackPisti: false };
  }

  const top = prev.table.at(-1);
  const captured = canCapture(card, top);
  const pisti = Boolean(captured && prev.table.length === 1 && card.rank !== "J");
  const jackPisti = Boolean(
    captured && prev.table.length === 1 && card.rank === "J" && top?.rank === "J",
  );

  const next = {
    ...prev,
    [handKey]: hand.filter((item) => item.id !== card.id),
  } as GameState;

  if (captured) {
    const pile = [...prev.table, card];
    next.table = [];
    next[player] = {
      captured: [...prev[player].captured, ...pile],
      pistis: prev[player].pistis + (pisti ? 1 : 0),
      jackPistis: prev[player].jackPistis + (jackPisti ? 1 : 0),
    };
    next.lastCapture = player;
  } else {
    next.table = [...prev.table, card];
  }

  next.turn = player === "human" ? "bot" : "human";
  return { state: next, captured, pisti, jackPisti };
}

function continueOrFinishRound(state: GameState): GameState {
  if (state.humanHand.length || state.botHand.length) return state;

  if (state.deck.length > 0) {
    const deck = [...state.deck];
    return {
      ...state,
      deck,
      humanHand: deck.splice(0, 4),
      botHand: deck.splice(0, 4),
      deal: state.deal + 1,
    };
  }

  let finished = state;
  if (state.table.length && state.lastCapture) {
    const owner = state.lastCapture;
    finished = {
      ...state,
      table: [],
      [owner]: {
        ...state[owner],
        captured: [...state[owner].captured, ...state.table],
      },
    } as GameState;
  }

  return { ...finished, status: "round-end" };
}

function playSound(kind: "play" | "capture" | "pisti") {
  try {
    const AudioContextCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const context = new AudioContextCtor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = kind === "pisti" ? 720 : kind === "capture" ? 420 : 250;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.16);

    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.18);
  } catch {
    // Audio is optional. The game remains fully playable without it.
  }
}

export default function PistiGame() {
  const [screen, setScreen] = useState<"menu" | "game" | "stats">("menu");
  const [state, setState] = useState<GameState | null>(null);
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [stats, setStats] = useState<Stats>(defaultStats);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [seriesScore, setSeriesScore] = useState({ human: 0, bot: 0 });
  const [countdownScore, setCountdownScore] = useState({ human: 101, bot: 101 });
  const [showRules, setShowRules] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const botTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roundRecorded = useRef(false);

  useEffect(() => {
    setPreferences(loadLocal("preferences", defaultPreferences));
    setStats(loadLocal("stats", defaultStats));
    setHistory(loadLocal<HistoryItem[]>("history", []));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveLocal("preferences", preferences);
  }, [hydrated, preferences]);

  useEffect(() => {
    if (hydrated) saveLocal("stats", stats);
  }, [hydrated, stats]);

  useEffect(() => {
    if (hydrated) saveLocal("history", history);
  }, [hydrated, history]);

  const mode = preferences.mode;
  const roundScore = useMemo(
    () => (state ? scoreRound(state) : { human: 0, bot: 0 }),
    [state],
  );

  const startGame = useCallback((selectedMode: GameMode = mode, resetSeries = true) => {
    setPreferences((current) => ({ ...current, mode: selectedMode }));
    setState(createInitialState());
    setScreen("game");
    setToast("Kartlar dağıtıldı");
    roundRecorded.current = false;

    if (resetSeries) {
      setSeriesScore({ human: 0, bot: 0 });
      setCountdownScore({ human: 101, bot: 101 });
    }
  }, [mode]);

  const makeMove = useCallback((player: Player, card: Card) => {
    setState((current) => {
      if (!current) return current;

      const result = playCard(current, player, card);
      if (result.state === current) return current;

      if (preferences.sound) {
        playSound(result.pisti || result.jackPisti ? "pisti" : result.captured ? "capture" : "play");
      }

      if (result.jackPisti) setToast(`${player === "human" ? "Sen" : "Bot"}: Vale Pişti! +20`);
      else if (result.pisti) setToast(`${player === "human" ? "Sen" : "Bot"}: Pişti! +10`);
      else if (result.captured) setToast(`${player === "human" ? "Sen" : "Bot"} masayı aldı`);

      return continueOrFinishRound(result.state);
    });
  }, [preferences.sound]);

  useEffect(() => {
    if (!state || state.turn !== "bot" || state.status !== "playing") return;

    if (botTimer.current) clearTimeout(botTimer.current);
    botTimer.current = setTimeout(() => {
      setState((current) => {
        if (!current || current.turn !== "bot" || current.status !== "playing") return current;
        if (!current.botHand.length) return current;

        const card = botChooseCard(current.botHand, current.table);
        const result = playCard(current, "bot", card);

        if (preferences.sound) {
          playSound(result.pisti || result.jackPisti ? "pisti" : result.captured ? "capture" : "play");
        }

        if (result.jackPisti) setToast("Bot: Vale Pişti! +20");
        else if (result.pisti) setToast("Bot: Pişti! +10");
        else if (result.captured) setToast("Bot masayı aldı");

        return continueOrFinishRound(result.state);
      });
    }, preferences.reducedMotion ? 220 : 700);

    return () => {
      if (botTimer.current) clearTimeout(botTimer.current);
    };
  }, [state?.turn, state?.status, state?.botHand.length, preferences.reducedMotion, preferences.sound]);

  useEffect(() => {
    if (!state || state.status !== "round-end" || roundRecorded.current) return;
    roundRecorded.current = true;

    const score = scoreRound(state);
    const result: HistoryItem["result"] =
      score.human > score.bot ? "win" : score.human < score.bot ? "loss" : "draw";

    setStats((current) => ({
      games: current.games + 1,
      wins: current.wins + (result === "win" ? 1 : 0),
      losses: current.losses + (result === "loss" ? 1 : 0),
      draws: current.draws + (result === "draw" ? 1 : 0),
      pistis: current.pistis + state.human.pistis + state.human.jackPistis,
      bestScore: Math.max(current.bestScore, score.human),
      totalCaptured: current.totalCaptured + state.human.captured.length,
    }));

    setHistory((current) => [
      {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        mode,
        human: score.human,
        bot: score.bot,
        result,
      },
      ...current,
    ].slice(0, 20));

    if (mode === "countdown101") {
      setCountdownScore((current) => ({
        human: Math.max(0, current.human - score.human),
        bot: Math.max(0, current.bot - score.bot),
      }));
    } else if (mode === "target51" || mode === "target101") {
      setSeriesScore((current) => ({
        human: current.human + score.human,
        bot: current.bot + score.bot,
      }));
    }
  }, [mode, state]);

  const matchFinished = useMemo(() => {
    if (!state || state.status !== "round-end") return false;
    if (mode === "single") return true;
    if (mode === "countdown101") return countdownScore.human === 0 || countdownScore.bot === 0;

    const target = mode === "target51" ? 51 : 101;
    return seriesScore.human >= target || seriesScore.bot >= target;
  }, [countdownScore, mode, seriesScore, state]);

  const nextRound = () => {
    roundRecorded.current = false;
    setState(createInitialState());
    setToast("Yeni el başladı");
  };

  const resetLocalData = () => {
    clearAllLocal();
    setStats(defaultStats);
    setHistory([]);
    setPreferences(defaultPreferences);
    setShowSettings(false);
    setToast("Yerel veriler temizlendi");
  };

  if (!hydrated) {
    return <main className="loading-screen"><div className="loading-suits">♠ ♥ ♣ ♦</div></main>;
  }

  if (screen === "menu") {
    const winRate = stats.games ? Math.round((stats.wins / stats.games) * 100) : 0;

    return (
      <main className="menu-page">
        <header className="topbar">
          <Brand />
          <div className="top-actions">
            <button onClick={() => setScreen("stats")}>İstatistikler</button>
            <button onClick={() => setShowSettings(true)}>Ayarlar</button>
          </div>
        </header>

        <section className="hero-menu">
          <div className="hero-copy">
            <span className="eyebrow">TEK KİŞİLİK · ÇEVRİMDIŞI</span>
            <h1>Masayı oku.<br /><em>Kartı bırak.</em><br />Piştiyi kap.</h1>
            <p>Modern ve hızlı bir tarayıcı Pişti deneyimi. Hesap, API veya uzak veritabanı yok; istatistikler yalnızca bu cihazda saklanır.</p>
            <div className="quick-stats">
              <div><b>{stats.games}</b><span>oyun</span></div>
              <div><b>%{winRate}</b><span>galibiyet</span></div>
              <div><b>{stats.pistis}</b><span>pişti</span></div>
            </div>
          </div>

          <div className="mode-panel">
            <div className="panel-title"><span>Oyun modu</span><button onClick={() => setShowRules(true)}>Kurallar</button></div>
            <div className="mode-grid">
              {([
                ["single", "Tek Oyun", "Bir deste, tek sonuç", "01"],
                ["target51", "51 Puan", "51'e ilk ulaşan", "51"],
                ["target101", "101 Puan", "Uzun seri oyunu", "101"],
                ["countdown101", "Sayıdan Düşme", "101'den sıfıra in", "↓"],
              ] as const).map(([value, title, subtitle, badge]) => (
                <button
                  key={value}
                  className={`mode-card ${preferences.mode === value ? "active" : ""}`}
                  onClick={() => setPreferences((current) => ({ ...current, mode: value }))}
                >
                  <span>{badge}</span><strong>{title}</strong><small>{subtitle}</small>
                </button>
              ))}
            </div>
            <button className="primary-button" onClick={() => startGame(preferences.mode, true)}>Oyunu başlat <b>→</b></button>
            <p className="local-note">● Veriler localStorage üzerinde saklanır</p>
          </div>
        </section>

        <RulesModal open={showRules} onClose={() => setShowRules(false)} />
        <SettingsModal
          open={showSettings}
          preferences={preferences}
          setPreferences={setPreferences}
          onClose={() => setShowSettings(false)}
          onReset={resetLocalData}
        />
      </main>
    );
  }

  if (screen === "stats") {
    return (
      <main className="stats-page">
        <header className="topbar">
          <button className="back-button" onClick={() => setScreen("menu")}>← Menü</button>
          <Brand compact />
          <span />
        </header>

        <section className="stats-wrap">
          <div className="stats-grid">
            <Stat label="Toplam oyun" value={stats.games} />
            <Stat label="Galibiyet" value={stats.wins} />
            <Stat label="Pişti" value={stats.pistis} />
            <Stat label="En iyi skor" value={stats.bestScore} />
          </div>

          <div className="history-card">
            <div className="history-head"><div><small>SON OYUNLAR</small><h2>Oyun geçmişi</h2></div><span>Son 20 oyun</span></div>
            {history.length === 0 ? (
              <div className="empty-state">Henüz tamamlanmış oyun yok.</div>
            ) : (
              <div className="history-list">
                {history.map((item) => (
                  <div className="history-row" key={item.id}>
                    <span className={`result-dot ${item.result}`} />
                    <div><b>{getModeLabel(item.mode)}</b><small>{new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.at))}</small></div>
                    <div className="history-score"><b>{item.human} — {item.bot}</b><small>{item.result === "win" ? "Kazandın" : item.result === "loss" ? "Kaybettin" : "Berabere"}</small></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    );
  }

  if (!state) return null;

  const headerScore = mode === "countdown101"
    ? `${countdownScore.human} ↓ ${countdownScore.bot}`
    : mode === "single"
      ? `${roundScore.human} : ${roundScore.bot}`
      : `${seriesScore.human} : ${seriesScore.bot}`;

  return (
    <main className={`game-page ${preferences.reducedMotion ? "reduce-motion" : ""}`}>
      <header className="game-header">
        <button className="icon-button" onClick={() => setScreen("menu")} aria-label="Menüye dön">←</button>
        <div className="round-info"><strong>{getModeLabel(mode)}</strong><span>Dağıtım {state.deal}/6 · Destede {state.deck.length}</span></div>
        <div className="header-score">{headerScore}</div>
        <button className="icon-button" onClick={() => setShowSettings(true)} aria-label="Ayarlar">⚙</button>
      </header>

      <section className="table-area">
        <div className={`player-zone bot-zone ${state.turn === "bot" ? "active-turn" : ""}`}>
          <PlayerLabel name="Bot" subtitle={state.turn === "bot" ? "Düşünüyor…" : `${state.bot.captured.length} kart topladı`} bot />
          <div className="bot-hand">
            {state.botHand.map((card, index) => (
              <div className="bot-card" key={card.id} style={{ "--i": index } as React.CSSProperties}>
                <CardView hidden compact />
              </div>
            ))}
          </div>
        </div>

        <div className="felt-center">
          <CapturePile label="Sen" count={state.human.captured.length} />
          <div className="table-stack" aria-live="polite">
            {state.table.length === 0 ? (
              <div className="empty-table"><span>♣</span><small>Masa boş</small></div>
            ) : (
              state.table.slice(-4).map((card, index) => (
                <div className="stack-card" key={`${card.id}-${state.table.length}-${index}`} style={{ "--stack": index } as React.CSSProperties}>
                  <CardView card={card} />
                </div>
              ))
            )}
            {state.table.length > 4 && <span className="pile-count">+{state.table.length - 4}</span>}
          </div>
          <CapturePile label="Bot" count={state.bot.captured.length} />
        </div>

        <div className={`player-zone human-zone ${state.turn === "human" ? "active-turn" : ""}`}>
          <div className="turn-message">● {state.turn === "human" ? "Sıra sende" : "Bot oynuyor"}</div>
          <div className="human-hand">
            {state.humanHand.map((card, index) => (
              <div className="hand-slot" key={card.id} style={{ "--i": index } as React.CSSProperties}>
                <CardView card={card} playable={state.turn === "human"} onClick={() => makeMove("human", card)} />
              </div>
            ))}
          </div>
          <PlayerLabel name="Sen" subtitle={`${state.human.pistis + state.human.jackPistis} pişti · ${state.human.captured.length} kart`} />
        </div>
      </section>

      {toast && state.status !== "round-end" && <div className="game-toast" key={toast}>{toast}</div>}

      {state.status === "round-end" && (
        <div className="result-overlay">
          <div className="result-modal">
            <small>EL TAMAMLANDI</small>
            <h2>{roundScore.human > roundScore.bot ? "Bu eli kazandın" : roundScore.human < roundScore.bot ? "Bu eli bot kazandı" : "El berabere"}</h2>
            <div className="big-score"><b>{roundScore.human}</b><span>—</span><b>{roundScore.bot}</b></div>
            <div className="score-details"><span>Pişti <b>{state.human.pistis + state.human.jackPistis} / {state.bot.pistis + state.bot.jackPistis}</b></span><span>Toplanan <b>{state.human.captured.length} / {state.bot.captured.length}</b></span></div>
            {mode === "countdown101" && <p>Kalan sayı: <b>{countdownScore.human} — {countdownScore.bot}</b></p>}
            {(mode === "target51" || mode === "target101") && <p>Seri toplamı: <b>{seriesScore.human} — {seriesScore.bot}</b></p>}
            <div className="result-actions">
              <button className="primary-button" onClick={() => matchFinished ? startGame(mode, true) : nextRound()}>{matchFinished ? "Yeniden oyna" : "Sonraki el"}</button>
              <button className="secondary-button" onClick={() => setScreen("menu")}>Menü</button>
            </div>
          </div>
        </div>
      )}

      <SettingsModal
        open={showSettings}
        preferences={preferences}
        setPreferences={setPreferences}
        onClose={() => setShowSettings(false)}
        onReset={resetLocalData}
      />
    </main>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return <div className="brand"><div className="brand-mark">P</div><div><strong>PIŞTI</strong>{!compact && <span>browser card game</span>}</div></div>;
}

function PlayerLabel({ name, subtitle, bot = false }: { name: string; subtitle: string; bot?: boolean }) {
  return <div className="player-label"><div className={`avatar ${bot ? "bot-avatar" : ""}`}>{name[0]}</div><div><strong>{name}</strong><span>{subtitle}</span></div></div>;
}

function CapturePile({ label, count }: { label: string; count: number }) {
  return <div className="capture-pile"><CardView hidden compact /><span>{label}</span><b>{count}</b></div>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="stat-card"><span>{label}</span><b>{value}</b></div>;
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return <div className="modal-backdrop" onMouseDown={(event) => event.currentTarget === event.target && onClose()}><div className="modal"><div className="modal-head"><h2>{title}</h2><button className="icon-button" onClick={onClose}>×</button></div>{children}</div></div>;
}

function RulesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <Modal open={open} onClose={onClose} title="Pişti Kuralları"><div className="rules"><p>Aynı değerli kartı veya Vale (J) atarak masadaki kartları toplarsın. Masada yalnızca bir kart varken aynı değeri atarsan Pişti olur.</p><div className="rule-list"><span><b>+10</b> Normal Pişti</span><span><b>+20</b> Vale üstüne Vale Pişti</span><span><b>+3</b> En çok kart</span><span><b>+3</b> Karo 10</span><span><b>+2</b> Sinek 2</span><span><b>+1</b> Her As ve Vale</span></div><p className="muted">Deste bittiğinde masada kalan kartlar, masayı en son toplamış oyuncuya gider.</p></div></Modal>;
}

function SettingsModal({ open, preferences, setPreferences, onClose, onReset }: {
  open: boolean;
  preferences: Preferences;
  setPreferences: React.Dispatch<React.SetStateAction<Preferences>>;
  onClose: () => void;
  onReset: () => void;
}) {
  return <Modal open={open} onClose={onClose} title="Ayarlar"><div className="settings-list"><label><div><b>Ses efektleri</b><small>Kart ve Pişti sesleri</small></div><input type="checkbox" checked={preferences.sound} onChange={(event) => setPreferences((current) => ({ ...current, sound: event.target.checked }))} /></label><label><div><b>Animasyonları azalt</b><small>Daha hızlı geçişler</small></div><input type="checkbox" checked={preferences.reducedMotion} onChange={(event) => setPreferences((current) => ({ ...current, reducedMotion: event.target.checked }))} /></label><button className="danger-button" onClick={onReset}>Tüm yerel verileri temizle</button></div></Modal>;
}
