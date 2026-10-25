import type { QuoteDTO } from "@/lib/market.functions";
import {
  TICKER_NAMES,
  formatIDR,
  formatPct,
  formatUSD,
  impliedShares,
  todayEffect,
  type Ticker,
} from "@/lib/portfolio";
import { formatET, formatWIB } from "@/lib/time-format";
import { cn } from "@/lib/utils";

import { TrendIcon, TrendPill, trendText } from "./Trend";

interface Props {
  ticker: Ticker;
  value: number;
  share: number;
  quote: QuoteDTO | null;
  fxRate: number | null;
}

export function StockCard({ ticker, value, share, quote, fxRate }: Props) {
  const effect = quote ? todayEffect(value, quote.price, quote.change) : null;
  const shares = quote && fxRate ? impliedShares(value, quote.price, fxRate) : null;

  return (
    <article className="panel flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="num text-xl font-semibold tracking-tight">{ticker}</p>
          <p className="text-sm text-muted-foreground">{TICKER_NAMES[ticker]}</p>
        </div>
        <span className="num rounded border border-border px-2 py-0.5 text-xs text-muted-foreground">
          {share.toFixed(1)}% porto
        </span>
      </div>

      {quote ? (
        <>
          <div key={quote.price} className="animate-tick mt-5 -mx-2 rounded px-2 py-1">
            <p className="label-caps">Harga terakhir (USD)</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="num text-3xl font-semibold">{formatUSD(quote.price)}</span>
              <span className={cn("num flex items-center text-sm", trendText(quote.change))}>
                <TrendIcon value={quote.change} />
                {formatUSD(quote.change, { signed: true })}
              </span>
              <TrendPill value={quote.changePct}>{formatPct(quote.changePct)}</TrendPill>
            </div>
          </div>

          <dl className="num mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div className="col-span-2 rounded-md bg-panel-raised p-3">
              <dt className="label-caps">Nilai pasar Anda</dt>
              <dd className="mt-0.5 text-lg font-semibold">{formatIDR(value)}</dd>
              {effect !== null && (
                <dd className={cn("text-xs", trendText(effect))}>
                  {formatIDR(effect, { signed: true })} dari pergerakan hari ini
                </dd>
              )}
            </div>
            <div>
              <dt className="label-caps">Tutup sebelumnya</dt>
              <dd>{formatUSD(quote.previousClose)}</dd>
            </div>
            <div>
              <dt className="label-caps">Rentang hari</dt>
              <dd>
                {quote.dayLow !== null && quote.dayHigh !== null
                  ? `${quote.dayLow.toFixed(2)} – ${quote.dayHigh.toFixed(2)}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="label-caps">Setara lembar</dt>
              <dd title="Perkiraan dari nilai Anda ÷ (harga × kurs)">
                {shares !== null ? `≈ ${shares.toLocaleString("id-ID", { maximumFractionDigits: 4 })}` : "—"}
              </dd>
            </div>
            <div>
              <dt className="label-caps">Volume</dt>
              <dd>{quote.volume !== null ? quote.volume.toLocaleString("en-US") : "—"}</dd>
            </div>
          </dl>

          <p className="num mt-auto pt-4 text-xs text-muted-foreground">
            Harga per {formatWIB(quote.marketTime * 1000)} · {formatET(quote.marketTime * 1000)}
          </p>
        </>
      ) : (
        <div className="mt-5">
          <p className="label-caps">Nilai pasar Anda</p>
          <p className="num mt-1 text-2xl font-semibold">{formatIDR(value)}</p>
          <p className="mt-3 text-sm text-down">Harga saham belum dapat dimuat.</p>
        </div>
      )}
    </article>
  );
}
