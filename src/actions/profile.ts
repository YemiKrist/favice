"use server";

import { auth } from "@/auth";
import { createServiceClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import type { Profile } from "@/types";

async function getSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session;
}

export async function getProfile(): Promise<Profile | null> {
  const session = await getSession();
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", session.user.id)
    .single();

  return data ?? null;
}

export async function upsertProfile(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  const supabase = createServiceClient();

  const fields = {
    user_id:             session.user.id,
    company_name:        formData.get("company_name")        as string,
    company_address:     formData.get("company_address")     as string,
    company_email:       formData.get("company_email")       as string,
    company_phone:       formData.get("company_phone")       as string,
    bank_name:           formData.get("bank_name")           as string,
    bank_account_number: formData.get("bank_account_number") as string,
    account_name:        formData.get("account_name")        as string,
    signatory_name:      formData.get("signatory_name")      as string,
    signatory_designation: formData.get("signatory_designation") as string,
  };

  // Handle logo upload
  const logoFile = formData.get("logo") as File | null;
  if (logoFile && logoFile.size > 0) {
    const ext = logoFile.name.split(".").pop();
    const path = `${session.user.id}/logo.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("company-assets")
      .upload(path, logoFile, { upsert: true });
    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from("company-assets")
        .getPublicUrl(path);
      (fields as Record<string, string>).logo_url = urlData.publicUrl;
    }
  }

  // Handle signature upload
  const sigFile = formData.get("signature") as File | null;
  if (sigFile && sigFile.size > 0) {
    const ext = sigFile.name.split(".").pop();
    const path = `${session.user.id}/signature.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("company-assets")
      .upload(path, sigFile, { upsert: true });
    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from("company-assets")
        .getPublicUrl(path);
      (fields as Record<string, string>).signature_url = urlData.publicUrl;
    }
  }

  const { error } = await supabase
    .from("profiles")
    .upsert(fields, { onConflict: "user_id" });

  if (error) return { success: false, error: error.message };

  revalidatePath("/profile");
  return { success: true };
}
