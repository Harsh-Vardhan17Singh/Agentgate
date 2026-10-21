import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type ApprovalDocument = HydratedDocument<Approval>;

@Schema({
  timestamps: true,
  collection: 'approvals',
})
export class Approval {
  @Prop({
    required: true,
    unique: true,
    index: true,
  })
  id: string;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    required: true,
  })
  request: Record<string, unknown>;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    required: true,
  })
  risk: Record<string, unknown>;

  @Prop({
    required: true,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
    index: true,
  })
  status: 'PENDING' | 'APPROVED' | 'REJECTED';

  @Prop({
    required: true,
    enum: ['NOT_EXECUTED', 'EXECUTED', 'FAILED'],
    default: 'NOT_EXECUTED',
  })
  executionStatus: 'NOT_EXECUTED' | 'EXECUTED' | 'FAILED';

  @Prop({ required: true })
  createdAt: Date;

  @Prop()
  reviewedAt?: Date;

  @Prop()
  executedAt?: Date;
}

export const ApprovalSchema = SchemaFactory.createForClass(Approval);