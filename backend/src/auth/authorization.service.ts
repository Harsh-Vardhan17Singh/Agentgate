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
export class AuthorizationService {
  constructor(
    @InjectModel(Agent.name)
    private readonly agentModel: Model<AgentDocument>,
  ) {}

  async authorize(
    agentId: string,
    tool: string,
    operation: string,
  ): Promise<boolean> {
    const agent = await this.agentModel
      .findOne({
        agentId,
        active: true,
      })
      .select('permissions')
      .exec();

    if (!agent) {
      throw new NotFoundException(
        `Agent '${agentId}' not found`,
      );
    }

    const requiredPermission = `${tool}:${operation}`;

    return agent.permissions.includes(
      requiredPermission,
    );
  }
}