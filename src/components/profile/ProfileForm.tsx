"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { upsertProfile } from "@/actions/profile";
import type { Profile } from "@/types";
import Image from "next/image";

interface Props { profile: Profile | null; }

export function ProfileForm({ profile }: Props) {
  const [saving, setSaving]       = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState("");
  const [logoPreview, setLogoPreview]     = useState(profile?.logo_url ?? "");
  const [sigPreview, setSigPreview]       = useState(profile?.signature_url ?? "");
  const formRef = useRef<HTMLFormElement>(null);

  function handleFile(setter: (s: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      setter(url);
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formRef.current) return;
    setSaving(true);
    setError("");
    setSuccess(false);

    const formData = new FormData(formRef.current);
    const result = await upsertProfile(formData);
    setSaving(false);

    if (result.success) setSuccess(true);
    else setError(result.error ?? "Failed to save.");
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-8 max-w-2xl">

      {/* Company info */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Company Details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="company_name">Company name</Label>
            <Input id="company_name" name="company_name" defaultValue={profile?.company_name ?? ""} placeholder="Acme Ltd." />
          </div>
          <div>
            <Label htmlFor="company_email">Company email</Label>
            <Input id="company_email" name="company_email" type="email" defaultValue={profile?.company_email ?? ""} placeholder="billing@acme.com" />
          </div>
          <div>
            <Label htmlFor="company_phone">Phone number</Label>
            <Input id="company_phone" name="company_phone" defaultValue={profile?.company_phone ?? ""} placeholder="+234 800 000 0000" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="company_address">Address</Label>
            <Input id="company_address" name="company_address" defaultValue={profile?.company_address ?? ""} placeholder="123 Lagos Island, Lagos" />
          </div>
        </div>
      </section>

      {/* Bank details */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Default Payment Details</h2>
        <p className="text-xs text-slate-500">These pre-populate on every new invoice.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="bank_name">Bank name</Label>
            <Input id="bank_name" name="bank_name" defaultValue={profile?.bank_name ?? ""} placeholder="Zenith Bank" />
          </div>
          <div>
            <Label htmlFor="account_name">Account name</Label>
            <Input id="account_name" name="account_name" defaultValue={profile?.account_name ?? ""} placeholder="Acme Ltd." />
          </div>
          <div>
            <Label htmlFor="bank_account_number">Account number</Label>
            <Input id="bank_account_number" name="bank_account_number" defaultValue={profile?.bank_account_number ?? ""} placeholder="0123456789" />
          </div>
        </div>
      </section>

      {/* Logo & Signature */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Logo & Signature</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Logo */}
          <div>
            <Label>Company logo</Label>
            {logoPreview && (
              <div className="mb-2 h-16 w-32 relative rounded border border-slate-200 overflow-hidden bg-slate-50">
                <Image src={logoPreview} alt="Logo preview" fill className="object-contain p-1" unoptimized />
              </div>
            )}
            <input
              name="logo"
              type="file"
              accept="image/*"
              onChange={handleFile(setLogoPreview)}
              className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
            />
            <p className="mt-1 text-xs text-slate-400">PNG, JPG up to 2 MB</p>
          </div>

          {/* Signature */}
          <div>
            <Label>Signature</Label>
            {sigPreview && (
              <div className="mb-2 h-16 w-32 relative rounded border border-slate-200 overflow-hidden bg-slate-50">
                <Image src={sigPreview} alt="Signature preview" fill className="object-contain p-1" unoptimized />
              </div>
            )}
            <input
              name="signature"
              type="file"
              accept="image/*"
              onChange={handleFile(setSigPreview)}
              className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
            />
            <p className="mt-1 text-xs text-slate-400">PNG, JPG up to 2 MB</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div>
            <Label htmlFor="signatory_name">Signatory name</Label>
            <Input id="signatory_name" name="signatory_name" defaultValue={profile?.signatory_name ?? ""} placeholder="John Doe" />
          </div>
          <div>
            <Label htmlFor="signatory_designation">Designation</Label>
            <Input id="signatory_designation" name="signatory_designation" defaultValue={profile?.signatory_designation ?? ""} placeholder="Managing Director" />
          </div>
        </div>
      </section>

      {error   && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      {success && <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2">Profile saved successfully.</p>}

      <Button type="submit" loading={saving} size="md">Save profile</Button>
    </form>
  );
}
