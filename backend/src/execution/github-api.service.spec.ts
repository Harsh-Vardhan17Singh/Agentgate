import { jest } from '@jest/globals';
import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GitHubApiService } from './github-api.service.js';

describe('GitHubApiService branch deletion security', () => {
  let service: GitHubApiService;
  let fetchMock: jest.Mock<typeof fetch>;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    fetchMock = jest.fn<typeof fetch>();

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    const configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          GITHUB_TOKEN: 'test-token',
          GITHUB_OWNER: 'test-owner',
          GITHUB_REPOSITORY: 'test-repo',
        };

        return values[key];
      }),
    };

    service = new GitHubApiService(
      configService as unknown as ConfigService,
    );
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: originalFetch,
    });

    jest.restoreAllMocks();
  });

  it('rejects deletion of the default branch without sending DELETE', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ default_branch: 'main' }),
        { status: 200 },
      ),
    );

    await expect(service.deleteBranch('main')).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/test-owner/test-repo',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('rejects an invalid branch name without making an HTTP request', async () => {
    await expect(
      service.deleteBranch('bad..branch'),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('deletes a non-default branch after checking the default branch', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ default_branch: 'main' }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(null, { status: 204 }),
      );

    await expect(
      service.deleteBranch('feature/test'),
    ).resolves.toEqual({
      branch: 'feature/test',
      deleted: true,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.github.com/repos/test-owner/test-repo/git/refs/heads/feature/test',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});