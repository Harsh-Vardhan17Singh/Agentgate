import {
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
      this.configService.get<string>(
        'GITHUB_TOKEN',
      ) ?? '';

    this.owner =
      this.configService.get<string>(
        'GITHUB_OWNER',
      ) ?? '';

    this.repository =
      this.configService.get<string>(
        'GITHUB_REPOSITORY',
      ) ?? '';

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

  async listBranches() {
    const url =
      `https://api.github.com/repos/` +
      `${this.owner}/${this.repository}/branches`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${this.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();

      throw new InternalServerErrorException(
        `GitHub API request failed (${response.status}): ${errorText}`,
      );
    }

    return response.json();
  }
}