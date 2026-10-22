import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Model } from 'mongoose';

import { ApprovalService } from './approval.service.js';
import { Approval } from './schemas/approval.schema.js';
import { ExecutionService } from '../execution/execution.service.js';
import { AuditService } from '../audit/audit.service.js';
import { AuthenticatedToolCall } from '../gateway/dto/authenticated-tool-call.js';
import { RiskResult } from '../risk/risk.service.js';

describe('ApprovalService', () => {
  let service: ApprovalService;

  const records = new Map<string, Record<string, any>>();

  const executionService = {
    execute: jest.fn<
      (request: AuthenticatedToolCall) => Promise<{ success: boolean }>
    >(),
  };

  const auditService = {
    record: jest.fn<
      (event: Record<string, unknown>) => Promise<void>
    >().mockResolvedValue(undefined),
  };

  const request: AuthenticatedToolCall = {
    agentId: 'test-agent',
    tool: 'github',
    operation: 'delete_branch',
    target: 'test-owner/test-repository',
    arguments: {
      branch: 'test-branch',
    },
  };

  const risk: RiskResult = {
    score: 70,
    level: 'HIGH',
    reason: 'Unit test risk',
  };

  function makeDocument(record: Record<string, any>) {
    return {
      ...record,
      toObject: () => structuredClone(record),
    };
  }

  const approvalModel = {
    create: jest.fn(async (input: Record<string, any>) => {
      const record: Record<string, any> = {
  ...structuredClone(input),
  createdAt: input.createdAt ?? new Date(),
};

records.set(record.id, record);

      records.set(record.id, record);
      return makeDocument(record);
    }),

    find: jest.fn((filter: Record<string, any>) => ({
      sort: jest.fn((_sort: Record<string, number>) => ({
        exec: async () =>
          [...records.values()]
            .filter((record) =>
              Object.entries(filter).every(
                ([key, value]) => record[key] === value,
              ),
            )
            .sort(
              (a, b) =>
                b.createdAt.getTime() - a.createdAt.getTime(),
            )
            .map(makeDocument),
      })),
    })),

    findOne: jest.fn((filter: Record<string, any>) => ({
      exec: async () => {
        const record = [...records.values()].find((item) =>
          Object.entries(filter).every(
            ([key, value]) => item[key] === value,
          ),
        );

        return record ? makeDocument(record) : null;
      },
    })),

    findOneAndUpdate: jest.fn(
      (
        filter: Record<string, any>,
        update: { $set: Record<string, any> },
        _options: Record<string, any>,
      ) => ({
        exec: async () => {
          const record = [...records.values()].find((item) =>
            Object.entries(filter).every(
              ([key, value]) => item[key] === value,
            ),
          );

          if (!record) {
            return null;
          }

          Object.assign(record, structuredClone(update.$set));
          return makeDocument(record);
        },
      }),
    ),

    updateOne: jest.fn(
      (
        filter: Record<string, any>,
        update: { $set: Record<string, any> },
      ) => ({
        exec: async () => {
          const record = [...records.values()].find((item) =>
            Object.entries(filter).every(
              ([key, value]) => item[key] === value,
            ),
          );

          if (!record) {
            return { matchedCount: 0, modifiedCount: 0 };
          }

          Object.assign(record, structuredClone(update.$set));
          return { matchedCount: 1, modifiedCount: 1 };
        },
      }),
    ),
  };

  beforeEach(() => {
    records.clear();
    jest.clearAllMocks();

    executionService.execute.mockResolvedValue({ success: true });
    auditService.record.mockResolvedValue(undefined);

    service = new ApprovalService(
      approvalModel as unknown as Model<Approval>,
      executionService as unknown as ExecutionService,
      auditService as unknown as AuditService,
    );
  });

  it('creates a pending approval without executing the tool', async () => {
    const approval = await service.createApproval(request, risk);

    expect(approval.id).toBeDefined();
    expect(approval.status).toBe('PENDING');
    expect(approval.executionStatus).toBe('NOT_EXECUTED');
    expect(await service.getPendingApprovals()).toHaveLength(1);
    expect(executionService.execute).not.toHaveBeenCalled();
  });

  it('retrieves an existing approval by ID', async () => {
    const created = await service.createApproval(request, risk);

    const retrieved = await service.getApproval(created.id);

    expect(retrieved.id).toBe(created.id);
    expect(retrieved.request).toEqual(request);
    expect(retrieved.status).toBe('PENDING');
  });

  it('throws when an approval does not exist', async () => {
    await expect(service.getApproval('missing-id')).rejects.toThrow(
      'not found',
    );
  });

  it('rejects a pending approval without executing the tool', async () => {
    const approval = await service.createApproval(request, risk);

    const rejected = await service.reject(approval.id);

    expect(rejected.status).toBe('REJECTED');
    expect(rejected.executionStatus).toBe('NOT_EXECUTED');
    expect(rejected.reviewedAt).toBeDefined();
    expect(await service.getPendingApprovals()).toHaveLength(0);
    expect(executionService.execute).not.toHaveBeenCalled();

    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        approvalId: approval.id,
        decision: 'REJECTED',
        event: 'REJECTED',
        executed: false,
      }),
    );
  });

  it('approves a pending request and executes it exactly once', async () => {
    const approval = await service.createApproval(request, risk);

    const result = await service.approve(approval.id);
    const updated = await service.getApproval(approval.id);

    expect(result.executed).toBe(true);
    expect(updated.status).toBe('APPROVED');
    expect(updated.executionStatus).toBe('EXECUTED');
    expect(updated.reviewedAt).toBeDefined();
    expect(updated.executedAt).toBeDefined();
    expect(executionService.execute).toHaveBeenCalledTimes(1);
    expect(executionService.execute).toHaveBeenCalledWith(
      expect.objectContaining(request),
    );

    expect(auditService.record).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        approvalId: approval.id,
        event: 'APPROVED',
        executed: false,
      }),
    );

    expect(auditService.record).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        approvalId: approval.id,
        event: 'EXECUTED',
        executed: true,
      }),
    );
  });

  it('does not allow an approval to be approved twice', async () => {
    const approval = await service.createApproval(request, risk);

    await service.approve(approval.id);

    await expect(service.approve(approval.id)).rejects.toThrow(
      'already APPROVED',
    );

    expect(executionService.execute).toHaveBeenCalledTimes(1);
  });

  it('does not allow a rejected approval to be approved', async () => {
    const approval = await service.createApproval(request, risk);

    await service.reject(approval.id);

    await expect(service.approve(approval.id)).rejects.toThrow(
      'already REJECTED',
    );

    expect(executionService.execute).not.toHaveBeenCalled();
  });

  it('does not allow a rejected approval to be rejected again', async () => {
    const approval = await service.createApproval(request, risk);

    await service.reject(approval.id);

    await expect(service.reject(approval.id)).rejects.toThrow(
      'already REJECTED',
    );
  });

  it('records a failed execution when the approved tool fails', async () => {
    executionService.execute.mockRejectedValue(
      new Error('Simulated execution failure'),
    );

    const approval = await service.createApproval(request, risk);

    await expect(service.approve(approval.id)).rejects.toThrow(
      'Simulated execution failure',
    );

    const updated = await service.getApproval(approval.id);

    expect(updated.status).toBe('APPROVED');
    expect(updated.executionStatus).toBe('UNKNOWN');
    expect(updated.executedAt).toBeUndefined();

    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        approvalId: approval.id,
        decision: 'APPROVED',
        executed: false,
        event: 'EXECUTION_UNKNOWN',
      }),
    );
  });

  it('preserves execution status when the success audit fails', async () => {
    auditService.record
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Audit storage unavailable'));

    const approval = await service.createApproval(request, risk);

    await expect(service.approve(approval.id)).rejects.toThrow(
      'Audit storage unavailable',
    );

    const updated = await service.getApproval(approval.id);

    expect(executionService.execute).toHaveBeenCalledTimes(1);
    expect(updated.executionStatus).toBe('EXECUTED');
    expect(updated.executedAt).toBeDefined();

    expect(auditService.record).not.toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'EXECUTION_FAILED',
      }),
    );
  });

  it('allows only one concurrent request to claim an approval', async () => {
    const approval = await service.createApproval(request, risk);

    const results = await Promise.allSettled([
      service.approve(approval.id),
      service.approve(approval.id),
    ]);

    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);

    expect(
      results.filter((result) => result.status === 'rejected'),
    ).toHaveLength(1);

    expect(executionService.execute).toHaveBeenCalledTimes(1);
    expect(
      (await service.getApproval(approval.id)).executionStatus,
    ).toBe('EXECUTED');
  });

  it('executes the original request even if the caller mutates it afterward', async () => {
    const mutableRequest: AuthenticatedToolCall = {
      ...request,
      arguments: { branch: 'test-branch' },
    };

    const approval = await service.createApproval(mutableRequest, risk);

    mutableRequest.arguments!.branch = 'production';

    await service.approve(approval.id);

    expect(executionService.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        target: 'test-owner/test-repository',
        arguments: { branch: 'test-branch' },
      }),
    );
  });

  it('prevents mutation of the stored approved request snapshot', async () => {
    const approval = await service.createApproval(
      {
        ...request,
        arguments: { branch: 'test-branch' },
      },
      risk,
    );

    expect(() => {
      approval.request.arguments!.branch = 'production';
    }).toThrow(TypeError);

    expect(approval.request.arguments).toEqual({
      branch: 'test-branch',
    });
  });

  it('passes a frozen request snapshot to execution', async () => {
    const approval = await service.createApproval(
      {
        ...request,
        arguments: { branch: 'test-branch' },
      },
      risk,
    );

    await service.approve(approval.id);

    const executedRequest = executionService.execute.mock.calls[0][0];

    expect(Object.isFrozen(executedRequest)).toBe(true);
    expect(Object.isFrozen(executedRequest.arguments)).toBe(true);
    expect(executedRequest.arguments).toEqual({
      branch: 'test-branch',
    });
  });
});