import { Injectable } from '@nestjs/common';
import { ToolCallDto } from '../gateway/dto/tool-call.dto';

export interface ExecutionResult {
  tool: string;
  operation: string;
  target: string;
  status: 'SUCCESS' | 'FAILED';
  simulated: boolean;
  executedAt: string;
}

@Injectable()
export class ExecutionService {
  execute(request: ToolCallDto): ExecutionResult {
    return {
      tool: request.tool,
      operation: request.operation,
      target: request.target,
      status: 'SUCCESS',
      simulated: true,
      executedAt: new Date().toISOString(),
    };
  }
}