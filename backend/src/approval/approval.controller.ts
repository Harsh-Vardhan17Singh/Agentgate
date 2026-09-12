import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApprovalService } from './approval.service';

@Controller('approval')
export class ApprovalController {
    constructor(
        private readonly approvalService: ApprovalService,
    ) {}

    @Get('pending')
    getPendingAprovals(){
        return this.approvalService.getPendingApprovals();
    }

    @Post(':id/approve')
    approve(@Param('id') id: string){
        return this.approvalService.approve(id);
    }

    @Post(':id/reject')
    reject(@Param('id') id: string){
        return this.approvalService.reject(id);
    }
}