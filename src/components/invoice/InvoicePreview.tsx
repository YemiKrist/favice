// ─────────────────────────────────────────────────────────────────────────────
// InvoicePreview — Figma-matched UI, print/PDF hardened
// All spacing via explicit margin/padding (no flex/grid gap).
// All borders via inline styles (no Tailwind border utilities).
// overflow:hidden removed from root so content is never clipped in PDF.
// ─────────────────────────────────────────────────────────────────────────────
import { formatNaira, formatDate } from "@/lib/utils";
import type { InvoiceFormData, Profile, InvoiceTotals } from "@/types";
import { TrimmedLogo } from "@/components/ui/TrimmedLogo";

interface Props {
  data: InvoiceFormData;
  totals: InvoiceTotals;
  profile: Profile | null;
  status?: string;
}

function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
};

// ── Shared inline style tokens ────────────────────────────────────────────────
const font = "'Inter','Helvetica Neue',Arial,sans-serif";

export function InvoicePreview({ data, totals, profile, status }: Props) {
  return (
    <div
      id="invoice-preview"
      style={{
        fontFamily: font,
        backgroundColor: "#ffffff",
        borderRadius: 16,
        // No overflow:hidden — prevents PDF content clipping
        boxShadow: "0px 4px 40px 0px rgba(0,0,0,0.10)",
        width: "100%",
      }}
    >

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "60px 48px 28px",
          borderBottom: "1px solid #eeeeee",
        }}
      >
        {/* Left: logo/initials + company info — plain block flow so all children share the same left edge */}
        <div style={{ textAlign: "left" }}>
          {/* Logo or initials */}
          {profile?.logo_url ? (
            <TrimmedLogo
              src={profile.logo_url}
              alt="Logo"
              maxWidth={128}
              maxHeight={64}
              style={{ margin: "0 0 14px 0", padding: 0 }}
            />
          ) : (
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 12,
                backgroundColor: "#f0f0f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 0 12px 0",
              }}
            >
              <span style={{ color: "#111", fontWeight: 700, fontSize: 28, letterSpacing: -1 }}>
                {initials(profile?.company_name)}
              </span>
            </div>
          )}

          {/* Company name */}
          <p style={{ color: "#111", fontWeight: 600, fontSize: 15, letterSpacing: -0.2, margin: 0, padding: 0 }}>
            {profile?.company_name || "Your Company"}
          </p>

          {/* Contact lines */}
          <div style={{ marginTop: 4 }}>
            {profile?.company_address && (
              <p style={{ color: "#888", fontSize: 11.5, lineHeight: "19.5px", margin: 0 }}>
                {profile.company_address}
              </p>
            )}
            {profile?.company_email && (
              <p style={{ color: "#888", fontSize: 11.5, lineHeight: "19.5px", margin: 0 }}>
                {profile.company_email}
              </p>
            )}
            {profile?.company_phone && (
              <p style={{ color: "#888", fontSize: 11.5, lineHeight: "19.5px", margin: 0 }}>
                {profile.company_phone}
              </p>
            )}
          </div>
        </div>

        {/* Right: INVOICE + badge + dates — marginBottom replaces gap */}
        <div style={{ textAlign: "right" }}>
          <p style={{ color: "#111", fontWeight: 500, fontSize: 34, letterSpacing: -1.5, margin: 0, marginBottom: 8 }}>
            INVOICE
          </p>
          <div style={{ marginBottom: 8 }}>
            <span
              style={{
                display: "inline-block",
                backgroundColor: "#f0f0f0",
                color: "#555",
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                padding: "3px 10px",
                borderRadius: 20,
              }}
            >
              {data.invoiceNumber || "INV-0001"}
            </span>
          </div>
          <div style={{ color: "#444", fontSize: 11.5, lineHeight: "20.7px" }}>
            <p style={{ margin: 0 }}>
              <span style={{ fontWeight: 500 }}>Date:</span>{" "}
              <span style={{ color: "#888" }}>{formatDate(data.invoiceDate)}</span>
            </p>
            {data.dueDate && (
              <p style={{ margin: 0 }}>
                <span style={{ fontWeight: 500 }}>Due:</span>{" "}
                <span style={{ color: "#888" }}>{formatDate(data.dueDate)}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Dark accent divider */}
      <div style={{ height: 1, backgroundColor: "#333333" }} />

      {/* ── BODY ───────────────────────────────────────────────────────────── */}
      <div style={{ padding: "0 48px" }}>

        {/* BILL TO + status badge */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            paddingTop: 40,
            marginBottom: 28,
          }}
        >
          <div>
            <p
              style={{
                color: "#aaaaaa",
                fontWeight: 700,
                fontSize: 9.5,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                margin: 0,
                marginBottom: 8,
              }}
            >
              Bill To
            </p>
            <p style={{ color: "#111", fontWeight: 600, fontSize: 16, margin: 0, marginBottom: 4 }}>
              {data.clientName || "Client Name"}
            </p>
            {data.clientAddress && (
              <p style={{ color: "#777", fontSize: 12, lineHeight: "20.4px", margin: 0 }}>
                {data.clientAddress}
              </p>
            )}
            {data.clientEmail && (
              <p style={{ color: "#777", fontSize: 12, lineHeight: "20.4px", margin: 0 }}>
                {data.clientEmail}
              </p>
            )}
          </div>

          {status && (
            <span
              style={{
                display: "inline-block",
                backgroundColor: "#f4f4f4",
                border: "1px solid #dddddd",
                color: "#444",
                fontWeight: 700,
                fontSize: 10.5,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                padding: "5px 13px",
                borderRadius: 20,
                flexShrink: 0,
              }}
            >
              {STATUS_LABEL[status] ?? status}
            </span>
          )}
        </div>

        {/* Thin separator */}
        <div style={{ height: 1, backgroundColor: "#eeeeee", marginBottom: 24 }} />

        {/* ── LINE ITEMS TABLE ─────────────────────────────────────────────── */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: 24,
          }}
        >
          <colgroup>
            <col style={{ width: "37%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "25%" }} />
            <col style={{ width: "25%" }} />
          </colgroup>
          <thead>
            <tr>
              <th
                style={{
                  backgroundColor: "#f7f7f7",
                  color: "#aaaaaa",
                  fontWeight: 700,
                  fontSize: 10,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  textAlign: "left",
                  padding: "10px 14px",
                  borderRadius: "8px 0 0 8px",
                }}
              >
                Description
              </th>
              <th
                style={{
                  backgroundColor: "#f7f7f7",
                  color: "#aaaaaa",
                  fontWeight: 700,
                  fontSize: 10,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  textAlign: "right",
                  padding: "10px 14px",
                }}
              >
                Qty
              </th>
              <th
                style={{
                  backgroundColor: "#f7f7f7",
                  color: "#aaaaaa",
                  fontWeight: 700,
                  fontSize: 10,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  textAlign: "right",
                  padding: "10px 14px",
                }}
              >
                Rate
              </th>
              <th
                style={{
                  backgroundColor: "#f7f7f7",
                  color: "#aaaaaa",
                  fontWeight: 700,
                  fontSize: 10,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  textAlign: "right",
                  padding: "10px 14px",
                  borderRadius: "0 8px 8px 0",
                }}
              >
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {data.lineItems.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={{ textAlign: "center", color: "#cccccc", fontSize: 12, padding: "20px 14px" }}
                >
                  No items added yet
                </td>
              </tr>
            ) : (
              data.lineItems.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ color: "#222", fontSize: 12.5, padding: "14px 14px" }}>
                    {item.description || "—"}
                  </td>
                  <td style={{ color: "#444", fontSize: 12.5, padding: "14px 14px", textAlign: "right" }}>
                    {item.quantity}
                  </td>
                  <td style={{ color: "#444", fontSize: 12.5, padding: "14px 14px", textAlign: "right" }}>
                    {formatNaira(item.rate)}
                  </td>
                  <td style={{ color: "#111", fontWeight: 600, fontSize: 12.5, padding: "14px 14px", textAlign: "right" }}>
                    {formatNaira(item.quantity * item.rate)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* ── TOTALS BLOCK ─────────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 32 }}>
          <div
            style={{
              width: 260,
              backgroundColor: "#f7f7f7",
              borderRadius: 12,
              padding: "18px 20px",
            }}
          >
            {/* Subtotal */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ color: "#777", fontSize: 12.5 }}>Subtotal</span>
              <span style={{ color: "#444", fontSize: 12.5 }}>{formatNaira(totals.subtotal)}</span>
            </div>

            {/* VAT */}
            {data.vatEnabled && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ color: "#777", fontSize: 12.5 }}>VAT ({data.vatPercentage}%)</span>
                <span style={{ color: "#444", fontSize: 12.5 }}>+ {formatNaira(totals.vatAmount)}</span>
              </div>
            )}

            {/* WHT */}
            {data.whtEnabled && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ color: "#777", fontSize: 12.5 }}>WHT ({data.whtPercentage}%)</span>
                <span style={{ color: "#444", fontSize: 12.5 }}>− {formatNaira(totals.whtAmount)}</span>
              </div>
            )}

            {/* Divider */}
            <div style={{ height: 1, backgroundColor: "#e0e0e0", marginBottom: 10 }} />

            {/* Total */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#111", fontWeight: 600, fontSize: 13 }}>Total</span>
              <span style={{ color: "#111", fontWeight: 600, fontSize: 18, letterSpacing: -0.5 }}>
                {formatNaira(totals.total)}
              </span>
            </div>
          </div>
        </div>

        {/* ── PAYMENT DETAILS + NOTES ──────────────────────────────────────── */}
        {/* flex instead of grid — explicit widths + marginRight replace gap */}
        <div style={{ display: "flex", alignItems: "stretch", marginBottom: 40 }}>

          {/* Payment Details */}
          <div
            style={{
              width: "calc(50% - 10px)",
              marginRight: 20,
              backgroundColor: "#f7f7f7",
              border: "1px solid #e8e8e8",
              borderRadius: 12,
              padding: "18px 20px",
            }}
          >
            <p
              style={{
                color: "#aaaaaa",
                fontWeight: 700,
                fontSize: 9.5,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                margin: 0,
                marginBottom: 16,
              }}
            >
              Payment Details
            </p>
            {data.bankName && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ color: "#aaa", fontWeight: 700, fontSize: 9.5, letterSpacing: 1, textTransform: "uppercase", margin: 0, marginBottom: 2 }}>
                  Bank
                </p>
                <p style={{ color: "#222", fontWeight: 600, fontSize: 12.5, margin: 0 }}>{data.bankName}</p>
              </div>
            )}
            {data.accountName && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ color: "#aaa", fontWeight: 700, fontSize: 9.5, letterSpacing: 1, textTransform: "uppercase", margin: 0, marginBottom: 2 }}>
                  Account Name
                </p>
                <p style={{ color: "#222", fontWeight: 600, fontSize: 12.5, margin: 0 }}>{data.accountName}</p>
              </div>
            )}
            {data.accountNumber && (
              <div>
                <p style={{ color: "#aaa", fontWeight: 700, fontSize: 9.5, letterSpacing: 1, textTransform: "uppercase", margin: 0, marginBottom: 2 }}>
                  Account Number
                </p>
                <p style={{ color: "#222", fontWeight: 600, fontSize: 12.5, margin: 0 }}>{data.accountNumber}</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div
            style={{
              width: "calc(50% - 10px)",
              backgroundColor: "#f7f7f7",
              border: "1px solid #e8e8e8",
              borderRadius: 12,
              padding: "18px 21px",
            }}
          >
            <p
              style={{
                color: "#aaaaaa",
                fontWeight: 700,
                fontSize: 9.5,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                margin: 0,
                marginBottom: 8,
              }}
            >
              Notes
            </p>
            {data.notes ? (
              <p style={{ color: "#777", fontSize: 12, lineHeight: "20.4px", margin: 0, whiteSpace: "pre-line" }}>
                {data.notes}
              </p>
            ) : (
              <p style={{ color: "#cccccc", fontSize: 12, margin: 0 }}>No notes</p>
            )}
          </div>
        </div>

        {/* ── SIGNATURE (optional) ─────────────────────────────────────────── */}
        {(profile?.signature_url || profile?.signatory_name || profile?.signatory_designation) && (
          <div style={{ borderTop: "1px solid #eeeeee", paddingTop: 24, paddingBottom: 32 }}>
            {profile.signature_url && (
              <div style={{ height: 62, width: 158 }}>
                <TrimmedLogo
                  src={profile.signature_url}
                  alt="Signature"
                  maxWidth={158}
                  maxHeight={62}
                />
              </div>
            )}
            {profile?.signatory_name && (
              <p style={{ color: "#111", fontSize: 12, fontWeight: 600, margin: 0, marginTop: 8 }}>
                {profile.signatory_name}
              </p>
            )}
            {profile?.signatory_designation && (
              <p style={{ color: "#888", fontSize: 11, margin: 0, marginTop: 2 }}>
                {profile.signatory_designation}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: "#111111",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 54,
          padding: "16px 48px",
          borderRadius: "0 0 16px 16px",
        }}
      >
        <p style={{ color: "rgba(255,255,255,0.4)", fontWeight: 700, fontSize: 12, margin: 0 }}>
          {profile?.company_name || "Your Company"}
        </p>
        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11.5, margin: 0 }}>
          Thank you for your business
        </p>
      </div>

    </div>
  );
}
