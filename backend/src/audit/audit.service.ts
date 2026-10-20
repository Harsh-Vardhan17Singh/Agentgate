import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  AuditEvent,
  AuditEventDocument,
  AuditEventType,
} from './schemas/audit-event.schema.js';

export interface AuditEventInput {
  agentId: string;
  tool: string;
  operation: string;
  target: string;
  decision: string;
  riskScore: number;
  riskLevel: string;
  executed: boolean;
  approvalId?:string;
  event: AuditEventType;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditEvent.name)
    private readonly auditEventModel: Model<AuditEventDocument>,
  ) {}

  async record(event: AuditEventInput): Promise<AuditEventDocument> {
    const auditEvent = new this.auditEventModel(event);

    const savedEvent = await auditEvent.save();

   console.log(
  '[AUDIT]',
  JSON.stringify({
    event: savedEvent.event,
    tool: savedEvent.tool,
    operation: savedEvent.operation,
    decision: savedEvent.decision,
  }),
);

    return savedEvent;
  }

 async getEvents(
  approvalId?: string,
): Promise<AuditEventDocument[]> {
  const filter = approvalId ? { approvalId } : {};

  return this.auditEventModel
    .find(filter)
    .sort({ createdAt: -1 })
    .exec();
}
}