import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AuditEventDocument = HydratedDocument<AuditEvent>;

export type AuditEventType =
  | 'BLOCKED'
  | 'APPROVAL_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXECUTED';

@Schema({
  timestamps: true,
  collection: 'audit_events',
})
export class AuditEvent {
  @Prop({ required: true })
  agentId: string;

  @Prop({ required: true })
  tool: string;

  @Prop({ required: true })
  operation: string;

  @Prop({ required: true })
  target: string;

  @Prop({ required: true })
  decision: string;

  @Prop({ required: true })
  riskScore: number;

  @Prop({ required: true })
  riskLevel: string;

  @Prop({ required: true })
  executed: boolean;

  @Prop({
    required: true,
    enum: [
      'BLOCKED',
      'APPROVAL_REQUIRED',
      'APPROVED',
      'REJECTED',
      'EXECUTED',
    ],
  })
  event: AuditEventType;
}

export const AuditEventSchema =
  SchemaFactory.createForClass(AuditEvent);