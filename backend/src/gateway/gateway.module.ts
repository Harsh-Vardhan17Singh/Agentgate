import { Module } from '@nestjs/common';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { PolicyModule } from '../policy/policy.module';
import { RiskModule } from '../risk/risk.module';
import { ToolsModule } from '../tools/tools.module';
import { ApprovalModule } from '../approval/approval.module';
import { ExecutionModule } from '../execution/execution.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PolicyModule,
            RiskModule,
            ToolsModule,
            ApprovalModule,
            ExecutionModule,
            AuditModule,
           ],
  controllers: [GatewayController],
  providers: [GatewayService],
})
export class GatewayModule {}