import {
  Body,
  Controller,
  Headers,
  Post,
} from '@nestjs/common';

import { GatewayService } from './gateway.service';
import { ToolCallDto } from './dto/tool-call.dto';
import { AuthService } from '../auth/auth.service';

@Controller('gateway')
export class GatewayController {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly authService: AuthService,
  ) {}

  @Post('tool-call')
  processToolCall(
    @Headers('x-agent-key') agentKey: string,
    @Body() request: ToolCallDto,
  ) {
    const agent = this.authService.authenticate(agentKey);

    request.agentId = agent.agentId;

    return this.gatewayService.processToolCall(request);
  }
}