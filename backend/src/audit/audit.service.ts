import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Audit, AuditDocument } from './audit.schema';

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
  constructor(
    @InjectModel(Audit.name)
    private readonly auditModel: Model<AuditDocument>,
  ) {}

  async record(
    event: Omit<AuditEvent, 'id' | 'timestamp'>,
  ): Promise<AuditEvent> {
    const auditEvent: AuditEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...event,
    };

    await this.auditModel.create(auditEvent);

    console.log(
      '[AUDIT]',
      JSON.stringify(auditEvent, null, 2),
    );

    return auditEvent;
  }

  async getEvents(): Promise<AuditEvent[]> {
    return this.auditModel
      .find()
      .sort({ timestamp: -1 })
      .lean<AuditEvent[]>()
      .exec();
  }
}