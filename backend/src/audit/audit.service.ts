import { Injectable } from '@nestjs/common';

export type AuditEventType =
  | 'BLOCKED'
  | 'APPROVAL_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXECUTED';

export interface AuditEvent {
  id: string;
  timestamp: string;

  agentId: string;
  tool: string;
  operation: string;
  target: string;

  decision: string;

  riskScore: number;
  riskLevel: string;

  executed: boolean;

  event: AuditEventType;
}

@Injectable()
export class AuditService {
  private readonly events: AuditEvent[] = [];

  record(event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
    const auditEvent: AuditEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...event,
    };

    this.events.push(auditEvent);

    console.log(
      '[AUDIT]',
      JSON.stringify(auditEvent, null, 2),
    );

    return auditEvent;
  }

  getEvents(): AuditEvent[] {
    return [...this.events];
  }
}