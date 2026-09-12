import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GatewayModule } from './gateway/gateway.module';
import { PolicyModule } from './policy/policy.module';
import { RiskModule } from './risk/risk.module';
import { ToolsModule } from './tools/tools.module';
import { ApprovalModule } from './approval/approval.module';

@Module({
  imports: [
    GatewayModule,
    PolicyModule,
    RiskModule,
    ToolsModule,
    ApprovalModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}