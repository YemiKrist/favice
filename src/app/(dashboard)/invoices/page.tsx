import Link from "next/link";
import { getInvoicesByStatus } from "@/actions/invoices";
import { InvoiceTable } from "@/components/dashboard/InvoiceTable";
import { Button } from "@/components/ui/Button";
import type { InvoiceStatus } from "@/types";

export const metadata = { title: "Invoices — Favice" };

interface Props {
  searchParams?: Promise<{ status?: string }>;
}

function isInvoiceStatus(value?: string): value is InvoiceStatus {
  return value === "draft" || value === "sent" || value === "paid";
}

export default async function InvoicesPage({ searchParams }: Props) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const status = isInvoiceStatus(resolvedSearchParams?.status)
    ? resolvedSearchParams.status
    : undefined;
  const invoices = await getInvoicesByStatus(status);
  const heading = status ? `${status[0].toUpperCase()}${status.slice(1)} Invoices` : "Invoices";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{heading}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{invoices.length} invoice{invoices.length !== 1 ? "s" : ""} total</p>
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

      <InvoiceTable invoices={invoices} initialFilter={status ?? "all"} />
    </div>
  );
}
