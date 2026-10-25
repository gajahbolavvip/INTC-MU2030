import { useCallback, useEffect, useState } from "react";

import { DEFAULT_HOLDINGS, type Holdings } from "@/lib/portfolio";

const STORAGE_KEY = "portfolio.holdings.v1";

/** Holdings (current market value in rupiah) saved in this browser. */
export function useHoldings() {
  const [holdings, setHoldings] = useState<Holdings>(DEFAULT_HOLDINGS);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<Holdings>;
      if (typeof parsed.PLTR === "number" && typeof parsed.MU === "number") {
        setHoldings({ PLTR: parsed.PLTR, MU: parsed.MU });
      }
    } catch {
      // ignore corrupt storage
    }
  }, []);

  const save = useCallback((next: Holdings) => {
    setHoldings(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const reset = useCallback(() => {
    setHoldings(DEFAULT_HOLDINGS);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { holdings, save, reset };
}
