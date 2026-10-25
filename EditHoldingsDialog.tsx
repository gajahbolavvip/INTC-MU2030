import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TICKERS, TICKER_NAMES, parseIDRInput, type Holdings } from "@/lib/portfolio";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holdings: Holdings;
  onSave: (h: Holdings) => void;
  onReset: () => void;
}

const toInput = (n: number) => Math.round(n).toLocaleString("id-ID");

export function EditHoldingsDialog({ open, onOpenChange, holdings, onSave, onReset }: Props) {
  const [values, setValues] = useState({ PLTR: "", MU: "" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValues({ PLTR: toInput(holdings.PLTR), MU: toInput(holdings.MU) });
      setError(null);
    }
  }, [open, holdings]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const pltr = parseIDRInput(values.PLTR);
    const mu = parseIDRInput(values.MU);
    if (pltr === null || mu === null || pltr < 0 || mu < 0) {
      setError("Masukkan angka rupiah yang valid, contoh 41.540.507");
      return;
    }
    onSave({ PLTR: pltr, MU: mu });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-popover">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Nilai pasar saat ini</DialogTitle>
            <DialogDescription>
              Isi nilai pasar saham Anda sekarang (bukan modal awal). Disimpan di browser ini.
            </DialogDescription>
          </DialogHeader>
          <div className="my-5 grid gap-4">
            {TICKERS.map((t) => (
              <div key={t} className="grid gap-1.5">
                <Label htmlFor={`h-${t}`}>
                  <span className="num">{t}</span>{" "}
                  <span className="text-muted-foreground">— {TICKER_NAMES[t]}</span>
                </Label>
                <div className="flex items-center gap-2">
                  <span className="num text-sm text-muted-foreground">Rp</span>
                  <Input
                    id={`h-${t}`}
                    inputMode="numeric"
                    value={values[t]}
                    onChange={(e) => setValues((v) => ({ ...v, [t]: e.target.value }))}
                    className="num bg-panel-raised"
                  />
                </div>
              </div>
            ))}
            {error && <p className="text-sm text-down">{error}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                onReset();
                onOpenChange(false);
              }}
            >
              Kembalikan default
            </Button>
            <Button type="submit">Simpan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
