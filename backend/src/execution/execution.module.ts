import { Module } from '@nestjs/common';

import { ExecutionService } from './execution.service.js';
import { GitHubExecutionAdapter } from './adapters/github-execution.adapter.js';
import { GitHubApiService } from './github-api.service.js';

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