import { auth, signOut } from "@/auth";

export async function TopBar() {
  const session = await auth();

  return (
    <header className="h-14 border-b border-slate-200 bg-white px-4 md:px-6 flex items-center justify-between">
      {/* Mobile: spacer for hamburger button; Desktop: empty */}
      <span className="md:hidden font-bold text-[#0a1628] pl-10">Favice</span>
      <div className="hidden md:block" />

      <div className="flex items-center gap-3 md:gap-4">
        <span className="text-sm text-slate-500 hidden sm:block truncate max-w-[200px]">
          {session?.user?.email}
        </span>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="text-xs text-slate-400 hover:text-slate-700 transition-colors px-3 py-2 rounded hover:bg-slate-100 min-h-[44px] flex items-center"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
