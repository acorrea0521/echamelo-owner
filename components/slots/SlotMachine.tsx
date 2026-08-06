"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  JACKPOT_CONTRIBUTION,
  JACKPOT_SEED,
  SYMBOLS,
  type SymbolId,
  computeStats,
  drawSymbol,
  getSymbol,
  spin as spinEngine,
} from "@/lib/slots/engine";

const BALANCE_KEY = "slots.balance.v1";
const JACKPOT_KEY = "slots.jackpot.v1";
const START_BALANCE = 1000;
const BET_OPTIONS = [10, 25, 50, 100];
const COIN_PACKS = [500, 1000, 5000];
const SPIN_MS = 900; // duración de la animación de giro

type Reel = { current: SymbolId; spinning: boolean };

function readNumber(key: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  const n = raw == null ? NaN : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function SlotMachine() {
  const stats = useMemo(() => computeStats(), []);

  const [ready, setReady] = useState(false);
  const [balance, setBalance] = useState(START_BALANCE);
  const [jackpot, setJackpot] = useState(JACKPOT_SEED);
  const [bet, setBet] = useState(BET_OPTIONS[0]);
  const [reels, setReels] = useState<Reel[]>(() =>
    SYMBOLS.slice(0, 3).map((s) => ({ current: s.id, spinning: false })),
  );
  const [spinning, setSpinning] = useState(false);
  const [message, setMessage] = useState<string>("¡Gira para empezar!");
  const [lastWin, setLastWin] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [showStore, setShowStore] = useState(false);

  const tickRefs = useRef<ReturnType<typeof setInterval>[]>([]);

  // Cargar saldo/jackpot guardados (solo en cliente, evita mismatch de SSR).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lectura única de localStorage al montar
    setBalance(readNumber(BALANCE_KEY, START_BALANCE));
    setJackpot(readNumber(JACKPOT_KEY, JACKPOT_SEED));
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(BALANCE_KEY, String(balance));
  }, [balance, ready]);
  useEffect(() => {
    if (ready) window.localStorage.setItem(JACKPOT_KEY, String(jackpot));
  }, [jackpot, ready]);

  const stopAllTicks = useCallback(() => {
    tickRefs.current.forEach(clearInterval);
    tickRefs.current = [];
  }, []);

  useEffect(() => () => stopAllTicks(), [stopAllTicks]);

  const settle = useCallback((result: ReturnType<typeof spinEngine>) => {
    setSpinning(false);
    if (result.jackpot) {
      setJackpot((currentPool) => {
        setBalance((b) => b + currentPool);
        setLastWin(currentPool);
        setMessage(`🎉 ¡JACKPOT! Ganaste ${currentPool.toLocaleString()} 🪙`);
        return JACKPOT_SEED; // reinicia el pozo
      });
      return;
    }
    if (result.win > 0) {
      setBalance((b) => b + result.win);
      setLastWin(result.win);
      const sym = result.winningSymbol ? getSymbol(result.winningSymbol) : null;
      setMessage(
        `¡Ganaste ${result.win.toLocaleString()} 🪙!${
          result.usedWild ? " (con comodín 🚜)" : ""
        }${sym ? ` — trío de ${sym.label}` : ""}`,
      );
    } else {
      setMessage("Sin premio. ¡Otra vez! 🍀");
    }
  }, []);

  const handleSpin = useCallback(() => {
    if (spinning) return;
    if (balance < bet) {
      setMessage("Saldo insuficiente. Compra más monedas 🪙");
      setShowStore(true);
      return;
    }

    setSpinning(true);
    setLastWin(0);
    setMessage("Girando…");
    setBalance((b) => b - bet);
    setJackpot((j) => j + Math.round(bet * JACKPOT_CONTRIBUTION));

    const result = spinEngine(bet);

    // Animación: cada rodillo cicla símbolos al azar y se detiene escalonado.
    setReels((rs) => rs.map((r) => ({ ...r, spinning: true })));
    stopAllTicks();
    reels.forEach((_, i) => {
      const id = setInterval(() => {
        setReels((rs) =>
          rs.map((r, j) => (j === i ? { ...r, current: drawSymbol() } : r)),
        );
      }, 70);
      tickRefs.current.push(id);
    });

    reels.forEach((_, i) => {
      window.setTimeout(
        () => {
          if (tickRefs.current[i]) clearInterval(tickRefs.current[i]);
          setReels((rs) =>
            rs.map((r, j) =>
              j === i ? { current: result.reels[i], spinning: false } : r,
            ),
          );
          // Al detenerse el último rodillo, liquidamos el resultado.
          if (i === reels.length - 1) settle(result);
        },
        SPIN_MS + i * 250,
      );
    });
  }, [balance, bet, spinning, reels, stopAllTicks, settle]);

  const buyCoins = useCallback((amount: number) => {
    setBalance((b) => b + amount);
    setShowStore(false);
    setMessage(`+${amount.toLocaleString()} monedas 🪙`);
  }, []);

  const resetGame = useCallback(() => {
    setBalance(START_BALANCE);
    setJackpot(JACKPOT_SEED);
    setLastWin(0);
    setMessage("Juego reiniciado.");
  }, []);

  const pct = (n: number) => `${(n * 100).toFixed(2)}%`;
  const oneIn = (p: number) => (p > 0 ? Math.round(1 / p) : Infinity);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      {/* Marcador superior */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-surface p-3 text-center">
          <div className="text-xs text-muted-foreground">Tu saldo</div>
          <div className="text-xl font-bold text-gold">
            {ready ? balance.toLocaleString() : "—"} 🪙
          </div>
        </div>
        <div className="rounded-xl border border-gold/40 bg-gradient-to-b from-gold/15 to-transparent p-3 text-center">
          <div className="text-xs text-muted-foreground">JACKPOT</div>
          <div className="text-xl font-bold text-gold animate-pulse">
            {ready ? jackpot.toLocaleString() : "—"} 🪙
          </div>
        </div>
      </div>

      {/* Rodillos */}
      <div className="rounded-2xl border border-primary/40 bg-gradient-to-b from-primary/10 to-black/40 p-4 shadow-lg">
        <div className="grid grid-cols-3 gap-3">
          {reels.map((reel, i) => (
            <div
              key={i}
              className={cn(
                "flex aspect-square items-center justify-center rounded-xl border-2 bg-black/60 text-5xl transition-transform sm:text-6xl",
                reel.spinning
                  ? "border-primary/60 blur-[1px] scale-105"
                  : "border-border",
              )}
            >
              <span>{getSymbol(reel.current).emoji}</span>
            </div>
          ))}
        </div>

        {/* Mensaje / resultado */}
        <div
          className={cn(
            "mt-3 min-h-9 rounded-lg px-3 py-2 text-center text-sm font-medium",
            lastWin > 0
              ? "bg-gold/15 text-gold"
              : "bg-black/40 text-muted-foreground",
          )}
        >
          {message}
        </div>
      </div>

      {/* Apuesta */}
      <div>
        <div className="mb-1.5 text-xs text-muted-foreground">Apuesta por giro</div>
        <div className="grid grid-cols-4 gap-2">
          {BET_OPTIONS.map((amount) => (
            <Button
              key={amount}
              variant={bet === amount ? "default" : "outline"}
              size="lg"
              disabled={spinning}
              onClick={() => setBet(amount)}
            >
              {amount}
            </Button>
          ))}
        </div>
      </div>

      {/* Botón de giro */}
      <Button
        size="lg"
        disabled={spinning}
        onClick={handleSpin}
        className="h-14 text-lg font-bold"
      >
        {spinning ? "Girando…" : `GIRAR · ${bet} 🪙`}
      </Button>

      {/* Acciones secundarias */}
      <div className="grid grid-cols-3 gap-2">
        <Button variant="secondary" onClick={() => setShowStore((s) => !s)}>
          🪙 Comprar
        </Button>
        <Button variant="outline" onClick={() => setShowInfo((s) => !s)}>
          📊 Probabilidades
        </Button>
        <Button variant="ghost" onClick={resetGame}>
          ↺ Reiniciar
        </Button>
      </div>

      {/* Tienda de monedas (simulación de compras dentro de la app) */}
      {showStore && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-2 text-sm font-semibold">Comprar monedas</div>
          <p className="mb-3 text-xs text-muted-foreground">
            Demo del modelo de negocio: en producción esto sería una compra real
            (Stripe / App Store / Google Play). Las monedas son virtuales, sin
            valor en efectivo.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {COIN_PACKS.map((pack) => (
              <Button key={pack} variant="secondary" onClick={() => buyCoins(pack)}>
                +{pack.toLocaleString()}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Panel de probabilidades (para el dueño del negocio) */}
      {showInfo && (
        <div className="rounded-xl border border-border bg-surface p-4 text-sm">
          <div className="mb-3 grid grid-cols-2 gap-3">
            <Metric label="RTP (base)" value={pct(stats.baseRtp)} />
            <Metric label="Ventaja de la casa" value={pct(stats.houseEdge)} accent />
            <Metric label="Frecuencia de premio" value={pct(stats.hitFrequency)} />
            <Metric
              label="Prob. jackpot"
              value={`1 en ${oneIn(stats.jackpotProbability).toLocaleString()}`}
            />
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            De cada apuesta, un {pct(JACKPOT_CONTRIBUTION)} alimenta el pozo del
            jackpot. La ventaja de la casa es tu ganancia promedio a largo plazo.
          </p>

          <div className="mb-1.5 text-xs font-semibold text-muted-foreground">
            Tabla de pagos (3 iguales)
          </div>
          <ul className="divide-y divide-border/60">
            {SYMBOLS.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-1.5">
                <span className="flex items-center gap-2">
                  <span className="text-lg">{s.emoji}</span>
                  <span>{s.label}</span>
                </span>
                <span className="font-mono text-muted-foreground">
                  {s.isJackpot
                    ? "JACKPOT"
                    : `×${s.payout3}${s.isWild ? " · comodín" : ""}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
        Solo para mayores de edad · Juego con monedas virtuales sin valor en
        efectivo · Los premios no son dinero real.
      </p>
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg bg-black/30 p-2.5 text-center">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={cn("text-base font-bold", accent ? "text-primary" : "text-foreground")}>
        {value}
      </div>
    </div>
  );
}
