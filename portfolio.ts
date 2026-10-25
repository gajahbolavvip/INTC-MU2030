// Pure, framework-free portfolio math and formatting. Safe for client + server.

export type Ticker = "PLTR" | "MU";

export const TICKERS: readonly Ticker[] = ["PLTR", "MU"] as const;

export const TICKER_NAMES: Record<Ticker, string> = {
  PLTR: "Palantir Technologies",
  MU: "Micron Technology",
};

/** Current market value of each holding, in whole rupiah (not purchase cost). */
export type Holdings = Record<Ticker, number>;

export const DEFAULT_HOLDINGS: Holdings = {
  PLTR: 41_540_507,
  MU: 9_584_553,
};

export const SIMULATION_STEPS = [-10, -5, -2, -1, 0, 1, 2, 5, 10] as const;

export function totalValue(holdings: Holdings): number {
  return TICKERS.reduce((sum, t) => sum + (holdings[t] ?? 0), 0);
}

export interface SimulationRow {
  pct: number;
  before: number;
  delta: number;
  after: number;
}

/** Value change for a percentage move. Rounded to whole rupiah only at display time. */
export function simulate(value: number, pct: number): SimulationRow {
  const delta = (value * pct) / 100;
  return { pct, before: value, delta, after: value + delta };
}

/**
 * Today's move applied to a holding whose *current* value is known.
 * If value V is at price P, and price moved by `change` today, the value
 * before the move was V * (P - change) / P, so today's effect is V * change / P.
 */
export function todayEffect(value: number, price: number, change: number): number {
  if (!price) return 0;
  return (value * change) / price;
}

/** Shares implied by a rupiah value at the given USD price and USD/IDR rate. */
export function impliedShares(valueIdr: number, priceUsd: number, usdIdr: number): number {
  if (!priceUsd || !usdIdr) return 0;
  return valueIdr / (priceUsd * usdIdr);
}

const idrFmt = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatIDR(value: number, opts: { signed?: boolean } = {}): string {
  const rounded = Math.round(value);
  // Avoid "-Rp 0" for tiny negatives.
  const safe = Object.is(rounded, -0) ? 0 : rounded;
  const text = idrFmt.format(Math.abs(safe)).replace(/\s/g, "");
  if (safe < 0) return `-${text}`;
  if (opts.signed && safe > 0) return `+${text}`;
  return text;
}

export function formatUSD(value: number, opts: { signed?: boolean } = {}): string {
  const text = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));
  if (value < 0) return `-${text}`;
  if (opts.signed && value > 0) return `+${text}`;
  return text;
}

export function formatPct(value: number, opts: { signed?: boolean } = { signed: true }): string {
  const text = `${Math.abs(value).toLocaleString("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
  if (value < 0) return `-${text}`;
  if (opts.signed && value > 0) return `+${text}`;
  return text;
}

/**
 * Parse a rupiah amount typed in Indonesian format ("41.540.507", "Rp 41.540.507,50").
 * Dots are thousand separators, comma is the decimal separator.
 */
export function parseIDRInput(input: string): number | null {
  const cleaned = input.replace(/rp/gi, "").replace(/\s/g, "");
  if (!cleaned) return null;
  if (!/^[\d.,]+$/.test(cleaned)) return null;
  const [intPart = "", decPart, ...rest] = cleaned.split(",");
  if (rest.length) return null;
  const digits = intPart.replace(/\./g, "");
  if (!/^\d+$/.test(digits)) return null;
  const num = Number(decPart ? `${digits}.${decPart.replace(/\./g, "")}` : digits);
  return Number.isFinite(num) ? num : null;
}

export function trendClass(value: number): "up" | "down" | "flat" {
  if (value > 0) return "up";
  if (value < 0) return "down";
  return "flat";
}

// ---- Chart timeframe rules (limits of the free data source) ----

export type ChartInterval = "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1wk";
export type ChartRange = "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y";

export const INTERVALS: { value: ChartInterval; label: string }[] = [
  { value: "1m", label: "1m" },
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "1h", label: "1J" },
  { value: "4h", label: "4J" },
  { value: "1d", label: "1H" },
  { value: "1wk", label: "1M" },
];

export const RANGES: { value: ChartRange; label: string }[] = [
  { value: "1d", label: "1 Hari" },
  { value: "5d", label: "1 Minggu" },
  { value: "1mo", label: "1 Bulan" },
  { value: "3mo", label: "3 Bulan" },
  { value: "6mo", label: "6 Bulan" },
  { value: "1y", label: "1 Tahun" },
];

export const ALLOWED_INTERVALS: Record<ChartRange, ChartInterval[]> = {
  "1d": ["1m", "5m", "15m", "1h"],
  "5d": ["1m", "5m", "15m", "1h", "4h", "1d"],
  "1mo": ["5m", "15m", "1h", "4h", "1d"],
  "3mo": ["1h", "4h", "1d", "1wk"],
  "6mo": ["1h", "4h", "1d", "1wk"],
  "1y": ["1h", "4h", "1d", "1wk"],
};

export const DEFAULT_INTERVAL: Record<ChartRange, ChartInterval> = {
  "1d": "5m",
  "5d": "15m",
  "1mo": "1h",
  "3mo": "1d",
  "6mo": "1d",
  "1y": "1d",
};

export function isAllowed(range: ChartRange, interval: ChartInterval): boolean {
  return ALLOWED_INTERVALS[range].includes(interval);
}

export interface Candle {
  time: number; // unix seconds, shifted to exchange local time
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** Merge hourly candles into 4-hour buckets (bucket = floor(time / 4h)). */
export function aggregateCandles(candles: Candle[], bucketSeconds: number): Candle[] {
  const out: Candle[] = [];
  for (const c of candles) {
    const bucket = Math.floor(c.time / bucketSeconds) * bucketSeconds;
    const last = out[out.length - 1];
    if (last && last.time === bucket) {
      last.high = Math.max(last.high, c.high);
      last.low = Math.min(last.low, c.low);
      last.close = c.close;
      last.volume += c.volume;
    } else {
      out.push({ ...c, time: bucket });
    }
  }
  return out;
}
