"use client";

import { Input } from "@/components/ui/Input";
import { formatNaira } from "@/lib/utils";
import type { LineItem } from "@/types";
import { blankLineItem } from "@/lib/utils";

interface Props {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
}

export function LineItemsTable({ items, onChange }: Props) {
  function update(id: string, field: keyof LineItem, value: string | number) {
    onChange(
      items.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        updated.amount = Number(updated.quantity) * Number(updated.rate);
        return updated;
      }),
    );
  }

  function remove(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }

  function add() {
    onChange([...items, blankLineItem()]);
  }

  return (
    <div>
      {/* Desktop table header */}
      <div className="hidden sm:grid grid-cols-[1fr_80px_110px_100px_36px] gap-2 mb-1 px-1">
        {["Description", "Qty", "Rate (₦)", "Amount", ""].map((h) => (
          <span key={h} className="text-xs font-medium text-slate-400">{h}</span>
        ))}
      </div>

      {/* Rows */}
      <div className="space-y-3 sm:space-y-2">
        {items.map((item) => (
          <div key={item.id}>
            {/* Desktop row */}
            <div className="hidden sm:grid grid-cols-[1fr_80px_110px_100px_36px] gap-2 items-center">
              <Input
                placeholder="Description of work"
                value={item.description}
                onChange={(e) => update(item.id, "description", e.target.value)}
              />
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="1"
                value={item.quantity === 0 ? "" : item.quantity}
                onChange={(e) => update(item.id, "quantity", parseFloat(e.target.value) || 0)}
                className="text-right"
              />
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={item.rate === 0 ? "" : item.rate}
                onChange={(e) => update(item.id, "rate", parseFloat(e.target.value) || 0)}
                className="text-right"
              />
              <div className="px-3 py-2 text-sm font-medium text-slate-700 text-right bg-slate-50 rounded-lg border border-slate-200">
                {formatNaira(item.quantity * item.rate)}
              </div>
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="flex items-center justify-center h-11 w-11 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                aria-label="Remove item"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Mobile card layout */}
            <div className="sm:hidden bg-slate-50 rounded-lg p-3 space-y-3 border border-slate-200">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Description of work"
                    value={item.description}
                    onChange={(e) => update(item.id, "description", e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="flex items-center justify-center h-11 w-11 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                  aria-label="Remove item"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-xs text-slate-400 block mb-1">Qty</span>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="1"
                    value={item.quantity === 0 ? "" : item.quantity}
                    onChange={(e) => update(item.id, "quantity", parseFloat(e.target.value) || 0)}
                    className="text-right"
                  />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-1">Rate (₦)</span>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    value={item.rate === 0 ? "" : item.rate}
                    onChange={(e) => update(item.id, "rate", parseFloat(e.target.value) || 0)}
                    className="text-right"
                  />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-1">Amount</span>
                  <div className="px-3 py-2 text-sm font-medium text-slate-700 text-right bg-white rounded-lg border border-slate-200">
                    {formatNaira(item.quantity * item.rate)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={add}
        className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[#163258] hover:text-[#0f2240] transition-colors min-h-[44px]"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add line item
      </button>
    </div>
  );
}
