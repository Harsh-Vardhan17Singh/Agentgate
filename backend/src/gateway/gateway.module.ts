import { Module } from '@nestjs/common';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { PolicyModule } from '../policy/policy.module';
import { RiskModule } from '../risk/risk.module';

@Module({
  imports: [PolicyModule, RiskModule],
  controllers: [GatewayController],
  providers: [GatewayService],
})
export class GatewayModule {}