import { Module } from '@nestjs/common';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { PolicyModule } from '../policy/policy.module';
import { RiskModule } from '../risk/risk.module';
import { ToolsModule } from '../tools/tools.module';

@Module({
  imports: [PolicyModule,
            RiskModule,
            ToolsModule],
  controllers: [GatewayController],
  providers: [GatewayService],
})
export class GatewayModule {}