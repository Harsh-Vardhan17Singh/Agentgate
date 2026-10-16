import { ToolCallDto } from '../gateway/dto/tool-call.dto';

export interface ExecutionAdapter {
  supports(
    tool: string,
    operation: string,
  ): boolean;

  execute(
    request: ToolCallDto,
  ): Promise<ExecutionAdapterResult>;
}

export interface ExecutionAdapterResult {
  tool: string;
  operation: string;
  target: string;
  status: 'SUCCESS' | 'FAILED';
  simulated: boolean;
  executedAt: string;
  data?: Record<string, unknown>;
  error?: string;
}