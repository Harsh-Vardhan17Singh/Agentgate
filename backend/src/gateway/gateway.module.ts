import { Module } from '@nestjs/common';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { PolicyModule } from '../policy/policy.module';
import { RiskModule } from '../risk/risk.module';
import { ToolsService } from '../tools/tools.service';
import { ToolsModeule } from '../tools/tools.module';

@Module({
  imports: [PolicyModule,
            RiskModule,
            ToolsModule],
  controllers: [GatewayController],
  providers: [GatewayService],
})
export class GatewayModule {}