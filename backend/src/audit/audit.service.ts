import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  AuditEvent,
  AuditEventDocument,
  AuditEventType,
} from './schemas/audit-event.schema';

export interface AuditEventInput {
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
    @InjectModel(AuditEvent.name)
    private readonly auditEventModel: Model<AuditEventDocument>,
  ) {}

  async record(event: AuditEventInput): Promise<AuditEventDocument> {
    const auditEvent = new this.auditEventModel(event);

    const savedEvent = await auditEvent.save();

    console.log(
      '[AUDIT]',
      JSON.stringify(savedEvent.toObject(), null, 2),
    );

    return savedEvent;
  }

  async getEvents(): Promise<AuditEventDocument[]> {
    return this.auditEventModel
      .find()
      .sort({ createdAt: -1 })
      .exec();
  }
}