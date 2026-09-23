import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthService } from './auth.service';
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
    AgentService,
    AgentSeedService,
  ],
  exports: [
    AuthService,
    AgentService,
  ],
})
export class AuthModule {}