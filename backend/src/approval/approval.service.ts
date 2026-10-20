import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AuthenticatedToolCall } from '../gateway/dto/authenticated-tool-call.js';
import { RiskResult } from '../risk/risk.service.js';
import { AuditService } from '../audit/audit.service.js';
import { ExecutionService } from '../execution/execution.service.js';

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

function deepFreeze<T>(value: T): T {
  if (
    value !== null &&
    typeof value === 'object' &&
    !Object.isFrozen(value)
  ) {
    Object.freeze(value);

    Object.values(value as Record<string, unknown>).forEach(
      (child) => deepFreeze(child),
    );
  }

  return value;
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
  const approvedRequest = deepFreeze(
  structuredClone(request),
);

const approvedRisk = deepFreeze(
  structuredClone(risk),
);

const approval: ApprovalRequest = {
  id: crypto.randomUUID(),
  request: approvedRequest,
  risk: approvedRisk,
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
      approvalId:approval.id,
      executed: false,
      event: 'APPROVED',
    });

    
    let result: Awaited<ReturnType<ExecutionService['execute']>>;

    // Only actual tool-execution errors should mark execution as FAILED.
    try {
      result = await this.executive.execute(approval.request);
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
        approvalId:approval.id,
        executed: false,
        event: 'EXECUTION_FAILED',
      });

      throw error;
    }

    // Execution succeeded. Preserve the true outcome before auditing it.
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
      approvalId:approval.id,
      executed: true,
      event: 'EXECUTED',
    });

    return {
      approval,
      executed: true,
      result,
      message: 'Approval granted and tool executed.',
    };

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
      approvalId:approval.id,
      executed: false,
      event: 'REJECTED',
    });

    return approval;
  }
}