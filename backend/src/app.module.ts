import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GatewayModule } from './gateway/gateway.module';
import { PolicyModule } from './policy/policy.module';
import { RiskModule } from './risk/risk.module';
import { ToolsModule } from './tools/tools.module';
import { ApprovalModule } from './approval/approval.module';
import { ExecutionModule } from './execution/execution.module';
import { AuditModule } from './audit/audit.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/agentgate',
    ),
    
    GatewayModule,
    PolicyModule,
    RiskModule,
    ToolsModule,
    ApprovalModule,
    ExecutionModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}