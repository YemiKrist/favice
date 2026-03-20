import { getProfile } from "@/actions/profile";
import { getNextInvoiceNumber } from "@/actions/invoices";
import { InvoiceCreator } from "@/components/invoice/InvoiceCreator";

export const metadata = { title: "New Invoice — Favice" };

export default async function NewInvoicePage() {
  const [profile, invoiceNumber] = await Promise.all([
    getProfile(),
    getNextInvoiceNumber(),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">New Invoice</h1>
        <p className="text-sm text-slate-500 mt-1">Fill in the details — the preview updates in real time.</p>
      </div>
      <InvoiceCreator profile={profile} initialInvoiceNumber={invoiceNumber} />
    </div>
  );
}
