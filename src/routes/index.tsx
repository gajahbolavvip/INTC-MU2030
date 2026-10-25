import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Info } from "lucide-react";
import { useState } from "react";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { EditHoldingsDialog } from "@/components/dashboard/EditHoldingsDialog";
import { marketQueryOptions } from "@/components/dashboard/market-query";
import { PortfolioSummary } from "@/components/dashboard/PortfolioSummary";
import { PriceChart } from "@/components/dashboard/PriceChart";
import { SimulationPanel } from "@/components/dashboard/SimulationPanel";
import { StockCard } from "@/components/dashboard/StockCard";
import { useHoldings } from "@/hooks/use-holdings";
import { DATA_SOURCE, getMarketSnapshot } from "@/lib/market.functions";
import { TICKERS, totalValue } from "@/lib/portfolio";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Portofolio Saham US — PLTR & MU" },
      {
        name: "description",
        content:
          "Dashboard pribadi untuk memantau nilai saham PLTR dan MU dalam rupiah, grafik candlestick, dan simulasi naik-turun.",
      },
      { property: "og:title", content: "Portofolio Saham US — PLTR & MU" },
      {
        property: "og:description",
        content: "Pantau harga PLTR & MU, nilai rupiah, dan simulasi perubahan portofolio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  // Loader result is sent with the page, then used as the query's starting data.
  loader: () => getMarketSnapshot(),
  component: Dashboard,
});

function Dashboard() {
  const initial = Route.useLoaderData();
  const query = useQuery({
    ...marketQueryOptions,
    initialData: initial,
    initialDataUpdatedAt: initial.fetchedAt,
  });
  const snapshot = query.data;
  const { holdings, save, reset } = useHoldings();
  const [editing, setEditing] = useState(false);
  const total = totalValue(holdings);

  const state = snapshot.ok ? snapshot.quotes.PLTR.marketState : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:py-8">
      <DashboardHeader
        snapshot={snapshot}
        isFetching={query.isFetching}
        isError={query.isError}
        onRefresh={() => void query.refetch()}
      />

      {!snapshot.ok && (
        <div className="flex items-start gap-3 rounded-md border border-down/40 bg-down-soft p-4 text-sm text-down">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>{snapshot.error} Nilai portofolio dan simulasi tetap dihitung dari nilai yang Anda isi.</p>
        </div>
      )}
      {state && state !== "REGULAR" && (
        <div className="flex items-start gap-3 rounded-md border border-border bg-panel p-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>
            Pasar saham AS sedang {state === "CLOSED" ? "tutup" : state === "PRE" ? "di sesi pra-pasar" : "di sesi pasca-pasar"}.
            Harga yang tampil adalah harga penutupan sesi reguler terakhir.
          </p>
        </div>
      )}

      <PortfolioSummary holdings={holdings} snapshot={snapshot} onEdit={() => setEditing(true)} />

      {TICKERS.map((t) => (
        <div key={t} className="grid gap-5 lg:grid-cols-[340px_1fr]">
          <StockCard
            ticker={t}
            value={holdings[t]}
            share={total ? (holdings[t] / total) * 100 : 0}
            quote={snapshot.ok ? snapshot.quotes[t] : null}
            fxRate={snapshot.ok ? snapshot.fx.rate : null}
          />
          <PriceChart ticker={t} />
        </div>
      ))}

      <SimulationPanel holdings={holdings} />

      <footer className="mt-2 space-y-1 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
        <p>
          Sumber harga & kurs: {DATA_SOURCE} (data publik gratis, bisa tertunda hingga ±15 menit;
          bukan feed real-time resmi bursa). Harga diperbarui otomatis setiap 30 detik, grafik setiap
          1 menit. Grafik oleh TradingView Lightweight Charts™.
        </p>
        <p>
          Nilai PLTR dan MU adalah nilai pasar saat ini yang Anda isi, bukan modal pembelian.
          Untung/rugi sejak pembelian tidak dihitung karena harga beli dan jumlah lembar belum ada.
        </p>
      </footer>

      <EditHoldingsDialog
        open={editing}
        onOpenChange={setEditing}
        holdings={holdings}
        onSave={save}
        onReset={reset}
      />
    </main>
  );
}
