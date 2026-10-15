import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ToolCallDto } from '../gateway/dto/tool-call.dto';

import {
  ExecutionAdapter,
  ExecutionAdapterResult,
} from './execution-adapter.interface';

import { GitHubExecutionAdapter } from './adapters/github-execution.adapter';

@Injectable()
export class ExecutionService {
  private readonly adapters: ExecutionAdapter[];

  constructor(
    private readonly githubExecutionAdapter: GitHubExecutionAdapter,
  ) {
    this.adapters = [
      this.githubExecutionAdapter,
    ];
  }

  async execute(
    request: ToolCallDto,
  ): Promise<ExecutionAdapterResult> {
    const adapter = this.adapters.find((candidate) =>
      candidate.supports(
        request.tool,
        request.operation,
      ),
    );

    if (!adapter) {
      throw new NotFoundException(
        `No execution adapter found for '${request.tool}:${request.operation}'`,
      );
    }

    return adapter.execute(request);
  }
}