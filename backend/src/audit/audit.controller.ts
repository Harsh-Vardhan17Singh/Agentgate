import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';

import { AuditService } from './audit.service.js';
import { ReviewerAuthGuard } from '../auth/reviewer-auth.guard.js';

@Controller('audit')
@UseGuards(ReviewerAuthGuard)
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
  ) {}

  @Get()
  getAuditLogs() {
    return this.auditService.getEvents();
  }
}