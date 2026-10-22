import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { AuthenticatedToolCall } from '../gateway/dto/authenticated-tool-call.js';
import { RiskResult } from '../risk/risk.service.js';
import { AuditService } from '../audit/audit.service.js';
import { ExecutionService } from '../execution/execution.service.js';
import {
  Approval,
  ApprovalDocument,
} from './schemas/approval.schema.js';

export type ApprovalStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

export type ExecutionStatus =
  | 'NOT_EXECUTED'
  | 'EXECUTING'
  | 'EXECUTED'
  | 'FAILED'
  | 'UNKNOWN';

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
export class ApprovalService implements OnModuleInit{
  constructor(
    @InjectModel(Approval.name)
    private readonly approvalModel: Model<Approval>,
    private readonly executive: ExecutionService,
    private readonly auditService: AuditService,
  ) {}

  private toApproval(
    document: ApprovalDocument,
  ): ApprovalRequest {
    const data = document.toObject();

    return {
      id: data.id,
      request: deepFreeze(
        structuredClone(
          data.request as unknown as AuthenticatedToolCall,
        ),
      ),
      risk: deepFreeze(
        structuredClone(data.risk as unknown as RiskResult),
      ),
      status: data.status,
      executionStatus: data.executionStatus,
      createdAt: new Date(data.createdAt).toISOString(),
      ...(data.reviewedAt && {
        reviewedAt: new Date(data.reviewedAt).toISOString(),
      }),
      ...(data.executedAt && {
        executedAt: new Date(data.executedAt).toISOString(),
      }),
    };
  }

  async onModuleInit(): Promise<void> {
  const stuckApprovals = await this.approvalModel
    .find({
      status: 'APPROVED',
      executionStatus: 'EXECUTING',
    })
    .exec();

  for (const document of stuckApprovals) {
    const approval = this.toApproval(document);

    const updateResult = await this.approvalModel
      .updateOne(
        {
          id: approval.id,
          status: 'APPROVED',
          executionStatus: 'EXECUTING',
        },
        {
          $set: {
            executionStatus: 'UNKNOWN',
          },
        },
      )
      .exec();

    if (updateResult.matchedCount !== 1) {
      continue;
    }

    await this.auditService.record({
      agentId: approval.request.agentId,
      tool: approval.request.tool,
      operation: approval.request.operation,
      target: approval.request.target,
      decision: 'APPROVED',
      riskScore: approval.risk.score,
      riskLevel: approval.risk.level,
      approvalId: approval.id,
      executed: false,
      event: 'EXECUTION_UNKNOWN',
    });
  }
}

  async createApproval(
    request: AuthenticatedToolCall,
    risk: RiskResult,
  ): Promise<ApprovalRequest> {
    const document = await this.approvalModel.create({
      id: crypto.randomUUID(),
      request: structuredClone(request),
      risk: structuredClone(risk),
      status: 'PENDING',
      executionStatus: 'NOT_EXECUTED',
      createdAt: new Date(),
    });

    return this.toApproval(document);
  }

  async getPendingApprovals(): Promise<ApprovalRequest[]> {
    const documents = await this.approvalModel
      .find({ status: 'PENDING' })
      .sort({ createdAt: -1 })
      .exec();

    return documents.map((document) =>
      this.toApproval(document),
    );
  }

  async getApproval(id: string): Promise<ApprovalRequest> {
    const document = await this.approvalModel
      .findOne({ id })
      .exec();

    if (!document) {
      throw new NotFoundException(
        `Approval request ${id} not found.`,
      );
    }

    return this.toApproval(document);
  }

  async approve(id: string) {
    
const claimed = await this.approvalModel
  .findOneAndUpdate(
    {
      id,
      status: 'PENDING',
      executionStatus: 'NOT_EXECUTED',
    },
    {
      $set: {
        status: 'APPROVED',
        executionStatus: 'EXECUTING',
        reviewedAt: new Date(),
      },
    },
    { new: true, runValidators: true },
  )
  .exec();


    if (!claimed) {
      const existing = await this.approvalModel
        .findOne({ id })
        .exec();

      if (!existing) {
        throw new NotFoundException(
          `Approval request ${id} not found.`,
        );
      }

      throw new ConflictException(
        `Approval cannot be approved because it is already ${existing.status}.`,
      );
    }

    const approval = this.toApproval(claimed);

    await this.auditService.record({
      agentId: approval.request.agentId,
      tool: approval.request.tool,
      operation: approval.request.operation,
      target: approval.request.target,
      decision: 'APPROVED',
      riskScore: approval.risk.score,
      riskLevel: approval.risk.level,
      approvalId: approval.id,
      executed: false,
      event: 'APPROVED',
    });

    let result: Awaited<
      ReturnType<ExecutionService['execute']>
    >;

    try {
      result = await this.executive.execute(
        approval.request,
      );
    } catch (error) {
      
await this.approvalModel
  .updateOne(
    {
      id,
      status: 'APPROVED',
      executionStatus: 'EXECUTING',
    },
    {
      $set: {
        executionStatus: 'UNKNOWN',
      },
    },
  )
  .exec();


      await this.auditService.record({
        agentId: approval.request.agentId,
        tool: approval.request.tool,
        operation: approval.request.operation,
        target: approval.request.target,
        decision: 'APPROVED',
        riskScore: approval.risk.score,
        riskLevel: approval.risk.level,
        approvalId: approval.id,
        executed: false,
        event: 'EXECUTION_UNKNOWN',
      });

      throw error;
    }

    const executedAt = new Date();

    
const updateResult = await this.approvalModel
  .updateOne(
    {
      id,
      status: 'APPROVED',
      executionStatus: 'EXECUTING',
    },
    {
      $set: {
        executionStatus: 'EXECUTED',
        executedAt: new Date(),
      },
    },
  )
  .exec();

if (updateResult.matchedCount !== 1) {
  throw new Error(
    'Execution succeeded, but the approval state could not be confirmed.',
  );
}

    approval.executionStatus = 'EXECUTED';
    approval.executedAt = executedAt.toISOString();

    await this.auditService.record({
      agentId: approval.request.agentId,
      tool: approval.request.tool,
      operation: approval.request.operation,
      target: approval.request.target,
      decision: 'APPROVED',
      riskScore: approval.risk.score,
      riskLevel: approval.risk.level,
      approvalId: approval.id,
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
    const document = await this.approvalModel
      .findOneAndUpdate(
        { id, status: 'PENDING' },
        {
          $set: {
            status: 'REJECTED',
            executionStatus: 'NOT_EXECUTED',
            reviewedAt: new Date(),
          },
        },
        { new: true, runValidators: true },
      )
      .exec();

    if (!document) {
      const existing = await this.approvalModel
        .findOne({ id })
        .exec();

      if (!existing) {
        throw new NotFoundException(
          `Approval request ${id} not found.`,
        );
      }

      throw new ConflictException(
        `Approval cannot be rejected because it is already ${existing.status}.`,
      );
    }

    const approval = this.toApproval(document);

    await this.auditService.record({
      agentId: approval.request.agentId,
      tool: approval.request.tool,
      operation: approval.request.operation,
      target: approval.request.target,
      decision: 'REJECTED',
      riskScore: approval.risk.score,
      riskLevel: approval.risk.level,
      approvalId: approval.id,
      executed: false,
      event: 'REJECTED',
    });

    return approval;
  }
}