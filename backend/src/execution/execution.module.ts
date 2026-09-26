import { Module } from '@nestjs/common';

import { ExecutionService } from './execution.service';
import { GitHubExecutionAdapter } from './adapters/github-execution.adapter';
import { GitHubApiService } from './github-api.service';

@Module({
  providers: [
    ExecutionService,
    GitHubExecutionAdapter,
    GitHubApiService,
  ],
  exports: [
    ExecutionService,
  ],
})
export class ExecutionModule {}