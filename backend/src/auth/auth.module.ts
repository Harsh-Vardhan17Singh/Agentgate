import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthService } from './auth.service';
import { AgentSeedService } from './agent-seed.service';

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
  providers: [
    AuthService,
    AgentSeedService,
  ],
  exports: [AuthService],
})
export class AuthModule {}