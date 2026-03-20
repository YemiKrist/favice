"use client";

import { Toggle } from "@/components/ui/Toggle";
import { Input } from "@/components/ui/Input";
import { formatNaira } from "@/lib/utils";
import type { InvoiceTotals } from "@/types";

interface Props {
  vatEnabled: boolean;
  vatPercentage: number;
  whtEnabled: boolean;
  whtPercentage: number;
  totals: InvoiceTotals;
  onVatToggle: (v: boolean) => void;
  onVatPct: (v: number) => void;
  onWhtToggle: (v: boolean) => void;
  onWhtPct: (v: number) => void;
}

export function TaxSection({
  vatEnabled, vatPercentage, whtEnabled, whtPercentage, totals,
  onVatToggle, onVatPct, onWhtToggle, onWhtPct,
}: Props) {
  return (
    <div className="space-y-4">
      {/* VAT */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Toggle checked={vatEnabled} onChange={onVatToggle} label="Enable VAT" />
          <div>
            <p className="text-sm font-medium text-slate-700">VAT</p>
            <p className="text-xs text-slate-400">Value Added Tax (added to subtotal)</p>
          </div>
        </div>
        {vatEnabled && (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={vatPercentage}
              onChange={(e) => onVatPct(parseFloat(e.target.value) || 0)}
              className="w-20 text-right"
            />
            <span className="text-sm text-slate-500">%</span>
            <span className="text-sm font-medium text-slate-700 w-24 text-right">
              + {formatNaira(totals.vatAmount)}
            </span>
          </div>
        )}
      </div>

      {/* WHT */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Toggle checked={whtEnabled} onChange={onWhtToggle} label="Enable WHT" />
          <div>
            <p className="text-sm font-medium text-slate-700">WHT</p>
            <p className="text-xs text-slate-400">Withholding Tax (deducted from subtotal)</p>
          </div>
        </div>
        {whtEnabled && (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={whtPercentage}
              onChange={(e) => onWhtPct(parseFloat(e.target.value) || 0)}
              className="w-20 text-right"
            />
            <span className="text-sm text-slate-500">%</span>
            <span className="text-sm font-medium text-slate-700 w-24 text-right">
              − {formatNaira(totals.whtAmount)}
            </span>
          </div>
        )}
      </div>

      {/* Total row */}
      <div className="border-t border-slate-200 pt-4 flex justify-between items-center">
        <span className="text-sm font-semibold text-slate-700">Total</span>
        <span className="text-lg font-bold text-[#0a1628]">{formatNaira(totals.total)}</span>
      </div>
    </div>
  );
}
