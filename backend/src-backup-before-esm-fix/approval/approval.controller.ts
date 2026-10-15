import {
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ApprovalService } from './approval.service';
import { ReviewerAuthGuard } from '../auth/reviewer-auth.guard';

@UseGuards(ReviewerAuthGuard)
@Controller('approval')
export class ApprovalController {
  constructor(
    private readonly approvalService: ApprovalService,
  ) {}

  @Get('pending')
  getPendingApprovals() {
    return this.approvalService.getPendingApprovals();
  }

  @Post(':id/approve')
  approve(@Param('id') id: string) {
    return this.approvalService.approve(id);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string) {
    return this.approvalService.reject(id);
  }
}