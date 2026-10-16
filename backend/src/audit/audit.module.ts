import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuditController } from './audit.controller.js';
import { AuditService } from './audit.service.js';

import {
  AuditEvent,
  AuditEventSchema,
} from './schemas/audit-event.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: AuditEvent.name,
        schema: AuditEventSchema,
      },
    ]),
  ],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}