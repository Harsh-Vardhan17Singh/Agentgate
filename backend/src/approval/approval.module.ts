import { Module } from '@nestjs/common';
import { ApprovalController } from './approval.controller';
import { ApprovalService } from './approval.service';
import { ExecutionModule} from '../execution/execution.module'
import { AuditModule } from '../audit/audit.module';

@Module({
  imports:[ExecutionModule, AuditModule],
  controllers: [ApprovalController],
  providers: [ApprovalService],
  exports: [ApprovalService],
})
export class ApprovalModule {}