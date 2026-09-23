import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';

import { AgentService } from './agent.service';

@Controller('agents')
export class AgentController {
  constructor(
    private readonly agentService: AgentService,
  ) {}

  @Get()
  getAllAgents() {
    return this.agentService.getAllAgents();
  }

  @Get(':agentId')
  getAgent(
    @Param('agentId') agentId: string,
  ) {
    return this.agentService.getAgent(agentId);
  }
}