import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { MarketSnapshot } from "@/lib/market.functions";
import {
  TICKERS,
  formatIDR,
  formatPct,
  formatUSD,
  todayEffect,
  totalValue,
  type Holdings,
} from "@/lib/portfolio";
import { formatWIB } from "@/lib/time-format";
import { cn } from "@/lib/utils";

import { TrendPill, trendText } from "./Trend";

interface Props {
  holdings: Holdings;
  snapshot: MarketSnapshot;
  onEdit: () => void;
}

export function PortfolioSummary({ holdings, snapshot, onEdit }: Props) {
  const total = totalValue(holdings);
  const today = snapshot.ok
    ? TICKERS.reduce(
        (s, t) => s + todayEffect(holdings[t], snapshot.quotes[t].price, snapshot.quotes[t].change),
        0,
      )
    : null;
  const todayPct = today !== null && total - today !== 0 ? (today / (total - today)) * 100 : 0;

  return (
    <section className="panel grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.4fr_1fr_1fr]">
      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="label-caps">Total nilai pasar</p>
          <Button variant="ghost" size="sm" onClick={onEdit} className="text-muted-foreground">
            <Pencil /> Ubah nilai
          </Button>
        </div>
        <p className="num mt-1 text-3xl font-semibold sm:text-4xl">{formatIDR(total)}</p>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary"
            style={{ width: `${total ? (holdings.PLTR / total) * 100 : 0}%` }}
          />
        </div>
        <div className="num mt-2 flex justify-between text-xs text-muted-foreground">
          <span>
            <span className="text-primary">■</span> PLTR{" "}
            {total ? ((holdings.PLTR / total) * 100).toFixed(1) : "0"}%
          </span>
          <span>
            MU {total ? ((holdings.MU / total) * 100).toFixed(1) : "0"}%{" "}
            <span className="text-muted">■</span>
          </span>
        </div>
      </div>

      <div className="border-t border-border pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
        <p className="label-caps">Pergerakan hari ini</p>
        {today !== null ? (
          <>
            <p className={cn("num mt-1 text-2xl font-semibold", trendText(today))}>
              {formatIDR(today, { signed: true })}
            </p>
            <div className="mt-2">
              <TrendPill value={todayPct}>{formatPct(todayPct)}</TrendPill>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Efek perubahan harga sesi terakhir terhadap nilai Anda. Bukan untung/rugi sejak
              pembelian.
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Menunggu data harga…</p>
        )}
      </div>

      <div className="border-t border-border pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
        <p className="label-caps">Kurs USD/IDR</p>
        {snapshot.ok ? (
          <>
            <p className="num mt-1 text-2xl font-semibold">
              {snapshot.fx.rate.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
            </p>
            <div className="mt-2">
              <TrendPill value={snapshot.fx.change}>{formatPct(snapshot.fx.changePct)}</TrendPill>
            </div>
            <p className="num mt-3 text-xs text-muted-foreground">
              Total ≈ {formatUSD(total / snapshot.fx.rate)}
              <br />
              Kurs per {formatWIB(snapshot.fx.time * 1000)}
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Kurs belum tersedia.</p>
        )}
      </div>
    </section>
  );
}
