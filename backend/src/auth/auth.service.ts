import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Agent,
  AgentDocument,
} from './schemas/agent.schema';

export interface AgentIdentity {
  agentId: string;
  name: string;
  active: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Agent.name)
    private readonly agentModel: Model<AgentDocument>,
  ) {}

  async authenticate(apiKey: string): Promise<AgentIdentity> {
    const agent = await this.agentModel
      .findOne({
        apiKey,
        active: true,
      })
      .exec();

    if (!agent) {
      throw new UnauthorizedException(
        'Invalid or inactive agent credentials',
      );
    }

    return {
      agentId: agent.agentId,
      name: agent.name,
      active: agent.active,
    };
  }
}