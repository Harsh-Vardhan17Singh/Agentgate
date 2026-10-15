
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

@Injectable()
export class GitHubApiService {
  private readonly token: string;
  private readonly owner: string;
  private readonly repository: string;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.token =
      this.configService.get<string>('GITHUB_TOKEN') ?? '';

    this.owner =
      this.configService.get<string>('GITHUB_OWNER') ?? '';

    this.repository =
      this.configService.get<string>('GITHUB_REPOSITORY') ?? '';

    if (!this.token) {
      throw new InternalServerErrorException(
        'GITHUB_TOKEN is not configured.',
      );
    }

    if (!this.owner) {
      throw new InternalServerErrorException(
        'GITHUB_OWNER is not configured.',
      );
    }

    if (!this.repository) {
      throw new InternalServerErrorException(
        'GITHUB_REPOSITORY is not configured.',
      );
    }
  }

  getConfiguredRepository(): string {
    return `${this.owner}/${this.repository}`;
  }

  private getRepositoryUrl(): string {
    return (
      `https://api.github.com/repos/` +
      `${encodeURIComponent(this.owner)}/` +
      `${encodeURIComponent(this.repository)}`
    );
  }

  private getHeaders() {
    return {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${this.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }

  private validateBranchName(branchName: string): void {
    if (
      typeof branchName !== 'string' ||
      branchName.trim() === '' ||
      branchName !== branchName.trim() ||
      branchName.startsWith('-') ||
      branchName.startsWith('/') ||
      branchName.endsWith('/') ||
      branchName.endsWith('.') ||
      branchName.includes('..') ||
      branchName.includes('//') ||
      branchName.includes('@{') ||
      /[\x00-\x20\x7f~^:?*[\]\\]/.test(branchName) ||
      branchName.split('/').some(
        (part) =>
          part === '' ||
          part.startsWith('.') ||
          part.endsWith('.lock'),
      )
    ) {
      throw new BadRequestException(
        'Invalid Git branch name.',
      );
    }
  }

  private async handleGitHubError(
    response: Response,
    operation: string,
  ): Promise<never> {
    const errorText = await response.text();
    let message = errorText;

    try {
      const parsed = JSON.parse(errorText);

      if (typeof parsed?.message === 'string') {
        message = parsed.message;
      }
    } catch {
      // Keep the original response text.
    }

    throw new HttpException(
      `GitHub ${operation} failed: ${message}`,
      response.status,
    );
  }

  async listBranches() {
    const response = await fetch(
      `${this.getRepositoryUrl()}/branches`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      },
    );

    if (!response.ok) {
      return this.handleGitHubError(
        response,
        'branch listing',
      );
    }

    return response.json();
  }

  async createBranch(
    branchName: string,
    sourceBranch: string,
  ) {
    this.validateBranchName(branchName);
    this.validateBranchName(sourceBranch);

    if (branchName === 'main') {
      throw new BadRequestException(
        'AgentGate does not allow creating the main branch.',
      );
    }

    if (branchName === sourceBranch) {
      throw new BadRequestException(
        'New branch must differ from sourceBranch.',
      );
    }

    const sourceResponse = await fetch(
      `${this.getRepositoryUrl()}/git/ref/heads/` +
        sourceBranch.split('/').map(encodeURIComponent).join('/'),
      {
        method: 'GET',
        headers: this.getHeaders(),
      },
    );

    if (!sourceResponse.ok) {
      return this.handleGitHubError(
        sourceResponse,
        'source branch lookup',
      );
    }

    const sourceData = (await sourceResponse.json()) as {
      object?: { sha?: string };
    };

    const sourceSha = sourceData.object?.sha;

    if (!sourceSha) {
      throw new InternalServerErrorException(
        'GitHub source branch did not return a commit SHA.',
      );
    }

    const response = await fetch(
      `${this.getRepositoryUrl()}/git/refs`,
      {
        method: 'POST',
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: sourceSha,
        }),
      },
    );

    if (!response.ok) {
      return this.handleGitHubError(
        response,
        'branch creation',
      );
    }

    return response.json();
  }

  async getDefaultBranch(): Promise<string> {
    const response = await fetch(
      this.getRepositoryUrl(),
      {
        method: 'GET',
        headers: this.getHeaders(),
      },
    );

    if (!response.ok) {
      return this.handleGitHubError(
        response,
        'repository lookup',
      );
    }

    const repositoryData = (await response.json()) as {
      default_branch?: string;
    };

    if (!repositoryData.default_branch) {
      throw new InternalServerErrorException(
        'GitHub did not return the repository default branch.',
      );
    }

    return repositoryData.default_branch;
  }

  async deleteBranch(branchName: string) {
    this.validateBranchName(branchName);

    const defaultBranch = await this.getDefaultBranch();

    if (branchName === defaultBranch) {
      throw new ForbiddenException(
        'AgentGate does not allow deleting the repository default branch.',
      );
    }

    const encodedBranch = branchName
      .split('/')
      .map(encodeURIComponent)
      .join('/');

    const response = await fetch(
      `${this.getRepositoryUrl()}/git/refs/heads/${encodedBranch}`,
      {
        method: 'DELETE',
        headers: this.getHeaders(),
      },
    );

    if (!response.ok) {
      return this.handleGitHubError(
        response,
        'branch deletion',
      );
    }

    return {
      branch: branchName,
      deleted: true,
    };
  }
}