
import { jest } from '@jest/globals';
import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { GitHubExecutionAdapter } from './github-execution.adapter.js';
import { GitHubApiService } from '../github-api.service.js';
import { ToolCallDto } from '../../gateway/dto/tool-call.dto.js';

describe('GitHubExecutionAdapter security', () => {
  const configuredRepository = 'test-owner/test-repo';

  const githubApiService = {
    getConfiguredRepository: jest.fn<() => string>(),
    listBranches: jest.fn<() => Promise<unknown>>(),
    createBranch: jest.fn<
      (branch: string, sourceBranch: string) => Promise<unknown>
    >(),
    deleteBranch: jest.fn<(branch: string) => Promise<unknown>>(),
  };

  let adapter: GitHubExecutionAdapter;

  beforeEach(() => {
    jest.clearAllMocks();

    githubApiService.getConfiguredRepository.mockReturnValue(
      configuredRepository,
    );
    githubApiService.listBranches.mockResolvedValue([]);
    githubApiService.createBranch.mockResolvedValue({});
    githubApiService.deleteBranch.mockResolvedValue({ deleted: true });

    adapter = new GitHubExecutionAdapter(
      githubApiService as unknown as GitHubApiService,
    );
  });

  it('rejects a target other than the configured repository', async () => {
    const request = {
      tool: 'github',
      operation: 'list_branches',
      target: 'attacker/other-repo',
    } as ToolCallDto;

    await expect(adapter.execute(request)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expect(githubApiService.listBranches).not.toHaveBeenCalled();
    expect(githubApiService.createBranch).not.toHaveBeenCalled();
    expect(githubApiService.deleteBranch).not.toHaveBeenCalled();
  });

  it('propagates default-branch deletion rejection from the API service', async () => {
    githubApiService.deleteBranch.mockRejectedValue(
      new ForbiddenException(
        'AgentGate does not allow deleting the repository default branch.',
      ),
    );

    const request = {
      tool: 'github',
      operation: 'delete_branch',
      target: configuredRepository,
      arguments: { branch: 'main' },
    } as ToolCallDto;

    await expect(adapter.execute(request)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expect(githubApiService.deleteBranch).toHaveBeenCalledWith('main');
  });

  it('propagates invalid branch-name rejection from the API service', async () => {
    githubApiService.deleteBranch.mockRejectedValue(
      new BadRequestException('Invalid Git branch name.'),
    );

    const request = {
      tool: 'github',
      operation: 'delete_branch',
      target: configuredRepository,
      arguments: { branch: 'bad..branch' },
    } as ToolCallDto;

    await expect(adapter.execute(request)).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(githubApiService.deleteBranch).toHaveBeenCalledWith(
      'bad..branch',
    );
  });
});
