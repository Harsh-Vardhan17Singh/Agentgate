import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Agent,
  AgentDocument,
} from './schemas/agent.schema';

@Injectable()
export class AgentSeedService implements OnModuleInit {
  constructor(
    @InjectModel(Agent.name)
    private readonly agentModel: Model<AgentDocument>,
  ) {}

  async onModuleInit() {
    const agents = [
      {
        agentId: 'demo-agent',
        name: 'Development Agent',
        apiKey: 'dev-agent-key',
        active: true,
        permissions: [
          'github:list_branches',
          'github:create_branch',
        ],
      },
      {
        agentId: 'admin-agent',
        name: 'Admin Agent',
        apiKey: 'admin-agent-key',
        active: true,
        permissions: [
          'github:list_branches',
          'github:create_branch',
          'github:delete_branch',
          'email:send_email',
        ],
      },
    ];

    for (const agent of agents) {
      await this.agentModel.updateOne(
        { agentId: agent.agentId },
        {
          $set: {
            name: agent.name,
            active: agent.active,
            permissions: agent.permissions,
          },
          $setOnInsert: {
            agentId: agent.agentId,
            apiKey: agent.apiKey,
          },
        },
        { upsert: true },
      );
    }

    console.log('[AUTH] Development agents verified.');
  }
}