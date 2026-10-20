"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import styles from "./GameEffects.module.css";

type Effect = {
  id: number;
  label: string;
  bonus: string;
  jack: boolean;
} | null;

export default function GameEffects() {
  const [effect, setEffect] = useState<Effect>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastToastRef = useRef<string>("");

  useEffect(() => {
    const triggerFromToast = () => {
      const toast = document.querySelector<HTMLElement>(".game-toast");
      const text = toast?.textContent?.trim() ?? "";

      if (!text) {
        lastToastRef.current = "";
        return;
      }

      if (text === lastToastRef.current) return;
      lastToastRef.current = text;

      if (!text.includes("Pişti")) return;

      const jack = text.includes("Vale Pişti");
      setEffect({
        id: Date.now(),
        label: jack ? "VALE PİŞTİ!" : "PİŞTİ!",
        bonus: jack ? "+20" : "+10",
        jack,
      });

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setEffect(null), 1350);
    };

    const observer = new MutationObserver(triggerFromToast);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    triggerFromToast();

    return () => {
      observer.disconnect();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!effect) return null;

  return (
    <div className={`${styles.effectLayer} ${effect.jack ? styles.jack : ""}`} key={effect.id} aria-hidden="true">
      <div className={styles.flash} />
      <div className={styles.ring} />
      <div className={styles.ringSecondary} />
      <div className={styles.sparks}>
        {Array.from({ length: 14 }).map((_, index) => (
          <i key={index} style={{ "--spark": index } as React.CSSProperties} />
        ))}
      </div>
      <div className={styles.pistiCard}>
        <span>{effect.jack ? "J" : "★"}</span>
        <small>{effect.jack ? "VALE" : "PIŞTI"}</small>
      </div>
      <div className={styles.copy}>
        <strong>{effect.label}</strong>
        <span>{effect.bonus} PUAN</span>
      </div>
    </div>
  );
}
