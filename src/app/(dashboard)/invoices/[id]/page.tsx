import { getInvoice } from "@/actions/invoices";
import { getProfile } from "@/actions/profile";
import { InvoiceCreator } from "@/components/invoice/InvoiceCreator";
import { notFound } from "next/navigation";

export const metadata = { title: "Edit Invoice — Favice" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InvoicePage({ params }: Props) {
  const { id } = await params;
  const [invoice, profile] = await Promise.all([getInvoice(id), getProfile()]);

  if (!invoice) notFound();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">
          Invoice {invoice.invoice_number}
        </h1>
        <p className="text-sm text-slate-500 mt-1">Edit invoice details below.</p>
      </div>
      <InvoiceCreator
        profile={profile}
        initialInvoiceNumber={invoice.invoice_number}
        existingInvoice={invoice}
      />
    </div>
  );
}
