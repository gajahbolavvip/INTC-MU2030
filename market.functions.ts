import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { fetchCandles, fetchQuote, type QuoteDTO } from "./market.server";
import type { Candle } from "./portfolio";

export type { QuoteDTO };

export const DATA_SOURCE = "Yahoo Finance";

export type MarketSnapshot =
  | {
      ok: true;
      quotes: Record<"PLTR" | "MU", QuoteDTO>;
      fx: { rate: number; change: number; changePct: number; time: number };
      fetchedAt: number;
    }
  | { ok: false; error: string; fetchedAt: number };

export const getMarketSnapshot = createServerFn({ method: "GET" }).handler(
  async (): Promise<MarketSnapshot> => {
    try {
      const [pltr, mu, fx] = await Promise.all([
        fetchQuote("PLTR"),
        fetchQuote("MU"),
        fetchQuote("IDR=X"),
      ]);
      return {
        ok: true,
        quotes: { PLTR: pltr, MU: mu },
        fx: { rate: fx.price, change: fx.change, changePct: fx.changePct, time: fx.marketTime },
        fetchedAt: Date.now(),
      };
    } catch (err) {
      console.error("getMarketSnapshot failed", err);
      return {
        ok: false,
        error: "Data harga tidak dapat dimuat dari penyedia data. Coba lagi beberapa saat.",
        fetchedAt: Date.now(),
      };
    }
  },
);

const candleInput = z.object({
  symbol: z.enum(["PLTR", "MU"]),
  range: z.enum(["1d", "5d", "1mo", "3mo", "6mo", "1y"]),
  interval: z.enum(["1m", "5m", "15m", "1h", "4h", "1d", "1wk"]),
});

export type CandleResponse =
  | { ok: true; candles: Candle[]; timezone: string; fetchedAt: number }
  | { ok: false; error: string; fetchedAt: number };

export const getCandles = createServerFn({ method: "GET" })
  .validator((input) => candleInput.parse(input))
  .handler(async ({ data }): Promise<CandleResponse> => {
    try {
      const r = await fetchCandles(data.symbol, data.range, data.interval);
      return { ok: true, candles: r.candles, timezone: r.timezone, fetchedAt: Date.now() };
    } catch (err) {
      console.error("getCandles failed", err);
      return {
        ok: false,
        error: "Data grafik tidak tersedia untuk pilihan ini.",
        fetchedAt: Date.now(),
      };
    }
  });
