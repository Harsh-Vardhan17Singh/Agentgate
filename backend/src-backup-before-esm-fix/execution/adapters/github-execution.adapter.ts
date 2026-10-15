import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotImplementedException,
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

  private getBranchArguments(
    request: ToolCallDto,
  ): {
    branch: string;
    sourceBranch: string;
  } {
    const argumentsObject = request.arguments;

    if (!argumentsObject) {
      throw new BadRequestException(
        'GitHub create_branch requires arguments.',
      );
    }

    const branch = argumentsObject.branch;
    const sourceBranch =
      argumentsObject.sourceBranch;

    if (
      typeof branch !== 'string' ||
      branch.trim() === ''
    ) {
      throw new BadRequestException(
        'GitHub create_branch requires a valid branch argument.',
      );
    }

    if (
      typeof sourceBranch !== 'string' ||
      sourceBranch.trim() === ''
    ) {
      throw new BadRequestException(
        'GitHub create_branch requires a valid sourceBranch argument.',
      );
    }

    if (branch === 'main') {
      throw new BadRequestException(
        'AgentGate does not allow creating the main branch.',
      );
    }

    if (branch === sourceBranch) {
      throw new BadRequestException(
        'New branch must be different from sourceBranch.',
      );
    }

    return {
      branch: branch.trim(),
      sourceBranch: sourceBranch.trim(),
    };
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

    if (request.operation === 'create_branch') {
      const {
        branch,
        sourceBranch,
      } = this.getBranchArguments(request);

      const result =
        await this.githubApiService.createBranch(
          branch,
          sourceBranch,
        );

      return {
        tool: request.tool,
        operation: request.operation,
        target: request.target,
        status: 'SUCCESS',
        simulated: false,
        executedAt: new Date().toISOString(),
        data: {
          branch,
          sourceBranch,
          github: result,
        },
      };
    }

        if (request.operation === 'delete_branch') {
      const argumentsObject = request.arguments;

      if (!argumentsObject) {
        throw new BadRequestException(
          'GitHub delete_branch requires arguments.',
        );
      }

      const branch = argumentsObject.branch;

      if (
        typeof branch !== 'string' ||
        branch.trim() === ''
      ) {
        throw new BadRequestException(
          'GitHub delete_branch requires a valid branch argument.',
        );
      }

      const result =
        await this.githubApiService.deleteBranch(
          branch.trim(),
        );

      return {
        tool: request.tool,
        operation: request.operation,
        target: request.target,
        status: 'SUCCESS',
        simulated: false,
        executedAt: new Date().toISOString(),
        data: {
          branch: branch.trim(),
          github: result,
        },
      };
    }

    throw new NotImplementedException(
  `GitHub operation '${request.operation}' is not implemented yet.`,
);
  }
}