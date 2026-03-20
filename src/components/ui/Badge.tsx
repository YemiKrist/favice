import type { InvoiceStatus } from "@/types";

const STYLES: Record<InvoiceStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  sent:  "bg-amber-100 text-amber-700",
  paid:  "bg-emerald-100 text-emerald-700",
};

export function Badge({ status }: { status: InvoiceStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STYLES[status]}`}>
      {status}
    </span>
  );
}
