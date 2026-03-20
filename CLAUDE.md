# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Note:** This project uses Next.js 16 which has breaking changes from older versions. Always check `node_modules/next/dist/docs/` for the latest API before writing code. `middleware.ts` is renamed to `proxy.ts` in Next.js 16.

## Commands

```bash
npm run dev       # Start dev server at http://localhost:3000
npm run build     # Production build + type check
npm run lint      # Run ESLint
npm run start     # Start production server (after build)
```

## First-time setup

1. Copy `.env.example` → `.env.local` and fill all values
2. Run the SQL in `supabase/schema.sql` in Supabase Dashboard → SQL Editor
3. Create a Supabase Storage bucket named `company-assets` (set to public)
4. Run `npm run dev`

## Environment variables

| Variable | Description |
|---|---|
| `AUTH_SECRET` | NextAuth secret — generate with `openssl rand -base64 33` |
| `AUTH_URL` | App URL (http://localhost:3000 in dev) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (browser-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key (server only — never expose) |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Optional Google OAuth |

## Architecture

**Stack:** Next.js 16 App Router · TypeScript · Tailwind CSS v4 · NextAuth.js v5 beta · Supabase (Postgres + Storage)

**Key dependency notes:**
- `next-auth@^5.0.0-beta.30` — Google OAuth is configured as `type: "oauth"` (NOT `type: "oidc"`) with explicit `issuer: "https://accounts.google.com"` to avoid openid-client v6 "iss mismatch" errors. Do not change this.
- `html2canvas` is still in `package.json` but **not used** — replaced by `html-to-image` for PDF capture. Do not reintroduce `html2canvas`.

### Route structure

```
src/app/
  page.tsx                  Landing page
  (auth)/
    login/page.tsx           Email/password + Google sign-in
    signup/page.tsx          Registration → Supabase Auth signUp
  (dashboard)/
    layout.tsx               Sidebar + TopBar shell
    dashboard/page.tsx       Summary cards + invoice list
    profile/page.tsx         Company details, logo, signature, bank info
    invoices/
      page.tsx               Invoice list (filterable by status)
      new/page.tsx           Create invoice with live preview
      [id]/page.tsx          Edit existing invoice
  api/auth/[...nextauth]/    NextAuth route handler
```

### Auth flow

- **`src/auth.ts`** — NextAuth config with Google OAuth and Credentials (via Supabase Auth `signInWithPassword`)
- **`src/proxy.ts`** — Next.js 16 proxy that protects `/dashboard/*`, `/profile/*`, `/invoices/*`
- Session exposes `session.user.id` (Supabase user UUID for credentials, Google sub for OAuth)
- **`src/types/next-auth.d.ts`** — Extends Session type to include `user.id`

### Supabase

Two clients in **`src/lib/supabase.ts`**:
- `supabase` — Browser client (anon key, respects RLS). Use in Client Components.
- `createServiceClient()` — Server-only client (service role key, bypasses RLS). Use only in Server Actions and Server Components.

User identifier: `user_id TEXT` in all tables stores `session.user.id`.

### Server Actions

All data mutations go through Server Actions (not API routes):
- **`src/actions/profile.ts`** — `getProfile()`, `upsertProfile(formData)`
- **`src/actions/invoices.ts`** — `getInvoices()`, `getInvoice(id)`, `saveInvoice()`, `updateInvoiceStatus()`, `deleteInvoice()`, `getInvoiceSummary()`, `getNextInvoiceNumber()`

### Key components

| Component | Purpose |
|---|---|
| `InvoiceCreator` | Main client component with all invoice form state |
| `InvoicePreview` | Read-only preview rendering (used for display + PDF capture) |
| `LineItemsTable` | Dynamic line items with qty × rate calculation |
| `TaxSection` | VAT / WHT toggle + percentage inputs |
| `InvoiceTable` | Filterable invoice list with status actions |
| `SummaryCards` | Dashboard metric cards |
| `Sidebar` | Navigation sidebar (uses `usePathname` for active state) |

### Database schema

Three tables — see `supabase/schema.sql` for full definitions:
- `profiles` — one row per user (company info, logo/signature URLs, bank details)
- `invoices` — one row per invoice (header, tax config, totals, status)
- `invoice_line_items` — child rows of invoices (cascades on delete)

### PDF export

PDF export uses **`html-to-image`** + `jspdf` (both dynamically imported). The `#invoice-preview` div is captured via `toPng()` and saved as an A4 PDF. Triggered from `InvoiceCreator`.

- Do **not** use `html2canvas` for this — its CSS parser cannot handle `oklch()`/`lab()` color functions that Tailwind v4 emits, and `foreignObjectRendering: true` produces a blank image.
- `html-to-image` uses the browser's native serializer so modern CSS colors work without any workarounds.
- The PDF captures the **unscaled** 720px `#invoice-preview` element directly (not the scaled display wrapper).

### Invoice preview layout

`InvoicePreview` renders at a **fixed 720px width** matching the Figma design (Favsys Invoice Design — Monochrome, node 7:2). In `InvoiceCreator`, a `ResizeObserver`-based scale wrapper shrinks it proportionally to fit the `560px` preview panel using `transform: scale()`. The PDF always captures at full 720px resolution.

### Styling

- Tailwind CSS v4 — no `tailwind.config.js`, theme defined in `src/app/globals.css` via `@theme`
- Primary accent: `#0a1628` (dark navy), secondary: `#163258`
- Invoice preview uses monochrome palette: `#111`, `#f7f7f7`, `#eee`, `#aaa` — matching the Figma design
- Status badge colours in invoice preview: all use the same monochrome pill style
- Utility helpers in `src/lib/utils.ts`: `formatNaira()`, `formatDate()`, `calcTotals()`, `generateInvoiceNumber()`
