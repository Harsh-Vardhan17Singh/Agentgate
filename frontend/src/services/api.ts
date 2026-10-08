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
  timestamp?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export async function getAuditLogs(): Promise<AuditEvent[]> {
  const response = await fetch(
    `${API_BASE_URL}/audit`,
    {
      headers: REVIEWER_KEY
        ? {
            'x-reviewer-key': REVIEWER_KEY,
          }
        : {},
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch audit logs: ${response.status}`,
    );
  }

  return response.json();
}