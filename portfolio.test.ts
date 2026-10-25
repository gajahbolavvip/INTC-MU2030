import { describe, expect, it } from "vitest";

import {
  DEFAULT_HOLDINGS,
  aggregateCandles,
  formatIDR,
  isAllowed,
  parseIDRInput,
  simulate,
  todayEffect,
  totalValue,
} from "./portfolio";

describe("portfolio math", () => {
  it("total is PLTR + MU", () => {
    expect(totalValue(DEFAULT_HOLDINGS)).toBe(41_540_507 + 9_584_553);
    expect(totalValue(DEFAULT_HOLDINGS)).toBe(51_125_060);
  });

  it("PLTR +2% gains about Rp830.810", () => {
    const row = simulate(41_540_507, 2);
    expect(Math.round(row.delta)).toBe(830_810);
    expect(Math.round(row.after)).toBe(42_371_317);
  });

  it("PLTR -2% loses about Rp830.810", () => {
    const row = simulate(41_540_507, -2);
    expect(Math.round(row.delta)).toBe(-830_810);
    expect(Math.round(row.after)).toBe(40_709_697);
  });

  it("0% leaves the value unchanged", () => {
    expect(simulate(9_584_553, 0).after).toBe(9_584_553);
  });

  it("today's effect uses the move relative to current price", () => {
    // Price 110 after +10 move: value before move was 100/110 of now.
    expect(todayEffect(1_100_000, 110, 10)).toBeCloseTo(100_000, 6);
  });

  it("formats rupiah in Indonesian style", () => {
    expect(formatIDR(830_810.14)).toBe("Rp830.810");
    expect(formatIDR(-830_810.14)).toBe("-Rp830.810");
    expect(formatIDR(830_810, { signed: true })).toBe("+Rp830.810");
  });

  it("parses Indonesian rupiah input", () => {
    expect(parseIDRInput("41.540.507")).toBe(41_540_507);
    expect(parseIDRInput("Rp 9.584.553")).toBe(9_584_553);
    expect(parseIDRInput("1.000,50")).toBe(1000.5);
    expect(parseIDRInput("abc")).toBeNull();
  });
});

describe("chart timeframe rules", () => {
  it("1-minute candles only for 1 day / 1 week", () => {
    expect(isAllowed("1d", "1m")).toBe(true);
    expect(isAllowed("5d", "1m")).toBe(true);
    expect(isAllowed("1mo", "1m")).toBe(false);
  });

  it("merges hourly candles into 4h buckets", () => {
    const h = 3600;
    const base = 4 * h * 1000;
    const merged = aggregateCandles(
      [
        { time: base, open: 1, high: 2, low: 0.5, close: 1.5, volume: 10 },
        { time: base + h, open: 1.5, high: 3, low: 1, close: 2.5, volume: 5 },
        { time: base + 4 * h, open: 2.5, high: 2.6, low: 2, close: 2.2, volume: 1 },
      ],
      4 * h,
    );
    expect(merged).toHaveLength(2);
    expect(merged[0]).toEqual({ time: base, open: 1, high: 3, low: 0.5, close: 2.5, volume: 15 });
  });
});
