import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

import { GatewayModule } from './gateway/gateway.module.js';
import { PolicyModule } from './policy/policy.module.js';
import { RiskModule } from './risk/risk.module.js';
import { ToolsModule } from './tools/tools.module.js';
import { ApprovalModule } from './approval/approval.module.js';
import { ExecutionModule } from './execution/execution.module.js';
import { AuditModule } from './audit/audit.module.js';

import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module.js';

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
    AuthModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}