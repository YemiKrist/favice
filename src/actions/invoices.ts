"use server";

import { auth } from "@/auth";
import { createServiceClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import type { Invoice, InvoiceFormData, InvoiceStatus } from "@/types";
import { calcTotals, generateInvoiceNumber } from "@/lib/utils";

async function getSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session;
}

export async function getNextInvoiceNumber(): Promise<string> {
  const session = await getSession();
  const supabase = createServiceClient();
  const { count } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.user.id);
  return generateInvoiceNumber(count ?? 0);
}

export async function getInvoices(): Promise<Invoice[]> {
  return getInvoicesByStatus();
}

export async function getInvoicesByStatus(status?: InvoiceStatus): Promise<Invoice[]> {
  const session = await getSession();
  const supabase = createServiceClient();
  let query = supabase
    .from("invoices")
    .select("*")
    .eq("user_id", session.user.id);

  if (status) {
    query = query.eq("status", status);
  }

  const { data } = await query.order("created_at", { ascending: false });
  return (data ?? []) as Invoice[];
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const session = await getSession();
  const supabase = createServiceClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .single();

  if (!invoice) return null;

  const { data: lineItems } = await supabase
    .from("invoice_line_items")
    .select("*")
    .eq("invoice_id", id)
    .order("sort_order");

  return { ...invoice, line_items: lineItems ?? [] } as Invoice;
}

export async function saveInvoice(
  data: InvoiceFormData,
  status: InvoiceStatus = "draft",
  existingId?: string,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const session = await getSession();
  const supabase = createServiceClient();

  const totals = calcTotals(data);

  const invoiceRow = {
    user_id:        session.user.id,
    invoice_number: data.invoiceNumber,
    invoice_date:   data.invoiceDate,
    due_date:       data.dueDate || null,
    client_name:    data.clientName,
    client_address: data.clientAddress || null,
    client_email:   data.clientEmail || null,
    subtotal:       totals.subtotal,
    vat_enabled:    data.vatEnabled,
    vat_percentage: data.vatPercentage,
    vat_amount:     totals.vatAmount,
    wht_enabled:    data.whtEnabled,
    wht_percentage: data.whtPercentage,
    wht_amount:     totals.whtAmount,
    total:          totals.total,
    bank_name:      data.bankName || null,
    account_name:   data.accountName || null,
    account_number: data.accountNumber || null,
    notes:          data.notes || null,
    status,
  };

  let invoiceId = existingId;

  if (existingId) {
    const { error } = await supabase
      .from("invoices")
      .update(invoiceRow)
      .eq("id", existingId)
      .eq("user_id", session.user.id);
    if (error) return { success: false, error: error.message };
  } else {
    const { data: created, error } = await supabase
      .from("invoices")
      .insert(invoiceRow)
      .select("id")
      .single();
    if (error || !created) return { success: false, error: error?.message };
    invoiceId = created.id;
  }

  // Replace all line items
  if (invoiceId) {
    const { error: deleteError } = await supabase
      .from("invoice_line_items")
      .delete()
      .eq("invoice_id", invoiceId);
    if (deleteError) return { success: false, error: deleteError.message };

    const lineRows = data.lineItems
      .filter((item) => item.description.trim() || item.rate > 0)
      .map((item, idx) => ({
        invoice_id:  invoiceId,
        description: item.description,
        quantity:    item.quantity,
        rate:        item.rate,
        sort_order:  idx,
      }));
    if (lineRows.length > 0) {
      const { error: lineError } = await supabase.from("invoice_line_items").insert(lineRows);
      if (lineError) return { success: false, error: lineError.message };
    }
  }

  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  revalidatePath("/invoices/new");
  if (invoiceId) revalidatePath(`/invoices/${invoiceId}`);
  return { success: true, id: invoiceId };
}

export async function updateInvoiceStatus(
  id: string,
  status: InvoiceStatus,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("invoices")
    .update({ status })
    .eq("id", id)
    .eq("user_id", session.user.id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteInvoice(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", id)
    .eq("user_id", session.user.id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getInvoiceSummary() {
  const session = await getSession();
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("invoices")
    .select("total, status")
    .eq("user_id", session.user.id);

  const invoices = data ?? [];
  const total         = invoices.length;
  const totalAmount   = invoices.reduce((s, i) => s + Number(i.total), 0);
  const totalPaid     = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.total), 0);
  const totalOutstanding = invoices
    .filter((i) => i.status !== "paid")
    .reduce((s, i) => s + Number(i.total), 0);

  return { total, totalAmount, totalPaid, totalOutstanding };
}
