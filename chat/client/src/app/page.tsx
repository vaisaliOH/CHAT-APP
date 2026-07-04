import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/70 shadow-2xl shadow-black/30 backdrop-blur-xl">
        <header className="border-b border-white/10 px-6 py-5 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-blue-300/80">
                SyncSpace
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Real-Time Team Collaboration Platform
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
                A modern workspace chat for channels, team members, and direct messages.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
              Built for placements, teams, and portfolio-grade UI.
            </div>
          </div>
        </header>

        <div className="grid flex-1 gap-6 px-6 py-6 lg:grid-cols-[1.05fr_1.45fr_1fr] lg:px-8">
          <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-lg shadow-slate-950/20">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Channels
            </p>
            <div className="mt-4 space-y-2 text-sm text-slate-200">
              {["frontend", "backend", "placements", "general"].map((channel) => (
                <div
                  key={channel}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-3 py-2"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                  <span className="font-medium"># {channel}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Team Members
              </p>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-slate-100">
                  <span>🟢 vaisali</span>
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-slate-100">
                  <span>🟢 Suguna</span>
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-slate-100">
                  <span>🟢 Nair</span>
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white p-5 text-slate-900 shadow-xl shadow-slate-950/30">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
                  Workspace Feed
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                  Public conversations in one place
                </h2>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                Live
              </span>
            </div>

            <div className="mt-5 space-y-3">
              <div className="max-w-[80%] rounded-2xl rounded-bl-md border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">vaisali</p>
                <p className="mt-1 text-sm text-slate-700">
                  Hey team, I’m polishing the dashboard layout for SyncSpace.
                </p>
                <p className="mt-2 text-xs text-slate-500">10:45 PM</p>
              </div>
              <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-md border border-blue-100 bg-blue-600 px-4 py-3 text-white shadow-sm">
                <p className="text-sm font-semibold">Me</p>
                <p className="mt-1 text-sm text-blue-50">
                  Working on the backend and placement flow.
                </p>
                <p className="mt-2 text-xs text-blue-100">10:46 PM</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Type a message to join the workspace feed.
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-lg shadow-slate-950/20">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Direct Messages
            </p>
            <div className="mt-3 rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm text-slate-100">
              <p className="text-xs uppercase tracking-[0.2em] text-blue-200/80">
                DM To
              </p>
              <p className="mt-1 text-base font-semibold">vaisali</p>
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-slate-200">
                <p className="font-semibold text-white">vaisali</p>
                <p className="mt-1">Hi</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-slate-200">
                <p className="font-semibold text-white">Me</p>
                <p className="mt-1">Hello</p>
              </div>
            </div>
          </section>
        </div>

        <footer className="border-t border-white/10 px-6 py-5 sm:px-8">
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 sm:flex-row sm:items-center">
            <p className="text-sm text-slate-300">Type a message...</p>
            <div className="ml-auto flex gap-3">
              <Link
                href="/login"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/10"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-400"
              >
                Register
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}