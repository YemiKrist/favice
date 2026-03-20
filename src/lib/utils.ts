import type { InvoiceFormData, InvoiceTotals, LineItem } from "@/types";

/** Format a number as Nigerian Naira */
export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);
}

/** Format a date string (YYYY-MM-DD) to a human-readable form */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Today's date as YYYY-MM-DD */
export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

/** Add `days` to a YYYY-MM-DD string and return new YYYY-MM-DD */
export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

/** Generate a random client-side ID (not UUID v4, just collision-safe) */
export function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/** Create a blank line item */
export function blankLineItem(): LineItem {
  return { id: newId(), description: "", quantity: 1, rate: 0, amount: 0 };
}

/** Calculate invoice totals from form data */
export function calcTotals(data: Pick<InvoiceFormData, "lineItems" | "vatEnabled" | "vatPercentage" | "whtEnabled" | "whtPercentage">): InvoiceTotals {
  const subtotal = data.lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const vatAmount = data.vatEnabled ? (subtotal * data.vatPercentage) / 100 : 0;
  const whtAmount = data.whtEnabled ? (subtotal * data.whtPercentage) / 100 : 0;
  const total = subtotal + vatAmount - whtAmount;
  return { subtotal, vatAmount, whtAmount, total };
}

/** Generate an invoice number like INV-0042 from a count */
export function generateInvoiceNumber(count: number): string {
  return `INV-${String(count + 1).padStart(4, "0")}`;
}

/** Status badge colour mapping */
export const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  sent:  "bg-amber-100 text-amber-700",
  paid:  "bg-emerald-100 text-emerald-700",
};
