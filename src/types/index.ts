export interface Profile {
  id: string;
  user_id: string;
  company_name: string | null;
  company_address: string | null;
  company_email: string | null;
  company_phone: string | null;
  logo_url: string | null;
  signature_url: string | null;
  signatory_name: string | null;
  signatory_designation: string | null;
  bank_account_number: string | null;
  bank_name: string | null;
  account_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface LineItem {
  id: string;          // client-side uuid (not persisted until save)
  description: string;
  quantity: number;
  rate: number;
  amount: number;      // quantity * rate (computed client-side)
}

export interface Invoice {
  id: string;
  user_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  client_name: string;
  client_address: string | null;
  client_email: string | null;
  subtotal: number;
  vat_enabled: boolean;
  vat_percentage: number;
  vat_amount: number;
  wht_enabled: boolean;
  wht_percentage: number;
  wht_amount: number;
  total: number;
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
  notes: string | null;
  status: "draft" | "sent" | "paid";
  created_at: string;
  updated_at: string;
  line_items?: LineItem[];
}

export type InvoiceStatus = "draft" | "sent" | "paid";

export interface InvoiceFormData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  lineItems: LineItem[];
  vatEnabled: boolean;
  vatPercentage: number;
  whtEnabled: boolean;
  whtPercentage: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
  notes: string;
}

export interface InvoiceTotals {
  subtotal: number;
  vatAmount: number;
  whtAmount: number;
  total: number;
}
