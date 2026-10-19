
import { Test, TestingModule } from '@nestjs/testing';
import { jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { ExecutionService } from './execution.service.js';
import { GitHubExecutionAdapter } from './adapters/github-execution.adapter.js';
import { ToolCallDto } from '../gateway/dto/tool-call.dto.js';

describe('ExecutionService', () => {
  let service: ExecutionService;

  const githubExecutionAdapter = {
    supports: jest.fn<(tool: string, operation: string) => boolean>(),
    execute: jest.fn<(request: ToolCallDto) => Promise<{
      tool: string;
      operation: string;
      target: string;
      status: 'SUCCESS' | 'FAILED';
      simulated: boolean;
      executedAt: string;
    }>>(),
  };

  const request = {
    tool: 'github',
    operation: 'list_branches',
    target: 'example-owner/example-repo',
  } as ToolCallDto;

  beforeEach(async () => {
    jest.clearAllMocks();

    githubExecutionAdapter.supports.mockReturnValue(true);
    githubExecutionAdapter.execute.mockResolvedValue({
      tool: 'github',
      operation: 'list_branches',
      target: 'example-owner/example-repo',
      status: 'SUCCESS',
      simulated: false,
      executedAt: new Date().toISOString(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecutionService,
        {
          provide: GitHubExecutionAdapter,
          useValue: githubExecutionAdapter,
        },
      ],
    }).compile();

    service = module.get<ExecutionService>(ExecutionService);
  });

  it('dispatches the exact request to its supported adapter', async () => {
  const result = await service.execute(request);

  expect(githubExecutionAdapter.supports).toHaveBeenCalledWith(
    'github',
    'list_branches',
  );

  const dispatchedRequest =
    githubExecutionAdapter.execute.mock.calls[0][0];

  expect(dispatchedRequest).toBe(request);
  expect(dispatchedRequest).toEqual(request);
  expect(result.status).toBe('SUCCESS');
});

  it('rejects an unsupported operation without executing it', async () => {
    githubExecutionAdapter.supports.mockReturnValue(false);

    await expect(
      service.execute({
        ...request,
        operation: 'delete_repository',
      } as ToolCallDto),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(githubExecutionAdapter.execute).not.toHaveBeenCalled();
  });

  it('propagates adapter execution errors', async () => {
    const error = new Error('GitHub API unavailable');
    githubExecutionAdapter.execute.mockRejectedValue(error);

    await expect(service.execute(request)).rejects.toThrow(
      'GitHub API unavailable',
    );
  });
});
