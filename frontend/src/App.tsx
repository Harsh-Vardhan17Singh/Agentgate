function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-800 bg-slate-950 p-5">
          <div className="mb-10">
            <h1 className="text-xl font-bold tracking-tight">
              AgentGate
            </h1>

            <p className="mt-1 text-xs text-slate-500">
              AI Security Gateway
            </p>
          </div>

          <nav className="space-y-2">
            <button className="w-full rounded-lg bg-slate-800 px-4 py-3 text-left text-sm font-medium">
              Overview
            </button>

            <button className="w-full rounded-lg px-4 py-3 text-left text-sm text-slate-400 hover:bg-slate-900 hover:text-white">
              Requests
            </button>

            <button className="w-full rounded-lg px-4 py-3 text-left text-sm text-slate-400 hover:bg-slate-900 hover:text-white">
              Approvals
            </button>

            <button className="w-full rounded-lg px-4 py-3 text-left text-sm text-slate-400 hover:bg-slate-900 hover:text-white">
              Audit Logs
            </button>

            <button className="w-full rounded-lg px-4 py-3 text-left text-sm text-slate-400 hover:bg-slate-900 hover:text-white">
              Agents
            </button>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8">
          <header className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Security Dashboard
                </p>

                <h2 className="mt-1 text-3xl font-semibold">
                  Overview
                </h2>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Gateway Online
              </div>
            </div>
          </header>

          {/* Stats */}
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-500">
                Total Requests
              </p>

              <p className="mt-2 text-3xl font-semibold">
                24
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-500">
                Pending Approvals
              </p>

              <p className="mt-2 text-3xl font-semibold text-amber-400">
                2
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-500">
                Blocked Actions
              </p>

              <p className="mt-2 text-3xl font-semibold text-red-400">
                3
              </p>
            </div>
          </section>

          {/* Recent activity */}
          <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900">
            <div className="border-b border-slate-800 p-5">
              <h3 className="font-semibold">
                Recent Security Activity
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Latest decisions made by AgentGate
              </p>
            </div>

            <div className="divide-y divide-slate-800">
              <div className="flex items-center justify-between p-5">
                <div>
                  <p className="font-medium">
                    GitHub · delete_branch
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    admin-agent → Silent-Driver-Grand-Plix-
                  </p>
                </div>

                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
                  EXECUTED
                </span>
              </div>

              <div className="flex items-center justify-between p-5">
                <div>
                  <p className="font-medium">
                    GitHub · delete_branch
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    admin-agent → approval required
                  </p>
                </div>

                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-400">
                  APPROVAL
                </span>
              </div>

              <div className="flex items-center justify-between p-5">
                <div>
                  <p className="font-medium">
                    GitHub · list_branches
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    admin-agent → low risk operation
                  </p>
                </div>

                <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-400">
                  ALLOWED
                </span>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;