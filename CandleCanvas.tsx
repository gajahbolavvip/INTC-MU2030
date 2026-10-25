// Browser-only: loaded lazily behind <ClientOnly>. Imports TradingView Lightweight Charts.
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  createChart,
  type CandlestickData,
  type HistogramData,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useRef, useState } from "react";

import { formatUSD, type Candle } from "@/lib/portfolio";
import { cn } from "@/lib/utils";

/** Resolve a CSS custom property (oklch) to rgba() for the canvas library. */
function cssColor(name: string, alpha?: number): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "rgba(128,128,128,1)";
  ctx.fillStyle = raw || "#888";
  ctx.fillRect(0, 0, 1, 1);
  const [r = 128, g = 128, b = 128, a = 255] = ctx.getImageData(0, 0, 1, 1).data;
  return `rgba(${r},${g},${b},${alpha ?? a / 255})`;
}

interface Props {
  candles: Candle[];
  /** Changes when the user picks a new range/interval; triggers fit-to-content. */
  viewKey: string;
}

interface Legend {
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export default function CandleCanvas({ candles, viewKey }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const lastKey = useRef<string>("");
  const byTime = useRef(new Map<number, Candle>());
  const [legend, setLegend] = useState<Legend | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const up = cssColor("--up");
    const down = cssColor("--down");
    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: cssColor("--panel") },
        textColor: cssColor("--muted-foreground"),
        fontFamily: "JetBrains Mono, ui-monospace, monospace",
        fontSize: 11,
        attributionLogo: true,
      },
      grid: {
        vertLines: { color: cssColor("--grid", 0.6) },
        horzLines: { color: cssColor("--grid", 0.6) },
      },
      rightPriceScale: { borderColor: cssColor("--border") },
      timeScale: {
        borderColor: cssColor("--border"),
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: cssColor("--primary", 0.5), labelBackgroundColor: cssColor("--panel-raised") },
        horzLine: { color: cssColor("--primary", 0.5), labelBackgroundColor: cssColor("--panel-raised") },
      },
    });
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: up,
      downColor: down,
      borderUpColor: up,
      borderDownColor: down,
      wickUpColor: up,
      wickDownColor: down,
    });
    candleSeries.priceScale().applyOptions({ scaleMargins: { top: 0.08, bottom: 0.26 } });
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
      lastValueVisible: false,
      priceLineVisible: false,
    });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    chart.subscribeCrosshairMove((param) => {
      const t = typeof param.time === "number" ? param.time : null;
      const c = t !== null ? byTime.current.get(t) : undefined;
      if (c) setLegend({ o: c.open, h: c.high, l: c.low, c: c.close, v: c.volume });
      else setLegend(null);
    });

    chartRef.current = chart;
    candleRef.current = candleSeries;
    volumeRef.current = volumeSeries;
    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const cs = candleRef.current;
    const vs = volumeRef.current;
    if (!cs || !vs) return;
    const upSoft = cssColor("--up", 0.35);
    const downSoft = cssColor("--down", 0.35);
    byTime.current = new Map(candles.map((c) => [c.time, c]));
    cs.setData(
      candles.map<CandlestickData>((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );
    vs.setData(
      candles.map<HistogramData>((c) => ({
        time: c.time as UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open ? upSoft : downSoft,
      })),
    );
    if (lastKey.current !== viewKey) {
      chartRef.current?.timeScale().fitContent();
      lastKey.current = viewKey;
    }
  }, [candles, viewKey]);

  const last = candles[candles.length - 1];
  const shown: Legend | null =
    legend ?? (last ? { o: last.open, h: last.high, l: last.low, c: last.close, v: last.volume } : null);
  const isUp = shown ? shown.c >= shown.o : true;

  return (
    <div className="relative h-full w-full">
      {shown && (
        <div className="num pointer-events-none absolute top-2 left-2 z-10 flex flex-wrap gap-x-3 gap-y-0.5 rounded bg-panel/80 px-2 py-1 text-[11px] backdrop-blur-sm">
          {(
            [
              ["O", shown.o],
              ["H", shown.h],
              ["L", shown.l],
              ["C", shown.c],
            ] as const
          ).map(([k, v]) => (
            <span key={k}>
              <span className="text-muted-foreground">{k} </span>
              <span className={cn(isUp ? "text-up" : "text-down")}>{formatUSD(v)}</span>
            </span>
          ))}
          <span>
            <span className="text-muted-foreground">Vol </span>
            {shown.v.toLocaleString("en-US")}
          </span>
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
