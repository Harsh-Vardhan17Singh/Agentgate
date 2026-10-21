import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ApprovalController } from './approval.controller.js';
import { ApprovalService } from './approval.service.js';
import { Approval, ApprovalSchema } from './schemas/approval.schema.js';

import { ExecutionModule } from '../execution/execution.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { ReviewerAuthGuard } from '../auth/reviewer-auth.guard.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Approval.name,
        schema: ApprovalSchema,
      },
    ]),
    ExecutionModule,
    AuditModule,
  ],
  controllers: [ApprovalController],
  providers: [ApprovalService, ReviewerAuthGuard],
  exports: [ApprovalService],
})
export class ApprovalModule {}