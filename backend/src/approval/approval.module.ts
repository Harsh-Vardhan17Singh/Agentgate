import { Module } from '@nestjs/common';
import { ApprovalController } from './approval.controller.js';
import { ApprovalService } from './approval.service.js';
import { ExecutionModule } from '../execution/execution.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { ReviewerAuthGuard } from '../auth/reviewer-auth.guard.js';

@Module({
  imports: [ExecutionModule, AuditModule],
  controllers: [ApprovalController],
  providers: [ApprovalService,
    ReviewerAuthGuard,
  ],
  exports: [ApprovalService],
})
export class ApprovalModule {}