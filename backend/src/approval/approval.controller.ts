import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApprovalService } from './approval.service';
import { ExecutionService } from '../execution/execution.service';

@Controller('approval')
export class ApprovalController {
    constructor(
        private readonly approvalService: ApprovalService,
        private readonly executionService: ExecutionService,
    ) {}

    @Get('pending')
    getPendingAprovals(){
        return this.approvalService.getPendingApprovals();
    }

    @Post(':id/approve')
    approve(@Param('id') id: string){
        const approval = this.approvalService.approve(id);

        const result = this.executionService.execute(
            approval.request,
        );

        return {
            approval,
            executed:true,
            result,
            message:"Approval granted and tool executed.",
        };
    }

    @Post(':id/reject')
    reject(@Param('id') id: string){
        return this.approvalService.reject(id);
    }
}