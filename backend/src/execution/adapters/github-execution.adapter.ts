import {
  Injectable,
  ForbiddenException,
} from '@nestjs/common';

import { ToolCallDto } from '../../gateway/dto/tool-call.dto';

import {
  ExecutionAdapter,
  ExecutionAdapterResult,
} from '../execution-adapter.interface';

import { GitHubApiService } from '../github-api.service';

@Injectable()
export class GitHubExecutionAdapter
  implements ExecutionAdapter
{
  constructor(
    private readonly githubApiService: GitHubApiService,
  ) {}

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

  private validateTarget(target: string): void {
    const configuredRepository =
      this.githubApiService.getConfiguredRepository();

    if (target !== configuredRepository) {
      throw new ForbiddenException(
        `GitHub target '${target}' is not authorized. ` +
          `AgentGate is configured for '${configuredRepository}'.`,
      );
    }
  }

  async execute(
    request: ToolCallDto,
  ): Promise<ExecutionAdapterResult> {
    this.validateTarget(request.target);

    if (request.operation === 'list_branches') {
      const branches =
        await this.githubApiService.listBranches();

      return {
        tool: request.tool,
        operation: request.operation,
        target: request.target,
        status: 'SUCCESS',
        simulated: false,
        executedAt: new Date().toISOString(),
        data: {
          branches,
        },
      };
    }

    return {
      tool: request.tool,
      operation: request.operation,
      target: request.target,
      status: 'FAILED',
      simulated: true,
      executedAt: new Date().toISOString(),
      error:
        `GitHub operation '${request.operation}' ` +
        'is not implemented yet.',
    };
  }
}                                              