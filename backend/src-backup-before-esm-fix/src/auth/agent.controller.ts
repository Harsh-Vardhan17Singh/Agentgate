import {
  Controller,
  Get,
  Param,
  Patch,
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

  @Patch(':agentId/activate')
  activateAgent(
    @Param('agentId') agentId: string,
  ) {
    return this.agentService.setAgentStatus(
      agentId,
      true,
    );
  }

  @Patch(':agentId/deactivate')
  deactivateAgent(
    @Param('agentId') agentId: string,
  ) {
    return this.agentService.setAgentStatus(
      agentId,
      false,
    );
  }
}