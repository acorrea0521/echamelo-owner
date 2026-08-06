/**
 * Motor matemático de la tragamonedas "Granja" (social casino).
 *
 * Todo el "negocio" vive aquí: los símbolos, sus pesos (probabilidad de salir),
 * la tabla de pagos y el cálculo del RTP (Return To Player).
 *
 *   RTP        = % que la máquina devuelve al jugador a largo plazo.
 *   House edge = 100% - RTP = tu ganancia promedio por cada moneda apostada.
 *
 * Es un modelo clásico de 3 rodillos con una sola línea de pago (la fila central).
 * Cada rodillo saca UN símbolo de forma independiente según su peso, así el RTP
 * es exacto y se puede calcular enumerando las 7^3 = 343 combinaciones posibles.
 *
 * Nada aquí paga dinero real: son monedas virtuales (modelo "social casino").
 */

export type SymbolId =
  | "corn"
  | "chicken"
  | "pig"
  | "sheep"
  | "cow"
  | "tractor"
  | "seven";

export interface SlotSymbol {
  id: SymbolId;
  emoji: string;
  label: string;
  /** Peso relativo: a mayor peso, más frecuente en cada rodillo. */
  weight: number;
  /** Multiplicador de la apuesta al obtener 3 iguales. */
  payout3: number;
  /** El comodín sustituye a cualquier símbolo de granja (no al 7). */
  isWild?: boolean;
  /** El 7 dispara el jackpot progresivo (no tiene pago de línea normal). */
  isJackpot?: boolean;
}

/**
 * Tira de símbolos (igual en los 3 rodillos).
 *
 * Ajustar `weight` y `payout3` es como se afina el negocio: subir pesos de
 * símbolos que pagan poco = más ventaja para la casa (RTP más bajo).
 */
export const SYMBOLS: SlotSymbol[] = [
  { id: "corn", emoji: "🌽", label: "Maíz", weight: 26, payout3: 4 },
  { id: "chicken", emoji: "🐔", label: "Gallina", weight: 22, payout3: 6 },
  { id: "pig", emoji: "🐷", label: "Cerdo", weight: 16, payout3: 10 },
  { id: "sheep", emoji: "🐑", label: "Oveja", weight: 11, payout3: 18 },
  { id: "cow", emoji: "🐄", label: "Vaca", weight: 7, payout3: 38 },
  { id: "tractor", emoji: "🚜", label: "Tractor (comodín)", weight: 8, payout3: 75, isWild: true },
  { id: "seven", emoji: "7️⃣", label: "Siete (JACKPOT)", weight: 3, payout3: 0, isJackpot: true },
];

export const REELS = 3;

/** Porcentaje de cada apuesta que alimenta el pozo del jackpot progresivo. */
export const JACKPOT_CONTRIBUTION = 0.02; // 2%

/** Valor semilla del jackpot cuando alguien lo gana y se reinicia. */
export const JACKPOT_SEED = 5000;

const BY_ID: Record<SymbolId, SlotSymbol> = Object.fromEntries(
  SYMBOLS.map((s) => [s.id, s]),
) as Record<SymbolId, SlotSymbol>;

export function getSymbol(id: SymbolId): SlotSymbol {
  return BY_ID[id];
}

const TOTAL_WEIGHT = SYMBOLS.reduce((sum, s) => sum + s.weight, 0);

/** Saca un símbolo aleatorio de un rodillo, respetando los pesos. */
export function drawSymbol(rng: () => number = Math.random): SymbolId {
  let r = rng() * TOTAL_WEIGHT;
  for (const s of SYMBOLS) {
    r -= s.weight;
    if (r < 0) return s.id;
  }
  return SYMBOLS[SYMBOLS.length - 1].id;
}

export interface LineResult {
  /** Multiplicador de la apuesta (0 = no hay premio de línea). */
  multiplier: number;
  /** Símbolo ganador, o null si no hubo premio. */
  symbol: SymbolId | null;
  /** True si la combinación es 7-7-7 (jackpot progresivo). */
  jackpot: boolean;
  /** True si el premio se formó usando al menos un comodín. */
  usedWild: boolean;
}

/**
 * Evalúa la línea de 3 símbolos y devuelve el premio.
 *
 * Reglas:
 *  - 7-7-7  -> jackpot progresivo.
 *  - Cualquier 7 mezclado (pero no tres) -> sin premio.
 *  - El tractor (comodín) sustituye a cualquier animal/maíz para completar trío.
 *  - 3 comodines -> pagan como trío de tractores.
 */
export function evaluateLine(a: SymbolId, b: SymbolId, c: SymbolId): LineResult {
  const line = [a, b, c];
  const sevens = line.filter((id) => id === "seven").length;

  if (sevens === 3) {
    return { multiplier: 0, symbol: "seven", jackpot: true, usedWild: false };
  }
  if (sevens > 0) {
    return { multiplier: 0, symbol: null, jackpot: false, usedWild: false };
  }

  const wilds = line.filter((id) => id === "tractor").length;
  const nonWild = line.filter((id) => id !== "tractor");

  // Tres comodines: pagan como trío de tractor.
  if (nonWild.length === 0) {
    return {
      multiplier: BY_ID.tractor.payout3,
      symbol: "tractor",
      jackpot: false,
      usedWild: true,
    };
  }

  // Todos los no-comodines iguales -> premio (los comodines completan el trío).
  const first = nonWild[0];
  if (nonWild.every((id) => id === first)) {
    return {
      multiplier: BY_ID[first].payout3,
      symbol: first,
      jackpot: false,
      usedWild: wilds > 0,
    };
  }

  return { multiplier: 0, symbol: null, jackpot: false, usedWild: false };
}

export interface SpinResult {
  /** Los 3 símbolos de la línea central. */
  reels: SymbolId[];
  /** Monedas ganadas en el premio de línea (0 si no hubo). */
  win: number;
  /** True si cayó el jackpot progresivo (7-7-7). */
  jackpot: boolean;
  /** Símbolo ganador o null. */
  winningSymbol: SymbolId | null;
  usedWild: boolean;
}

/** Ejecuta un giro con la apuesta dada. */
export function spin(bet: number, rng: () => number = Math.random): SpinResult {
  const reels: SymbolId[] = [drawSymbol(rng), drawSymbol(rng), drawSymbol(rng)];
  const line = evaluateLine(reels[0], reels[1], reels[2]);
  return {
    reels,
    win: line.multiplier * bet,
    jackpot: line.jackpot,
    winningSymbol: line.symbol,
    usedWild: line.usedWild,
  };
}

export interface SlotStats {
  /** RTP del juego base (sin contar el jackpot), en fracción (0.90 = 90%). */
  baseRtp: number;
  /** Ventaja de la casa del juego base = 1 - baseRtp. */
  houseEdge: number;
  /** Probabilidad de obtener CUALQUIER premio de línea en un giro. */
  hitFrequency: number;
  /** Probabilidad de disparar el jackpot (7-7-7) en un giro. */
  jackpotProbability: number;
  /** Probabilidad de cada símbolo en un rodillo. */
  symbolProbabilities: { id: SymbolId; probability: number }[];
}

/**
 * Calcula las estadísticas EXACTAS enumerando las 343 combinaciones.
 * Esto es lo que le enseñas a un socio/inversionista: "así de rentable es".
 */
export function computeStats(): SlotStats {
  const p = (id: SymbolId) => BY_ID[id].weight / TOTAL_WEIGHT;

  let expectedReturn = 0; // suma de multiplicador * probabilidad
  let hitProbability = 0;
  let jackpotProbability = 0;

  for (const a of SYMBOLS) {
    for (const b of SYMBOLS) {
      for (const c of SYMBOLS) {
        const prob = p(a.id) * p(b.id) * p(c.id);
        const line = evaluateLine(a.id, b.id, c.id);
        if (line.jackpot) {
          jackpotProbability += prob;
        } else if (line.multiplier > 0) {
          expectedReturn += line.multiplier * prob;
          hitProbability += prob;
        }
      }
    }
  }

  return {
    baseRtp: expectedReturn,
    houseEdge: 1 - expectedReturn,
    hitFrequency: hitProbability,
    jackpotProbability,
    symbolProbabilities: SYMBOLS.map((s) => ({ id: s.id, probability: p(s.id) })),
  };
}
