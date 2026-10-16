import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ApprovalService } from './approval.service';
import { ExecutionService } from '../execution/execution.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedToolCall } from '../gateway/dto/authenticated-tool-call';
import { RiskResult } from '../risk/risk.service';



describe('ApprovalService', () => {
  let service: ApprovalService;

  const executionService = {
    execute: jest.fn(),
  };

  const auditService = {
    record: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
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
});
