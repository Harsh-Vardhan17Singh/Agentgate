import { useEffect, useState } from 'react';

import Sidebar from './components/Sidebar';
import {
  getAuditLogs,
  type AuditEvent,
} from './services/api';

function App() {
  const [activeItem, setActiveItem] =
    useState('Overview');

  const [auditLogs, setAuditLogs] = useState<
    AuditEvent[]
  >([]);

  const [auditLoading, setAuditLoading] =
    useState(false);

  const [auditError, setAuditError] =
    useState('');

  useEffect(() => {
    if (activeItem !== 'Audit Logs') {
      return;
    }

    async function loadAuditLogs() {
      try {
        setAuditLoading(true);
        setAuditError('');

        const logs = await getAuditLogs();

        setAuditLogs(logs);
      } catch (error) {
        console.error(error);

        setAuditError(
          'Unable to load audit logs.',
        );
      } finally {
        setAuditLoading(false);
      }
    }

    loadAuditLogs();
  }, [activeItem]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen">
        <Sidebar
          activeItem={activeItem}
          onItemChange={setActiveItem}
        />

        <main className="flex-1 p-8">
          <header className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Security Dashboard
                </p>

                <h2 className="mt-1 text-3xl font-semibold">
                  {activeItem}
                </h2>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Gateway Online
              </div>
            </div>
          </header>

          {activeItem === 'Audit Logs' ? (
            <section className="rounded-xl border border-slate-800 bg-slate-900">
              <div className="border-b border-slate-800 p-5">
                <h3 className="font-semibold">
                  Security Audit Logs
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Real security events recorded by AgentGate
                </p>
              </div>

              {auditLoading && (
                <div className="p-6 text-sm text-slate-400">
                  Loading audit logs...
                </div>
              )}

              {auditError && (
                <div className="p-6 text-sm text-red-400">
                  {auditError}
                </div>
              )}

              {!auditLoading &&
                !auditError &&
                auditLogs.length === 0 && (
                  <div className="p-6 text-sm text-slate-400">
                    No audit events found.
                  </div>
                )}

              {!auditLoading &&
                !auditError &&
                auditLogs.length > 0 && (
                  <div className="divide-y divide-slate-800">
                    {auditLogs.map((log, index) => {
                      const timestamp =
                        log.timestamp ||
                        log.createdAt;

                      return (
                        <div
                          key={`${timestamp}-${index}`}
                          className="flex items-center justify-between gap-6 p-5"
                        >
                          <div className="min-w-0">
                            <p className="font-medium">
                              {log.tool} · {log.operation}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              {log.agentId} → {log.target}
                            </p>

                            {timestamp && (
                              <p className="mt-1 text-xs text-slate-600">
                                {new Date(
                                  timestamp,
                                ).toLocaleString()}
                              </p>
                            )}
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-3 py-1 text-xs ${
                              log.decision === 'EXECUTED'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : log.decision === 'BLOCKED'
                                  ? 'bg-red-500/10 text-red-400'
                                  : log.decision ===
                                      'APPROVAL_REQUIRED'
                                    ? 'bg-amber-500/10 text-amber-400'
                                    : 'bg-blue-500/10 text-blue-400'
                            }`}
                          >
                            {log.decision}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
            </section>
          ) : (
            <>
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
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;