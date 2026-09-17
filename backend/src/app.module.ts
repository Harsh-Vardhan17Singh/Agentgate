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

import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MongooseModule.forRoot(process.env.MONGODB_URI!),

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