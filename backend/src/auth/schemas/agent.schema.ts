import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AgentDocument = HydratedDocument<Agent>;

@Schema({
  timestamps: true,
  collection: 'agents',
})
export class Agent {
  @Prop({
    required: true,
    unique: true,
    index: true,
  })
  agentId: string;

  @Prop({
    required: true,
  })
  name: string;

  @Prop({
    required: true,
    unique: true,
    index: true,
  })
  apiKey: string;

  @Prop({
    required: true,
    default: true,
  })
  active: boolean;


@Prop({
  type:[String],
  default:[],
})
permission:string[];

}

export const AgentSchema = SchemaFactory.createForClass(Agent);