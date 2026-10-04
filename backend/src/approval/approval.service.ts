import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AuthenticatedToolCall } from '../gateway/dto/authenticated-tool-call';
import { RiskResult } from '../risk/risk.service';
import { AuditService } from '../audit/audit.service';
import { ExecutionService } from '../execution/execution.service';

export type ApprovalStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

export type ExecutionStatus =
  | 'NOT_EXECUTED'
  | 'EXECUTED'
  | 'FAILED';

export interface ApprovalRequest {
  id: string;
  request: AuthenticatedToolCall;
  risk: RiskResult;

  status: ApprovalStatus;

  executionStatus: ExecutionStatus;

  createdAt: string;
  reviewedAt?: string;
  executedAt?: string;
}

@Injectable()
export class ApprovalService {
  private readonly approvals: ApprovalRequest[] = [];

  constructor(
    private readonly executive: ExecutionService,
    private readonly auditService: AuditService,
  ) {}

  createApproval(
    request: AuthenticatedToolCall,
    risk: RiskResult,
  ): ApprovalRequest {
    const approval: ApprovalRequest = {
      id: crypto.randomUUID(),
      request,
      risk,
      status: 'PENDING',
      executionStatus: 'NOT_EXECUTED',
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

  async approve(id: string) {
    const approval = this.getApproval(id);

    if (approval.status !== 'PENDING') {
      throw new ConflictException(
        `Approval cannot be approved because it is already ${approval.status}.`,
      );
    }

    approval.status = 'APPROVED';
    approval.reviewedAt = new Date().toISOString();

    await this.auditService.record({
      agentId: approval.request.agentId,
      tool: approval.request.tool,
      operation: approval.request.operation,
      target: approval.request.target,
      decision: 'APPROVED',
      riskScore: approval.risk.score,
      riskLevel: approval.risk.level,
      executed: false,
      event: 'APPROVED',
    });

    try {
      const result = await this.executive.execute(
        approval.request,
      );

      approval.executionStatus = 'EXECUTED';
      approval.executedAt = new Date().toISOString();

      await this.auditService.record({
        agentId: approval.request.agentId,
        tool: approval.request.tool,
        operation: approval.request.operation,
        target: approval.request.target,
        decision: 'APPROVED',
        riskScore: approval.risk.score,
        riskLevel: approval.risk.level,
        executed: true,
        event: 'EXECUTED',
      });

      return {
        approval,
        executed: true,
        result,
        message: 'Approval granted and tool executed.',
      };
    } catch (error) {
      approval.executionStatus = 'FAILED';

      await this.auditService.record({
        agentId: approval.request.agentId,
        tool: approval.request.tool,
        operation: approval.request.operation,
        target: approval.request.target,
        decision: 'APPROVED',
        riskScore: approval.risk.score,
        riskLevel: approval.risk.level,
        executed: false,
        event: 'EXECUTION_FAILED',
      });

      throw error;
    }
  }

  async reject(id: string): Promise<ApprovalRequest> {
    const approval = this.getApproval(id);

    if (approval.status !== 'PENDING') {
      throw new ConflictException(
        `Approval cannot be rejected because it is already ${approval.status}.`,
      );
    }

    approval.status = 'REJECTED';
    approval.executionStatus = 'NOT_EXECUTED';
    approval.reviewedAt = new Date().toISOString();

    await this.auditService.record({
      agentId: approval.request.agentId,
      tool: approval.request.tool,
      operation: approval.request.operation,
      target: approval.request.target,
      decision: 'REJECTED',
      riskScore: approval.risk.score,
      riskLevel: approval.risk.level,
      executed: false,
      event: 'REJECTED',
    });

    return approval;
  }
}