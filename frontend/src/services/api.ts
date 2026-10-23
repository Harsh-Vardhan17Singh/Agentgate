
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return body.message || `Request failed: ${response.status}`;
  } catch {
    return `Request failed: ${response.status}`;
  }
}

async function reviewerFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
  });
}

export interface ReviewerSession {
  authenticated: boolean;
}

export async function reviewerLogin(key: string): Promise<ReviewerSession> {
  const response = await reviewerFetch('/reviewer/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json();
}

export async function getReviewerSession(): Promise<ReviewerSession> {
  const response = await reviewerFetch('/reviewer/session');

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json();
}

export async function reviewerLogout(): Promise<ReviewerSession> {
  const response = await reviewerFetch('/reviewer/logout', {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json();
}

export interface AuditEvent {
  agentId: string;
  tool: string;
  operation: string;
  target: string;
  decision: string;
  riskLevel?: string;
  riskScore?: number;
  executed?: boolean;
  event?: string;
  timestamp?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface Agent {
  agentId: string;
  name: string;
  active: boolean;
  permissions: string[];
  createdAt?: string;
}

export async function getAgents(): Promise<Agent[]> {
  const response = await reviewerFetch('/agents');

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json();
}

export interface ApprovalRequest {
  id: string;
  request: {
    agentId: string;
    tool: string;
    operation: string;
    target: string;
  };
  risk: {
    score: number;
    level: string;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  executionStatus:
    | 'NOT_EXECUTED'
    | 'EXECUTING'
    | 'EXECUTED'
    | 'FAILED'
    | 'UNKNOWN';
  createdAt: string;
  reviewedAt?: string;
  executedAt?: string;
}

export async function getAuditLogs(): Promise<AuditEvent[]> {
  const response = await reviewerFetch('/audit');

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json();
}

export async function getPendingApprovals(): Promise<ApprovalRequest[]> {
  const response = await reviewerFetch('/approval/pending');

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json();
}

export async function approveRequest(
  id: string,
): Promise<{
  approval: ApprovalRequest;
  executed: boolean;
  result?: unknown;
  message: string;
}> {
  const response = await reviewerFetch(
    `/approval/${encodeURIComponent(id)}/approve`,
    { method: 'POST' },
  );

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json();
}

export async function rejectRequest(
  id: string,
): Promise<ApprovalRequest> {
  const response = await reviewerFetch(
    `/approval/${encodeURIComponent(id)}/reject`,
    { method: 'POST' },
  );

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json();
}
