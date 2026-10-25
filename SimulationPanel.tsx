import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SIMULATION_STEPS,
  formatIDR,
  formatPct,
  simulate,
  totalValue,
  type Holdings,
} from "@/lib/portfolio";
import { cn } from "@/lib/utils";

import { trendBg, trendText } from "./Trend";

type Target = "PLTR" | "MU" | "TOTAL";

export function SimulationPanel({ holdings }: { holdings: Holdings }) {
  const [target, setTarget] = useState<Target>("TOTAL");
  const [custom, setCustom] = useState("3");
  const base = target === "TOTAL" ? totalValue(holdings) : holdings[target];
  const customPct = Number(custom.replace(",", "."));
  const customRow = Number.isFinite(customPct) && custom.trim() !== "" ? simulate(base, customPct) : null;

  return (
    <section className="panel p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="label-caps">Simulasi naik / turun</p>
          <h2 className="mt-1 text-lg font-semibold">Jika harga bergerak…</h2>
        </div>
        <Tabs value={target} onValueChange={(v) => setTarget(v as Target)}>
          <TabsList className="bg-panel-raised">
            <TabsTrigger value="PLTR" className="num">PLTR</TabsTrigger>
            <TabsTrigger value="MU" className="num">MU</TabsTrigger>
            <TabsTrigger value="TOTAL" className="num">Total</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <p className="num mt-4 text-sm text-muted-foreground">
        Nilai sebelum perubahan: <span className="text-foreground">{formatIDR(base)}</span>
      </p>

      <div className="mt-3 overflow-hidden rounded-md border border-border">
        <table className="num w-full text-sm">
          <thead className="bg-panel-raised text-left">
            <tr className="label-caps">
              <th className="px-3 py-2 font-normal">Gerak</th>
              <th className="hidden px-3 py-2 text-right font-normal sm:table-cell">Sebelum</th>
              <th className="px-3 py-2 text-right font-normal">Naik / Turun</th>
              <th className="px-3 py-2 text-right font-normal">Setelah</th>
            </tr>
          </thead>
          <tbody>
            {SIMULATION_STEPS.map((pct) => {
              const row = simulate(base, pct);
              return (
                <tr
                  key={pct}
                  className={cn("border-t border-border", pct === 0 && "bg-panel-raised/60")}
                >
                  <td className="px-3 py-2">
                    <span className={cn("rounded px-1.5 py-0.5 text-xs", trendBg(pct))}>
                      {formatPct(pct)}
                    </span>
                  </td>
                  <td className="hidden px-3 py-2 text-right text-muted-foreground sm:table-cell">
                    {formatIDR(row.before)}
                  </td>
                  <td className={cn("px-3 py-2 text-right", trendText(row.delta))}>
                    {formatIDR(row.delta, { signed: true })}
                  </td>
                  <td className="px-3 py-2 text-right">{formatIDR(row.after)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-md border border-dashed border-border p-3 sm:flex-row sm:items-center">
        <label htmlFor="custom-pct" className="label-caps shrink-0">
          Persentase sendiri
        </label>
        <div className="flex items-center gap-2">
          <Input
            id="custom-pct"
            inputMode="decimal"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            className="num h-8 w-24 bg-panel-raised"
          />
          <span className="text-muted-foreground">%</span>
        </div>
        {customRow && (
          <p className="num text-sm sm:ml-auto">
            <span className={trendText(customRow.delta)}>
              {formatIDR(customRow.delta, { signed: true })}
            </span>
            <span className="text-muted-foreground"> → </span>
            {formatIDR(customRow.after)}
          </p>
        )}
      </div>
    </section>
  );
}
