import { Injectable, NotFoundException } from '@nestjs/common';
import { ToolCallDto } from '../gateway/dto/tool-call.dto';
import { RiskResult } from '../risk/risk.service';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ApprovalRequest {
  id: string;
  request: ToolCallDto;
  risk: RiskResult;
  status: ApprovalStatus;
  createdAt: string;
  reviewedAt?: string;
}

@Injectable()
export class ApprovalService {
  private readonly approvals: ApprovalRequest[] = [];

  createApproval(
    request: ToolCallDto,
    risk: RiskResult,
  ): ApprovalRequest {
    const approval: ApprovalRequest = {
      id: crypto.randomUUID(),
      request,
      risk,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    this.approvals.push(approval);

    return approval;
  }

  getPendingApprovals(): ApprovalRequest[] {
    return this.approvals.filter(
      (approval) => approval.status === 'PENDING',
    );
  }

  getApproval(id: string): ApprovalRequest {
    const approval = this.approvals.find(
      (item) => item.id === id,
    );

    if (!approval) {
      throw new NotFoundException(
        `Approval request ${id} not found.`,
      );
    }

    return approval;
  }

  approve(id: string): ApprovalRequest {
    const approval = this.getApproval(id);

    if (approval.status !== 'PENDING') {
      return approval;
    }

    approval.status = 'APPROVED';
    approval.reviewedAt = new Date().toISOString();

    return approval;
  }

  reject(id: string): ApprovalRequest {
    const approval = this.getApproval(id);

    if (approval.status !== 'PENDING') {
      return approval;
    }

    approval.status = 'REJECTED';
    approval.reviewedAt = new Date().toISOString();

    return approval;
  }
}