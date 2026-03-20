"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatNaira, formatDate } from "@/lib/utils";
import { updateInvoiceStatus, deleteInvoice } from "@/actions/invoices";
import type { Invoice, InvoiceStatus } from "@/types";

const STATUSES: { value: InvoiceStatus | "all"; label: string }[] = [
  { value: "all",   label: "All"    },
  { value: "draft", label: "Draft"  },
  { value: "sent",  label: "Sent"   },
  { value: "paid",  label: "Paid"   },
];

export function InvoiceTable({
  invoices: initial,
  initialFilter = "all",
}: {
  invoices: Invoice[];
  initialFilter?: InvoiceStatus | "all";
}) {
  const [invoices, setInvoices]   = useState(initial);
  const [filter, setFilter]       = useState<InvoiceStatus | "all">(initialFilter);
  const [, startTransition]       = useTransition();

  const visible = filter === "all" ? invoices : invoices.filter((i) => i.status === filter);

  function handleStatusChange(id: string, status: InvoiceStatus) {
    setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    startTransition(async () => { await updateInvoiceStatus(id, status); });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this invoice? This cannot be undone.")) return;
    setInvoices((prev) => prev.filter((i) => i.id !== id));
    startTransition(async () => { await deleteInvoice(id); });
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {STATUSES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors min-h-[44px] whitespace-nowrap
              ${filter === value
                ? "bg-[#0f2240] text-white"
                : "text-slate-500 hover:bg-slate-100"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {visible.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            No invoices found.{" "}
            <Link href="/invoices/new" className="text-[#163258] font-medium hover:underline">
              Create one
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {["Invoice #", "Client", "Date", "Amount", "Status", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="font-medium text-[#163258] hover:underline"
                        >
                          {inv.invoice_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{inv.client_name}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(inv.invoice_date)}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{formatNaira(Number(inv.total))}</td>
                      <td className="px-4 py-3">
                        <Badge status={inv.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {inv.status === "draft" && (
                            <button
                              onClick={() => handleStatusChange(inv.id, "sent")}
                              className="text-xs text-amber-600 hover:text-amber-800 font-medium"
                            >
                              Mark sent
                            </button>
                          )}
                          {inv.status === "sent" && (
                            <button
                              onClick={() => handleStatusChange(inv.id, "paid")}
                              className="text-xs text-emerald-600 hover:text-emerald-800 font-medium"
                            >
                              Mark paid
                            </button>
                          )}
                          <Link
                            href={`/invoices/${inv.id}`}
                            className="text-xs text-slate-400 hover:text-slate-700"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(inv.id)}
                            className="text-xs text-slate-400 hover:text-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-slate-100">
              {visible.map((inv) => (
                <div key={inv.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="font-medium text-[#163258] hover:underline text-sm"
                      >
                        {inv.invoice_number}
                      </Link>
                      <p className="text-sm text-slate-700 truncate">{inv.client_name}</p>
                    </div>
                    <Badge status={inv.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{formatDate(inv.invoice_date)}</span>
                    <span className="font-semibold text-slate-900 text-sm">{formatNaira(Number(inv.total))}</span>
                  </div>
                  <div className="flex items-center gap-4 pt-1">
                    {inv.status === "draft" && (
                      <button
                        onClick={() => handleStatusChange(inv.id, "sent")}
                        className="text-xs text-amber-600 hover:text-amber-800 font-medium min-h-[44px] flex items-center"
                      >
                        Mark sent
                      </button>
                    )}
                    {inv.status === "sent" && (
                      <button
                        onClick={() => handleStatusChange(inv.id, "paid")}
                        className="text-xs text-emerald-600 hover:text-emerald-800 font-medium min-h-[44px] flex items-center"
                      >
                        Mark paid
                      </button>
                    )}
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="text-xs text-slate-400 hover:text-slate-700 min-h-[44px] flex items-center"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(inv.id)}
                      className="text-xs text-slate-400 hover:text-red-600 transition-colors min-h-[44px] flex items-center"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
