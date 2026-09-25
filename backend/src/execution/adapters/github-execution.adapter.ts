import { Injectable } from '@nestjs/common';

import { ToolCallDto } from '../../gateway/dto/tool-call.dto';
import {
  ExecutionAdapter,
  ExecutionAdapterResult,
} from '../execution-adapter.interface';

@Injectable()
export class GitHubExecutionAdapter
  implements ExecutionAdapter
{
  supports(
    tool: string,
    operation: string,
  ): boolean {
    return (
      tool === 'github' &&
      [
        'list_branches',
        'create_branch',
        'delete_branch',
      ].includes(operation)
    );
  }

  async execute(
    request: ToolCallDto,
  ): Promise<ExecutionAdapterResult> {
    return {
      tool: request.tool,
      operation: request.operation,
      target: request.target,
      status: 'SUCCESS',
      simulated: true,
      executedAt: new Date().toISOString(),
      data: {
        message:
          'GitHub execution adapter reached successfully.',
      },
    };
  }
}