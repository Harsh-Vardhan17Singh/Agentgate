const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000';

const REVIEWER_KEY =
  import.meta.env.VITE_REVIEWER_KEY || '';

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
  const response = await fetch(
    `${API_BASE_URL}/agents`,
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch agents: ${response.status}`,
    );
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
    | 'EXECUTED'
    | 'FAILED';
  createdAt: string;
  reviewedAt?: string;
  executedAt?: string;
}

const reviewerHeaders: Record<string, string> =
  REVIEWER_KEY
    ? {
        'x-reviewer-key': REVIEWER_KEY,
      }
    : {};
    
export async function getAuditLogs(): Promise<AuditEvent[]> {
  const response = await fetch(
    `${API_BASE_URL}/audit`,
    {
      headers: reviewerHeaders,
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch audit logs: ${response.status}`,
    );
  }

  return response.json();
}

export async function getPendingApprovals(): Promise<
  ApprovalRequest[]
> {
  const response = await fetch(
    `${API_BASE_URL}/approval/pending`,
    {
      headers: reviewerHeaders,
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch pending approvals: ${response.status}`,
    );
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
  const response = await fetch(
    `${API_BASE_URL}/approval/${encodeURIComponent(id)}/approve`,
    {
      method: 'POST',
      headers: reviewerHeaders,
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to approve request: ${response.status}`,
    );
  }

  return response.json();
}

export async function rejectRequest(
  id: string,
): Promise<ApprovalRequest> {
  const response = await fetch(
    `${API_BASE_URL}/approval/${encodeURIComponent(id)}/reject`,
    {
      method: 'POST',
      headers: reviewerHeaders,
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to reject request: ${response.status}`,
    );
  }

  return response.json();
}