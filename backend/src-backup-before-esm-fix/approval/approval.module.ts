import { Module } from '@nestjs/common';
import { ApprovalController } from './approval.controller';
import { ApprovalService } from './approval.service';
import { ExecutionModule } from '../execution/execution.module';
import { AuditModule } from '../audit/audit.module';
import { ReviewerAuthGuard } from '../auth/reviewer-auth.guard';

@Module({
  imports: [ExecutionModule, AuditModule],
  controllers: [ApprovalController],
  providers: [ApprovalService,
    ReviewerAuthGuard,
  ],
  exports: [ApprovalService],
})
export class ApprovalModule {}