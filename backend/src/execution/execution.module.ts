import { Module } from '@nestjs/common';

import { ExecutionService } from './execution.service';
import { GitHubExecutionAdapter } from './adapters/github-execution.adapter';

@Module({
  providers: [
    ExecutionService,
    GitHubExecutionAdapter,
  ],
  exports: [
    ExecutionService,
  ],
})
export class ExecutionModule {}