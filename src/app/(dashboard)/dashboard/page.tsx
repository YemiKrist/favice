import Link from "next/link";
import { getInvoices, getInvoiceSummary } from "@/actions/invoices";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { InvoiceTable } from "@/components/dashboard/InvoiceTable";
import { Button } from "@/components/ui/Button";

export const metadata = { title: "Dashboard — Favice" };

export default async function DashboardPage() {
  const [invoices, summary] = await Promise.all([getInvoices(), getInvoiceSummary()]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Overview of your invoices</p>
        </div>
        <Link href="/invoices/new">
          <Button size="md">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Invoice
          </Button>
        </Link>
      </div>

      <SummaryCards {...summary} />

      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">All Invoices</h2>
        <InvoiceTable invoices={invoices} />
      </div>
    </div>
  );
}
