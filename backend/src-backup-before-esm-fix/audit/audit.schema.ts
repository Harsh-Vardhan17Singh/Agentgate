import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AuditDocument = HydratedDocument<Audit>;

@Schema({ timestamps: false })
export class Audit {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  timestamp: string;

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

  @Prop({ required: true })
  event: string;
}

export const AuditSchema = SchemaFactory.createForClass(Audit);