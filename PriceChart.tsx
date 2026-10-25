import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCandles } from "@/lib/market.functions";
import {
  DEFAULT_INTERVAL,
  INTERVALS,
  RANGES,
  isAllowed,
  type ChartInterval,
  type ChartRange,
  type Ticker,
} from "@/lib/portfolio";
import { formatWIB } from "@/lib/time-format";

const CandleCanvas = lazy(() => import("./CandleCanvas"));

const INTRADAY: ChartInterval[] = ["1m", "5m", "15m", "1h", "4h"];

export function PriceChart({ ticker }: { ticker: Ticker }) {
  const [range, setRange] = useState<ChartRange>("1mo");
  const [interval, setInterval] = useState<ChartInterval>("1h");

  const query = useQuery({
    queryKey: ["candles", ticker, range, interval],
    queryFn: () => getCandles({ data: { symbol: ticker, range, interval } }),
    placeholderData: keepPreviousData,
    refetchInterval: INTRADAY.includes(interval) ? 60_000 : 5 * 60_000,
    staleTime: 30_000,
  });

  const pickRange = (r: ChartRange) => {
    setRange(r);
    if (!isAllowed(r, interval)) setInterval(DEFAULT_INTERVAL[r]);
  };

  const data = query.data;
  const viewKey = `${ticker}-${range}-${interval}`;
  const skeleton = <Skeleton className="h-full w-full rounded-none bg-panel-raised" />;

  return (
    <section className="panel flex flex-col overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="num font-semibold">{ticker}</span>
          <span className="label-caps">Candlestick · USD</span>
        </div>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Timeframe">
          {INTERVALS.map((i) => {
            const allowed = isAllowed(range, i.value);
            return (
              <Button
                key={i.value}
                variant="chip"
                size="chip"
                data-active={interval === i.value}
                disabled={!allowed}
                onClick={() => setInterval(i.value)}
                title={allowed ? undefined : "Tidak tersedia untuk periode ini"}
              >
                {i.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="relative h-[320px] sm:h-[380px]">
        <ClientOnly fallback={skeleton}>
          <Suspense fallback={skeleton}>
            {data?.ok ? (
              data.candles.length > 0 ? (
                <CandleCanvas candles={data.candles} viewKey={viewKey} />
              ) : (
                <ChartMessage text="Belum ada candle untuk periode ini (pasar mungkin sedang tutup)." />
              )
            ) : data && !data.ok ? (
              <ChartMessage text={data.error} />
            ) : query.isError ? (
              <ChartMessage text="Gagal memuat grafik. Periksa koneksi Anda." />
            ) : (
              skeleton
            )}
          </Suspense>
        </ClientOnly>
        {query.isFetching && data && (
          <span className="num absolute top-2 right-14 z-10 text-[10px] text-muted-foreground">
            memuat…
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-border p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Periode">
          {RANGES.map((r) => (
            <Button
              key={r.value}
              variant="chip"
              size="chip"
              data-active={range === r.value}
              onClick={() => pickRange(r.value)}
            >
              {r.label}
            </Button>
          ))}
        </div>
        <span className="num text-[11px] text-muted-foreground">
          Waktu New York (ET)
          {data?.ok ? ` · data ${formatWIB(data.fetchedAt)}` : ""}
        </span>
      </div>
    </section>
  );
}

function ChartMessage({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
