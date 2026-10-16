import {
  Body,
  Controller,
  Headers,
  Post,
} from '@nestjs/common';

import { GatewayService } from './gateway.service.js';
import { ToolCallDto } from './dto/tool-call.dto.js';
import { AuthenticatedToolCall } from './dto/authenticated-tool-call.js';
import { AuthService } from '../auth/auth.service.js';

@Controller('gateway')
export class GatewayController {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly authService: AuthService,
  ) {}

  @Post('tool-call')
  async processToolCall(
    @Headers('x-agent-key') agentKey: string,
    @Body() request: ToolCallDto,
  ) {
    const agent = await this.authService.authenticate(agentKey);

    const authenticatedRequest: AuthenticatedToolCall = {
      ...request,
      agentId: agent.agentId,
    };

    return this.gatewayService.processToolCall(
      authenticatedRequest,
    );
  }
}