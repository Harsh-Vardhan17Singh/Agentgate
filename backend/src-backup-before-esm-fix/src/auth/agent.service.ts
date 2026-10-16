import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Agent,
  AgentDocument,
} from './schemas/agent.schema';

@Injectable()
export class AgentService {
  constructor(
    @InjectModel(Agent.name)
    private readonly agentModel: Model<AgentDocument>,
  ) {}

  async getAllAgents() {
    return this.agentModel
      .find()
      .select('-apiKey')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getAgent(agentId: string) {
    const agent = await this.agentModel
      .findOne({ agentId })
      .select('-apiKey')
      .exec();

    if (!agent) {
      throw new NotFoundException(
        `Agent '${agentId}' not found`,
      );
    }

    return agent;
  }

  async setAgentStatus(
    agentId: string,
    active: boolean,
  ) {
    const agent = await this.agentModel
      .findOneAndUpdate(
        { agentId },
        { $set: { active } },
        {
          new: true,
        },
      )
      .select('-apiKey')
      .exec();

    if (!agent) {
      throw new NotFoundException(
        `Agent '${agentId}' not found`,
      );
    }

    return agent;
  }
}