import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0a1628] flex flex-col items-center justify-center px-4 text-white">
      <div className="text-center max-w-xl">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">Favice</h1>
        <p className="text-lg text-white/60 mb-10">
          Professional invoice generation for Nigerian businesses.<br />
          Create, manage, and export invoices in seconds.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className="px-6 py-3 bg-white text-[#0a1628] rounded-lg font-semibold text-sm hover:bg-slate-100 transition-colors min-h-[44px] flex items-center justify-center"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 border border-white/20 text-white rounded-lg font-semibold text-sm hover:bg-white/10 transition-colors min-h-[44px] flex items-center justify-center"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
