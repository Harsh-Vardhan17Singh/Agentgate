import { Body, Controller, Post } from '@nestjs/common';
import { GatewayService } from './gateway.service';
import { ToolCallDto } from './dto/tool-call.dto';

@Controller('gateway')
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @Post('tool-call')
  processToolCall(@Body() request: ToolCallDto) {
    return this.gatewayService.processToolCall(request);
  }
}