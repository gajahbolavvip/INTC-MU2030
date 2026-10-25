// Server-only helpers that talk to the public Yahoo Finance chart endpoint.
import { aggregateCandles, type Candle, type ChartInterval, type ChartRange } from "./portfolio";

const BASE = "https://query1.finance.yahoo.com/v8/finance/chart/";

interface Period {
  start: number;
  end: number;
}

interface YahooMeta {
  symbol: string;
  longName?: string;
  shortName?: string;
  currency?: string;
  regularMarketPrice?: number;
  previousClose?: number;
  chartPreviousClose?: number;
  regularMarketTime?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
  gmtoffset?: number;
  exchangeTimezoneName?: string;
  currentTradingPeriod?: { pre?: Period; regular?: Period; post?: Period };
}

interface YahooResult {
  meta: YahooMeta;
  timestamp?: number[];
  indicators?: {
    quote?: {
      open?: (number | null)[];
      high?: (number | null)[];
      low?: (number | null)[];
      close?: (number | null)[];
      volume?: (number | null)[];
    }[];
  };
}

async function fetchChart(symbol: string, range: string, interval: string): Promise<YahooResult> {
  const url = `${BASE}${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; PortfolioDashboard/1.0)",
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`Yahoo ${symbol} HTTP ${res.status}`);
  }
  const json = (await res.json()) as {
    chart?: { result?: YahooResult[] | null; error?: { description?: string } | null };
  };
  const result = json.chart?.result?.[0];
  if (!result) {
    throw new Error(`Yahoo ${symbol}: ${json.chart?.error?.description ?? "no data"}`);
  }
  return result;
}

export type MarketState = "PRE" | "REGULAR" | "POST" | "CLOSED";

function marketState(meta: YahooMeta, nowSec: number): MarketState {
  const p = meta.currentTradingPeriod;
  const inP = (x?: Period) => !!x && nowSec >= x.start && nowSec < x.end;
  if (inP(p?.regular)) return "REGULAR";
  if (inP(p?.pre)) return "PRE";
  if (inP(p?.post)) return "POST";
  return "CLOSED";
}

export interface QuoteDTO {
  symbol: string;
  name: string;
  price: number;
  previousClose: number;
  change: number;
  changePct: number;
  marketTime: number;
  dayHigh: number | null;
  dayLow: number | null;
  volume: number | null;
  marketState: MarketState;
  nextOpen: number | null;
}

export async function fetchQuote(symbol: string): Promise<QuoteDTO> {
  const r = await fetchChart(symbol, "1d", "5m");
  const m = r.meta;
  const price = m.regularMarketPrice;
  const prev = m.previousClose ?? m.chartPreviousClose;
  if (typeof price !== "number" || typeof prev !== "number") {
    throw new Error(`Yahoo ${symbol}: missing price`);
  }
  const now = Math.floor(Date.now() / 1000);
  const regular = m.currentTradingPeriod?.regular;
  return {
    symbol: m.symbol,
    name: m.longName ?? m.shortName ?? symbol,
    price,
    previousClose: prev,
    change: price - prev,
    changePct: ((price - prev) / prev) * 100,
    marketTime: m.regularMarketTime ?? now,
    dayHigh: m.regularMarketDayHigh ?? null,
    dayLow: m.regularMarketDayLow ?? null,
    volume: m.regularMarketVolume ?? null,
    marketState: marketState(m, now),
    nextOpen: regular && regular.start > now ? regular.start : null,
  };
}

export async function fetchCandles(
  symbol: string,
  range: ChartRange,
  interval: ChartInterval,
): Promise<{ candles: Candle[]; gmtoffset: number; timezone: string }> {
  const yInterval = interval === "1h" || interval === "4h" ? "60m" : interval;
  const r = await fetchChart(symbol, range, yInterval);
  const offset = r.meta.gmtoffset ?? 0;
  const ts = r.timestamp ?? [];
  const q = r.indicators?.quote?.[0] ?? {};
  let candles: Candle[] = [];
  ts.forEach((t, i) => {
    const o = q.open?.[i];
    const h = q.high?.[i];
    const l = q.low?.[i];
    const c = q.close?.[i];
    if (o == null || h == null || l == null || c == null) return;
    candles.push({
      time: t + offset,
      open: o,
      high: h,
      low: l,
      close: c,
      volume: q.volume?.[i] ?? 0,
    });
  });
  // Dedupe/ensure ascending (Yahoo sometimes repeats the live bar).
  candles.sort((a, b) => a.time - b.time);
  candles = candles.filter((c, i) => i === 0 || c.time !== candles[i - 1]?.time);
  if (interval === "4h") candles = aggregateCandles(candles, 4 * 3600);
  return {
    candles,
    gmtoffset: offset,
    timezone: r.meta.exchangeTimezoneName ?? "America/New_York",
  };
}
