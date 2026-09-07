import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GatewayModule } from './gateway/gateway.module';
import { PolicyModule } from './policy/policy.module';
import { RiskModule } from './risk/risk.module';

@Module({
  imports: [GatewayModule, PolicyModule, RiskModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
