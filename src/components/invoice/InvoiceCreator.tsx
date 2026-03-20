"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { LineItemsTable } from "@/components/invoice/LineItemsTable";
import { TaxSection } from "@/components/invoice/TaxSection";
import { InvoicePreview } from "@/components/invoice/InvoicePreview";
import { saveInvoice } from "@/actions/invoices";
import { calcTotals, blankLineItem, todayISO, addDays } from "@/lib/utils";
import type { InvoiceFormData, Profile, InvoiceStatus, Invoice } from "@/types";

interface Props {
  profile: Profile | null;
  initialInvoiceNumber: string;
  existingInvoice?: Invoice;
}

function invoiceToForm(inv: Invoice): InvoiceFormData {
  return {
    invoiceNumber: inv.invoice_number,
    invoiceDate:   inv.invoice_date,
    dueDate:       inv.due_date ?? "",
    clientName:    inv.client_name,
    clientAddress: inv.client_address ?? "",
    clientEmail:   inv.client_email ?? "",
    lineItems:     (inv.line_items ?? []).map((li) => ({
      id:          li.id,
      description: li.description,
      quantity:    Number(li.quantity),
      rate:        Number(li.rate),
      amount:      Number(li.quantity) * Number(li.rate),
    })),
    vatEnabled:    inv.vat_enabled,
    vatPercentage: Number(inv.vat_percentage),
    whtEnabled:    inv.wht_enabled,
    whtPercentage: Number(inv.wht_percentage),
    bankName:      inv.bank_name ?? "",
    accountName:   inv.account_name ?? "",
    accountNumber: inv.account_number ?? "",
    notes:         inv.notes ?? "",
  };
}

export function InvoiceCreator({ profile, initialInvoiceNumber, existingInvoice }: Props) {
  const router = useRouter();
  const today = todayISO();

  const [form, setForm] = useState<InvoiceFormData>(() =>
    existingInvoice
      ? invoiceToForm(existingInvoice)
      : {
          invoiceNumber: initialInvoiceNumber,
          invoiceDate:   today,
          dueDate:       addDays(today, 30),
          clientName:    "",
          clientAddress: "",
          clientEmail:   "",
          lineItems:     [blankLineItem()],
          vatEnabled:    false,
          vatPercentage: 7.5,
          whtEnabled:    false,
          whtPercentage: 5,
          bankName:      profile?.bank_name ?? "",
          accountName:   profile?.account_name ?? "",
          accountNumber: profile?.bank_account_number ?? "",
          notes:         "Payment due within 30 days of invoice date.",
        },
  );

  const [saving, setSaving]   = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const totals = calcTotals(form);

  function set<K extends keyof InvoiceFormData>(key: K, value: InvoiceFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(status: InvoiceStatus = "draft") {
    setSaving(true);
    setSaveMsg("");
    const result = await saveInvoice(form, status, existingInvoice?.id);
    setSaving(false);
    if (result.success) {
      setSaveMsg(status === "draft" ? "Saved as draft." : "Invoice saved.");
      if (!existingInvoice && result.id) {
        router.push(status === "draft" ? "/invoices?status=draft" : `/invoices/${result.id}`);
      } else {
        router.refresh();
      }
    } else {
      setSaveMsg(result.error ?? "Save failed.");
    }
  }

  async function handleDownloadPDF() {
    // On mobile, ensure preview is visible for capture
    const wasClosed = !showPreview;
    if (wasClosed) setShowPreview(true);
    // Wait for render
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    setDownloadingPdf(true);
    setSaveMsg("");

    try {
      const previewEl = document.getElementById("invoice-preview");
      if (!previewEl) {
        throw new Error("Invoice preview not found.");
      }

      const [{ toPng }, { jsPDF }] = await Promise.all([
        import("html-to-image"),
        import("jspdf"),
      ]);

      // Strip decorative styles so the PDF has no border/shadow
      const el = previewEl as HTMLElement;
      const prev = { border: el.style.border, boxShadow: el.style.boxShadow, borderRadius: el.style.borderRadius };
      el.style.border = "none";
      el.style.boxShadow = "none";
      el.style.borderRadius = "0";

      // Pre-fetch all images as base64 data URLs so CORS doesn't block them in the canvas
      const imgEls = Array.from(el.querySelectorAll<HTMLImageElement>("img"));
      const origSrcs = imgEls.map((img) => img.src);
      await Promise.all(
        imgEls.map(async (img) => {
          try {
            const currentSrc = img.src;
            if (currentSrc.startsWith("data:")) return; // already a data URL
            const res = await fetch(currentSrc, { cache: "force-cache" });
            const blob = await res.blob();
            const dataUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            img.src = dataUrl;
          } catch { /* leave original src if fetch fails */ }
        }),
      );

      // Wait for all images to be fully loaded after src changes
      await Promise.all(
        imgEls.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((r) => { img.onload = () => r(); img.onerror = () => r(); }),
        ),
      );
      // Extra frame to ensure browser has painted the images
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      // Render at 3× CSS size so the browser draws text at higher resolution
      const captureScale = 3;

      // First pass warms up html-to-image's internal caches (images, fonts)
      await toPng(el, { pixelRatio: 1, backgroundColor: "#ffffff" }).catch(() => {});

      // Second pass produces the sharp capture
      const imageData = await toPng(el, {
        pixelRatio: 1,
        backgroundColor: "#ffffff",
        width: el.offsetWidth * captureScale,
        height: el.offsetHeight * captureScale,
        style: {
          transform: `scale(${captureScale})`,
          transformOrigin: "top left",
        },
      });

      // Restore styles and image srcs
      el.style.border = prev.border;
      el.style.boxShadow = prev.boxShadow;
      el.style.borderRadius = prev.borderRadius;
      imgEls.forEach((img, i) => { img.src = origSrcs[i]; });

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth  = pdf.internal.pageSize.getWidth();   // 210mm
      const pageHeight = pdf.internal.pageSize.getHeight();  // 297mm
      const margin = 12;
      const maxW = pageWidth  - margin * 2;
      const maxH = pageHeight - margin * 2;

      // Measure rendered image
      const img = await new Promise<HTMLImageElement>((resolve) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.src = imageData;
      });

      // Scale to fit entirely on one page (shrink only, never enlarge)
      const scaleW = maxW / img.naturalWidth;
      const scaleH = maxH / img.naturalHeight;
      const scale  = Math.min(scaleW, scaleH);
      const drawW  = img.naturalWidth  * scale;
      const drawH  = img.naturalHeight * scale;
      const offsetX = margin + (maxW - drawW) / 2;
      const offsetY = margin;

      pdf.addImage(imageData, "PNG", offsetX, offsetY, drawW, drawH);

      const filename = `${(form.invoiceNumber || "invoice").trim().replace(/\s+/g, "-").toLowerCase()}.pdf`;
      pdf.save(filename);
      setSaveMsg("PDF downloaded.");
    } catch (error) {
      setSaveMsg(error instanceof Error ? error.message : "PDF download failed.");
    } finally {
      setDownloadingPdf(false);
      if (wasClosed) setShowPreview(false);
    }
  }

  const previewPanel = (
    <div>
      {/* Panel header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Live Preview</p>
        {/* Close button — mobile only */}
        <button
          type="button"
          onClick={() => setShowPreview(false)}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close preview"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {/* Document-on-desk wrapper — grey background matches Figma context */}
      <div
        className="rounded-xl overflow-y-auto"
        style={{
          backgroundColor: "#e5e5e5",
          padding: "24px",
          maxHeight: "calc(100vh - 7rem)",
        }}
      >
        <InvoicePreview data={form} totals={totals} profile={profile} />
      </div>
    </div>
  );

  return (
    <div>
      {/* Mobile preview toggle button */}
      <button
        type="button"
        onClick={() => setShowPreview(!showPreview)}
        className="md:hidden w-full mb-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-[#0f2240] hover:bg-slate-50 transition-colors min-h-[44px]"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          {showPreview ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          )}
        </svg>
        {showPreview ? "Close Preview" : "Preview Invoice"}
      </button>

      {/* Mobile preview overlay */}
      {showPreview && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-50 overflow-y-auto p-4 pt-2">
          {/* Close bar */}
          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close preview"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {previewPanel}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

        {/* ── LEFT: Form ──────────────────────────────────────────────────────── */}
        <div className="space-y-4 min-w-0 overflow-hidden">

          {/* Invoice Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Invoice Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Invoice number</Label>
                <Input
                  value={form.invoiceNumber}
                  onChange={(e) => set("invoiceNumber", e.target.value)}
                  placeholder="INV-0001"
                />
              </div>
              <div>
                <Label>Invoice date</Label>
                <Input type="date" value={form.invoiceDate} onChange={(e) => set("invoiceDate", e.target.value)} />
              </div>
              <div>
                <Label>Due date</Label>
                <Input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Client Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Client Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Client name *</Label>
                <Input
                  value={form.clientName}
                  onChange={(e) => set("clientName", e.target.value)}
                  placeholder="Client Company Ltd."
                />
              </div>
              <div>
                <Label>Client email (optional)</Label>
                <Input
                  type="email"
                  value={form.clientEmail}
                  onChange={(e) => set("clientEmail", e.target.value)}
                  placeholder="client@company.com"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Client address</Label>
                <Input
                  value={form.clientAddress}
                  onChange={(e) => set("clientAddress", e.target.value)}
                  placeholder="123 Client Street, Lagos"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Line Items</h2>
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
              <LineItemsTable
                items={form.lineItems}
                onChange={(items) => set("lineItems", items)}
              />
            </div>
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <div className="flex items-center gap-6 text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-semibold text-slate-900 w-32 text-right tabular-nums">
                  {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(totals.subtotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Tax */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-4">Tax</h2>
            <TaxSection
              vatEnabled={form.vatEnabled}
              vatPercentage={form.vatPercentage}
              whtEnabled={form.whtEnabled}
              whtPercentage={form.whtPercentage}
              totals={totals}
              onVatToggle={(v) => set("vatEnabled", v)}
              onVatPct={(v) => set("vatPercentage", v)}
              onWhtToggle={(v) => set("whtEnabled", v)}
              onWhtPct={(v) => set("whtPercentage", v)}
            />
          </div>

          {/* Payment Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Payment Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Bank name</Label>
                <Input value={form.bankName} onChange={(e) => set("bankName", e.target.value)} placeholder="Zenith Bank" />
              </div>
              <div>
                <Label>Account name</Label>
                <Input value={form.accountName} onChange={(e) => set("accountName", e.target.value)} placeholder="Your Company" />
              </div>
              <div>
                <Label>Account number</Label>
                <Input value={form.accountNumber} onChange={(e) => set("accountNumber", e.target.value)} placeholder="0123456789" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6 space-y-2">
            <Label htmlFor="notes">Notes / Payment terms (optional)</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Payment due within 30 days of invoice date."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
            <Button onClick={() => handleSave("draft")} loading={saving} variant="secondary" className="min-h-[44px]">
              Save as draft
            </Button>
            <Button onClick={() => handleSave("sent")} loading={saving} className="min-h-[44px]">
              Save & Mark as sent
            </Button>
            <Button onClick={handleDownloadPDF} loading={downloadingPdf} variant="secondary" className="min-h-[44px]">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </Button>
            {saveMsg && (
              <span className={`text-sm text-center sm:text-left ${saveMsg.includes("fail") || saveMsg.includes("error") ? "text-red-500" : "text-emerald-600"}`}>
                {saveMsg}
              </span>
            )}
          </div>

        </div>

        {/* ── RIGHT: Preview (desktop only) ───────────────────────────────────── */}
        <div className="hidden md:block sticky top-6">
          {previewPanel}
        </div>

      </div>
    </div>
  );
}
