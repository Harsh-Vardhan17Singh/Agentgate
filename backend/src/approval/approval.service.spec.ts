import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ApprovalService } from './approval.service.js';
import { ExecutionService } from '../execution/execution.service.js';
import { AuditService } from '../audit/audit.service.js';
import { AuthenticatedToolCall } from '../gateway/dto/authenticated-tool-call.js';
import { RiskResult } from '../risk/risk.service.js';



describe('ApprovalService', () => {
  let service: ApprovalService;

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

  beforeEach(() => {
    jest.clearAllMocks();

    executionService.execute.mockResolvedValue({ success: true });

    service = new ApprovalService(
      executionService as unknown as ExecutionService,
      auditService as unknown as AuditService,
    );
  });

  it('creates a pending approval without executing the tool', () => {
    const approval = service.createApproval(request, risk);

    expect(approval.id).toBeDefined();
    expect(approval.status).toBe('PENDING');
    expect(approval.executionStatus).toBe('NOT_EXECUTED');
    expect(service.getPendingApprovals()).toHaveLength(1);
    expect(executionService.execute).not.toHaveBeenCalled();
  });

  it('rejects a pending approval without executing the tool', async () => {
    const approval = service.createApproval(request, risk);

    const rejected = await service.reject(approval.id);

    expect(rejected.status).toBe('REJECTED');
    expect(rejected.executionStatus).toBe('NOT_EXECUTED');
    expect(rejected.reviewedAt).toBeDefined();
    expect(service.getPendingApprovals()).toHaveLength(0);
    expect(executionService.execute).not.toHaveBeenCalled();


const recordedEvent = auditService.record.mock.calls[0][0];

expect(recordedEvent).toMatchObject({
  decision: 'REJECTED',
  event: 'REJECTED',
  executed: false,
});

  });

    it('approves a pending request and executes it exactly once', async () => {
    executionService.execute.mockResolvedValue({ success: true });

    const approval = service.createApproval(request, risk);
    const result = await service.approve(approval.id);

    expect(result.executed).toBe(true);
    expect(approval.status).toBe('APPROVED');
    expect(approval.executionStatus).toBe('EXECUTED');
    expect(approval.reviewedAt).toBeDefined();
    expect(approval.executedAt).toBeDefined();
    expect(executionService.execute).toHaveBeenCalledTimes(1);
    expect(executionService.execute).toHaveBeenCalledWith(request);
  });

  it('does not allow an approval to be approved twice', async () => {
    const approval = service.createApproval(request, risk);

    await service.approve(approval.id);

    await expect(service.approve(approval.id)).rejects.toThrow(
      'already APPROVED',
    );

    expect(executionService.execute).toHaveBeenCalledTimes(1);
  });

  it('does not allow a rejected approval to be approved', async () => {
    const approval = service.createApproval(request, risk);

    await service.reject(approval.id);

    await expect(service.approve(approval.id)).rejects.toThrow(
      'already REJECTED',
    );

    expect(executionService.execute).not.toHaveBeenCalled();
  });

  it('records a failed execution when the approved tool fails', async () => {
    executionService.execute.mockRejectedValue(
      new Error('Simulated execution failure'),
    );

    const approval = service.createApproval(request, risk);

    await expect(service.approve(approval.id)).rejects.toThrow(
      'Simulated execution failure',
    );

    expect(approval.status).toBe('APPROVED');
    expect(approval.executionStatus).toBe('FAILED');
    expect(approval.executedAt).toBeUndefined();
    expect(executionService.execute).toHaveBeenCalledTimes(1);
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        decision: 'APPROVED',
        executed: false,
        event: 'EXECUTION_FAILED',
      }),
    );
  });


  it('preserves successful execution status when the success audit fails', async () => {
    const auditError = new Error('Audit storage unavailable');

    // The initial APPROVED audit succeeds; the EXECUTED audit fails.
    auditService.record
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(auditError);

    const approval = service.createApproval(request, risk);

    await expect(service.approve(approval.id)).rejects.toThrow(
      'Audit storage unavailable',
    );

    expect(executionService.execute).toHaveBeenCalledTimes(1);
    expect(approval.status).toBe('APPROVED');
    expect(approval.executionStatus).toBe('EXECUTED');
    expect(approval.executedAt).toBeDefined();

    expect(auditService.record).toHaveBeenCalledTimes(2);
    expect(auditService.record).toHaveBeenLastCalledWith(
      expect.objectContaining({
        decision: 'APPROVED',
        executed: true,
        event: 'EXECUTED',
      }),
    );

    expect(auditService.record).not.toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'EXECUTION_FAILED',
      }),
    );
  });



  it('executes a concurrently approved request only once', async () => {
    const approval = service.createApproval(request, risk);

    const results = await Promise.allSettled([
      service.approve(approval.id),
      service.approve(approval.id),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    expect(executionService.execute).toHaveBeenCalledTimes(1);
    expect(approval.status).toBe('APPROVED');
    expect(approval.executionStatus).toBe('EXECUTED');
  });

  it('executes the original request even if the caller mutates its request afterward', async () => {
  const mutableRequest: AuthenticatedToolCall = {
    ...request,
    arguments: {
      branch: 'test-branch',
    },
  };

  const approval = service.createApproval(mutableRequest, risk);

  // Simulate the caller changing its original request after approval creation.
  mutableRequest.arguments!.branch = 'production';

  await service.approve(approval.id);

  expect(executionService.execute).toHaveBeenCalledWith(
    expect.objectContaining({
      target: 'test-owner/test-repository',
      arguments: expect.objectContaining({
        branch: 'test-branch',
      }),
    }),
  );
});

it('prevents mutation of the stored approved request', () => {
  const approval = service.createApproval(
    {
      ...request,
      arguments: {
        branch: 'test-branch',
      },
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



});
