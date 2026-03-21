import { auth, signOut } from "@/auth";

export async function TopBar() {
  const session = await auth();

  return (
    <header className="h-14 border-b border-slate-200 bg-white px-4 md:px-6 flex items-center justify-between sticky top-0 z-50 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
      {/* Mobile: empty spacer (hamburger+brand rendered by Sidebar); Desktop: empty */}
      <div className="md:hidden w-28" />
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
