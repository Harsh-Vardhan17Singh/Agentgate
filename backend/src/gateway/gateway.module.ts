import { Module } from '@nestjs/common';
import { GatewayController } from './gateway.controller.js';
import { GatewayService } from './gateway.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { PolicyModule } from '../policy/policy.module.js';
import { RiskModule } from '../risk/risk.module.js';
import { ToolsModule } from '../tools/tools.module.js';
import { ApprovalModule } from '../approval/approval.module.js';
import { ExecutionModule } from '../execution/execution.module.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [AuthModule,
            PolicyModule,
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