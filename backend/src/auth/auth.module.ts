import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthService } from './auth.service';
import { AuthorizationService } from './authorization.service';
import { AgentService } from './agent.service';
import { AgentSeedService } from './agent-seed.service';
import { AgentController } from './agent.controller';

import {
  Agent,
  AgentSchema,
} from './schemas/agent.schema';

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