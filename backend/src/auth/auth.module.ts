import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthService } from './auth.service.js';
import { AuthorizationService } from './authorization.service.js';
import { AgentService } from './agent.service.js';
import { AgentSeedService } from './agent-seed.service.js';
import { AgentController } from './agent.controller.js';

import {
  Agent,
  AgentSchema,
} from './schemas/agent.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Agent.name,
        schema: AgentSchema,
      },
    ]),
  ],
  controllers: [AgentController],
  providers: [
    AuthService,
    AuthorizationService,
    AgentService,
    AgentSeedService,
  ],
  exports: [
    AuthService,
    AuthorizationService,
    AgentService,
  ],
})
export class AuthModule {}