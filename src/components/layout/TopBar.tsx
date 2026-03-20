import { auth, signOut } from "@/auth";

export async function TopBar() {
  const session = await auth();

  return (
    <header className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between">
      {/* Mobile brand */}
      <span className="md:hidden font-bold text-[#0a1628]">Favice</span>
      <div className="hidden md:block" />

      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-500 hidden sm:block">
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
            className="text-xs text-slate-400 hover:text-slate-700 transition-colors px-2 py-1 rounded hover:bg-slate-100"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
