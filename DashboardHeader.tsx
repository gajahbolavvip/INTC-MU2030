import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { MarketSnapshot } from "@/lib/market.functions";
import { formatWIB } from "@/lib/time-format";
import { cn } from "@/lib/utils";

const STATE_LABEL = {
  REGULAR: "Pasar AS Buka",
  PRE: "Pra-pasar",
  POST: "Pasca-pasar",
  CLOSED: "Pasar AS Tutup",
} as const;

interface Props {
  snapshot: MarketSnapshot;
  isFetching: boolean;
  isError: boolean;
  onRefresh: () => void;
}

export function DashboardHeader({ snapshot, isFetching, isError, onRefresh }: Props) {
  const connected = snapshot.ok && !isError;
  const state = snapshot.ok ? snapshot.quotes.PLTR.marketState : null;
  const open = state === "REGULAR";

  return (
    <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="label-caps">Portofolio Pribadi · US Equities</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          PLTR <span className="text-muted-foreground">/</span> MU{" "}
          <span className="text-primary">Terminal</span>
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {state && (
          <span
            className={cn(
              "num inline-flex items-center gap-2 rounded border px-2.5 py-1 text-xs",
              open ? "border-up/40 bg-up-soft text-up" : "border-border bg-panel text-muted-foreground",
            )}
          >
            <span
              className={cn("size-1.5 rounded-full", open ? "animate-live bg-up" : "bg-muted-foreground")}
            />
            {STATE_LABEL[state]}
          </span>
        )}
        <span
          className={cn(
            "num inline-flex items-center gap-2 rounded border px-2.5 py-1 text-xs",
            connected ? "border-border bg-panel text-foreground" : "border-down/40 bg-down-soft text-down",
          )}
          title="Status koneksi ke penyedia data"
        >
          <span className={cn("size-1.5 rounded-full", connected ? "bg-up" : "bg-down")} />
          {connected ? "API terhubung" : "API terputus"}
        </span>
        <span className="num hidden text-xs text-muted-foreground md:inline">
          Diperbarui {formatWIB(snapshot.fetchedAt)}
        </span>
        <Button
          variant="terminal"
          size="sm"
          onClick={onRefresh}
          disabled={isFetching}
          aria-label="Perbarui data"
        >
          <RefreshCw className={cn(isFetching && "animate-spin")} />
          <span className="hidden sm:inline">Perbarui</span>
        </Button>
      </div>
      <span className="num text-xs text-muted-foreground md:hidden">
        Diperbarui {formatWIB(snapshot.fetchedAt)}
      </span>
    </header>
  );
}
