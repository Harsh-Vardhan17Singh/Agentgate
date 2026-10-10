import { useEffect, useState } from 'react';

import Sidebar from './components/Sidebar';
import {
  getAuditLogs,
  getPendingApprovals,
  getAgents,
  approveRequest,
  rejectRequest,
  type Agent,
  type ApprovalRequest,
  type AuditEvent,
} from './services/api';

function App() {
  const [activeItem, setActiveItem] =
    useState('Overview');

  const [auditLogs, setAuditLogs] = useState<
    AuditEvent[]
  >([]);

  const [pendingApprovals, setPendingApprovals] =
    useState<ApprovalRequest[]>([]);

  const [ approvalActionId,setApprovalActionId] = useState('');
  const [approvalError, setApprovalError] = useState('');
  const [ approvalMessage, setApprovalMessage] = useState('');
  
  const [agents, setAgents] = useState<Agent[]>([]);
const [agentsLoading, setAgentsLoading] = useState(false);
const [agentsError, setAgentsError] = useState('');

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  const [requestFilter, setRequestFilter] = useState('ALL');

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        setError('');

        const [logs, approvals] =
          await Promise.all([
            getAuditLogs(),
            getPendingApprovals(),
          ]);

        setAuditLogs(logs);
        setPendingApprovals(approvals);
      } catch (error) {
        console.error(error);

        setError(
          'Unable to load AgentGate data.',
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  useEffect(() => {
  async function loadAgents() {
    try {
      setAgentsLoading(true);
      setAgentsError('');

      const data = await getAgents();
      setAgents(data);
    } catch (error) {
      console.error('Failed to load agents:', error);
      setAgentsError('Unable to load registered agents.');
    } finally {
      setAgentsLoading(false);
    }
  }

  loadAgents();
}, []);

async function handleApprove(id: string) {
  const confirmed = window.confirm(
    'Approving this request may execute the requested tool. Continue?',
  );

  if (!confirmed) return;

  try {
    setApprovalActionId(id);
    setApprovalError('');
    setApprovalMessage('');

    const result = await approveRequest(id);

    setApprovalMessage(result.message);

    const approvals = await getPendingApprovals();
    setPendingApprovals(approvals);
  } catch (error) {
    console.error(error);
    setApprovalError(
      error instanceof Error
        ? error.message
        : 'Failed to approve request.',
    );
  } finally {
    setApprovalActionId('');
  }
}

async function handleReject(id: string) {
  try {
    setApprovalActionId(id);
    setApprovalError('');
    setApprovalMessage('');

    await rejectRequest(id);

    setApprovalMessage('Request rejected successfully.');

    const approvals = await getPendingApprovals();
    setPendingApprovals(approvals);
  } catch (error) {
    console.error(error);
    setApprovalError(
      error instanceof Error
        ? error.message
        : 'Failed to reject request.',
    );
  } finally {
    setApprovalActionId('');
  }
}

  const uniqueRequests = new Set(
    auditLogs.map(
      (log) =>
        `${log.agentId}:${log.tool}:${log.operation}:${log.target}`,
    ),
  );

  const totalRequests = uniqueRequests.size;

  const blockedActions = auditLogs.filter(
    (log) => log.event === 'BLOCKED',
  ).length;

  const recentLogs = auditLogs.slice(0, 10);

  const filteredRequests = auditLogs.filter((log) => {
  if (requestFilter === 'ALL') {
    return true;
  }

  if (requestFilter === 'EXECUTED') {
    return log.event === 'EXECUTED';
  }

  if (requestFilter === 'APPROVAL_REQUIRED') {
    return log.event === 'APPROVAL_REQUIRED';
  }

  if (requestFilter === 'BLOCKED') {
    return log.event === 'BLOCKED';
  }

  return true;
});

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

          {activeItem === 'Requests' ? (
  <section className="rounded-xl border border-slate-800 bg-slate-900">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 p-5">
      <div>
        <h3 className="font-semibold">
          Tool Request Activity
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Recorded security events from AgentGate
        </p>
      </div>

      <select
        value={requestFilter}
        onChange={(event) =>
          setRequestFilter(event.target.value)
        }
        className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500"
      >
        <option value="ALL">All events</option>
        <option value="EXECUTED">Executed</option>
        <option value="APPROVAL_REQUIRED">
          Approval required
        </option>
        <option value="BLOCKED">Blocked</option>
      </select>
    </div>

    {loading && (
      <div className="p-6 text-sm text-slate-400">
        Loading request activity...
      </div>
    )}

    {!loading && error && (
      <div className="p-6 text-sm text-red-400">
        {error}
      </div>
    )}

    {!loading &&
      !error &&
      filteredRequests.length === 0 && (
        <div className="p-6 text-sm text-slate-400">
          No events match this filter.
        </div>
      )}

    {!loading &&
      !error &&
      filteredRequests.length > 0 && (
        <div className="divide-y divide-slate-800">
          {filteredRequests.map((log, index) => {
            const timestamp =
              log.timestamp || log.createdAt;

            const event = log.event || log.decision;

            const badgeClass =
              event === 'EXECUTED'
                ? 'bg-emerald-500/10 text-emerald-400'
                : event === 'BLOCKED'
                  ? 'bg-red-500/10 text-red-400'
                  : event === 'APPROVAL_REQUIRED'
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'bg-blue-500/10 text-blue-400';

            return (
              <div
                key={`${timestamp}-${index}`}
                className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {log.tool} · {log.operation}
                  </p>

                  <p className="mt-1 break-all text-sm text-slate-400">
                    {log.agentId} → {log.target}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-md bg-slate-800 px-2 py-1 text-slate-300">
                      Risk: {log.riskLevel ?? 'Unknown'}
                      {typeof log.riskScore === 'number'
                        ? ` (${log.riskScore})`
                        : ''}
                    </span>

                    <span className="rounded-md bg-slate-800 px-2 py-1 text-slate-300">
                      {log.executed
                        ? 'Executed: Yes'
                        : 'Executed: No'}
                    </span>
                  </div>

                  {timestamp && (
                    <p className="mt-2 text-xs text-slate-500">
                      {new Date(timestamp).toLocaleString()}
                    </p>
                  )}
                </div>

                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs ${badgeClass}`}
                >
                  {event}
                </span>
              </div>
            );
          })}
        </div>
      )}
  </section>
) : activeItem === 'Audit Logs' ?  (
            <section className="rounded-xl border border-slate-800 bg-slate-900">
              <div className="border-b border-slate-800 p-5">
                <h3 className="font-semibold">
                  Security Audit Logs
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Real security events recorded by AgentGate
                </p>
              </div>

              {loading && (
                <div className="p-6 text-sm text-slate-400">
                  Loading audit logs...
                </div>
              )}

              {error && (
                <div className="p-6 text-sm text-red-400">
                  {error}
                </div>
              )}

              {!loading &&
                !error &&
                auditLogs.length === 0 && (
                  <div className="p-6 text-sm text-slate-400">
                    No audit events found.
                  </div>
                )}

              {!loading &&
                !error &&
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
                              log.event === 'EXECUTED'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : log.event === 'BLOCKED'
                                  ? 'bg-red-500/10 text-red-400'
                                  : log.event ===
                                      'APPROVAL_REQUIRED'
                                    ? 'bg-amber-500/10 text-amber-400'
                                    : 'bg-blue-500/10 text-blue-400'
                            }`}
                          >
                            {log.event || log.decision}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
            </section>

          ) : activeItem === 'Approvals' ? (
  <section className="rounded-xl border border-slate-800 bg-slate-900">
    <div className="border-b border-slate-800 p-5">
      <h3 className="font-semibold">Pending Approvals</h3>
      <p className="mt-1 text-sm text-slate-500">
        Review requests before allowing tool execution.
      </p>
    </div>

    {approvalError && (
      <p className="p-5 text-sm text-red-400">{approvalError}</p>
    )}

    {approvalMessage && (
      <p className="p-5 text-sm text-emerald-400">
        {approvalMessage}
      </p>
    )}

    {loading && (
      <p className="p-5 text-sm text-slate-400">
        Loading approvals...
      </p>
    )}

    {!loading && pendingApprovals.length === 0 && (
      <p className="p-5 text-sm text-slate-400">
        No pending approvals.
      </p>
    )}

    {!loading && pendingApprovals.map((approval) => (
      <div
        key={approval.id}
        className="border-b border-slate-800 p-5"
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row">
          <div>
            <h4 className="font-medium">
              {approval.request.tool} · {approval.request.operation}
            </h4>

            <p className="mt-1 break-all text-sm text-slate-400">
              Agent: {approval.request.agentId}
            </p>

            <p className="mt-1 break-all text-sm text-slate-400">
              Target: {approval.request.target}
            </p>

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-md bg-slate-800 px-2 py-1">
                Risk: {approval.risk.level}
              </span>
              <span className="rounded-md bg-slate-800 px-2 py-1">
                Score: {approval.risk.score}
              </span>
            </div>
          </div>

          <div className="flex h-fit gap-2">
            <button
              disabled={approvalActionId !== ''}
              onClick={() => handleApprove(approval.id)}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {approvalActionId === approval.id
                ? 'Processing...'
                : 'Approve & Execute'}
            </button>

            <button
              disabled={approvalActionId !== ''}
              onClick={() => handleReject(approval.id)}
              className="rounded-lg border border-red-500/30 px-3 py-2 text-sm font-medium text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    ))}
  </section>
    
          )  : activeItem === 'Agents' ? (
  <section className="rounded-xl border border-slate-800 bg-slate-900">
    <div className="border-b border-slate-800 p-5">
      <h3 className="font-semibold">Registered Agents</h3>
      <p className="mt-1 text-sm text-slate-500">
        Agents registered with the AgentGate gateway
      </p>
    </div>

    {agentsLoading && (
      <p className="p-6 text-sm text-slate-400">
        Loading registered agents...
      </p>
    )}

    {!agentsLoading && agentsError && (
      <p className="p-6 text-sm text-red-400">
        {agentsError}
      </p>
    )}

    {!agentsLoading && !agentsError && agents.length === 0 && (
      <p className="p-6 text-sm text-slate-400">
        No agents registered yet.
      </p>
    )}

    {!agentsLoading && !agentsError && agents.length > 0 && (
      <div className="divide-y divide-slate-800">
        {agents.map((agent) => (
          <div
            key={agent.agentId}
            className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <h4 className="font-medium">{agent.name}</h4>

              <p className="mt-1 break-all text-sm text-slate-500">
                ID: {agent.agentId}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {agent.permissions.map((permission) => (
                  <span
                    key={permission}
                    className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300"
                  >
                    {permission}
                  </span>
                ))}

                {agent.permissions.length === 0 && (
                  <span className="text-xs text-slate-500">
                    No permissions assigned
                  </span>
                )}
              </div>
            </div>

            <span
              className={`w-fit rounded-full px-3 py-1 text-xs ${
                agent.active
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-red-500/10 text-red-400'
              }`}
            >
              {agent.active ? 'Active' : 'Inactive'}
            </span>
          </div>
        ))}
      </div>
    )}
  </section>
) : (
  <>
              {error && (
                <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                  {error}
                </div>
              )}

              <section className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                  <p className="text-sm text-slate-500">
                    Total Requests
                  </p>

                  <p className="mt-2 text-3xl font-semibold">
                    {loading ? '...' : totalRequests}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                  <p className="text-sm text-slate-500">
                    Pending Approvals
                  </p>

                  <p className="mt-2 text-3xl font-semibold text-amber-400">
                    {loading
                      ? '...'
                      : pendingApprovals.length}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                  <p className="text-sm text-slate-500">
                    Blocked Actions
                  </p>

                  <p className="mt-2 text-3xl font-semibold text-red-400">
                    {loading ? '...' : blockedActions}
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

                {loading && (
                  <div className="p-6 text-sm text-slate-400">
                    Loading activity...
                  </div>
                )}

                {!loading &&
                  recentLogs.length === 0 && (
                    <div className="p-6 text-sm text-slate-400">
                      No recent activity.
                    </div>
                  )}

                {!loading &&
                  recentLogs.length > 0 && (
                    <div className="divide-y divide-slate-800">
                      {recentLogs.map(
                        (log, index) => {
                          const timestamp =
                            log.timestamp ||
                            log.createdAt;

                          return (
                            <div
                              key={`${timestamp}-${index}`}
                              className="flex items-center justify-between gap-6 p-5"
                            >
                              <div>
                                <p className="font-medium">
                                  {log.tool} ·{' '}
                                  {log.operation}
                                </p>

                                <p className="mt-1 text-sm text-slate-500">
                                  {log.agentId} →{' '}
                                  {log.target}
                                </p>
                              </div>

                              <span
                                className={`shrink-0 rounded-full px-3 py-1 text-xs ${
                                  log.event ===
                                  'EXECUTED'
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : log.event ===
                                        'BLOCKED'
                                      ? 'bg-red-500/10 text-red-400'
                                      : log.event ===
                                          'APPROVAL_REQUIRED'
                                        ? 'bg-amber-500/10 text-amber-400'
                                        : 'bg-blue-500/10 text-blue-400'
                                }`}
                              >
                                {log.event ||
                                  log.decision}
                              </span>
                            </div>
                          );
                        },
                      )}
                    </div>
                  )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;