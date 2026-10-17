import { Test, TestingModule } from '@nestjs/testing';
import { jest } from '@jest/globals';
import { GatewayService } from './gateway.service.js';
import { PolicyService } from '../policy/policy.service.js';
import { RiskService } from '../risk/risk.service.js';
import { ToolsService } from '../tools/tools.service.js';
import { ApprovalService } from '../approval/approval.service.js';
import { ExecutionService } from '../execution/execution.service.js';
import { AuditService } from '../audit/audit.service.js';
import { AuthorizationService } from '../auth/authorization.service.js';
import { AuthenticatedToolCall } from './dto/authenticated-tool-call.js';

describe('GatewayService security enforcement', () => {
  let service: GatewayService;

  const policyService = {
    evaluate: jest.fn(),
  };

  const riskService = {
    calculateRisk: jest.fn(),
  };

  const toolsService = {
    findTool: jest.fn(),
  };

  const approvalService = {
    createApproval: jest.fn(),
  };

   const auditService = {
    record: jest.fn<() => Promise<void>>(),
  };

  const executionService = {
  execute: jest.fn<
    (request: AuthenticatedToolCall) => Promise<{ success: boolean }>
  >(),
};

const authorizationService = {
  authorize: jest.fn<
    (agentId: string, tool: string, operation: string) => Promise<boolean>
  >(),
};

  const request = {
    agentId: 'test-agent',
    tool: 'github',
    operation: 'create_issue',
    target: 'development',
  } as AuthenticatedToolCall;

  const toolDefinition = {
    tool: 'github',
    operation: 'create_issue',
    sensitivity: 'LOW',
  };

  const lowRisk = {
    score: 10,
    level: 'LOW',
    reason: 'Low-sensitivity operation.',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    authorizationService.authorize.mockResolvedValue(true);
    toolsService.findTool.mockReturnValue(toolDefinition);
    riskService.calculateRisk.mockReturnValue(lowRisk);
    policyService.evaluate.mockReturnValue('ALLOW');
    executionService.execute.mockResolvedValue({ success: true });
    approvalService.createApproval.mockReturnValue({
      id: 'approval-1',
      status: 'PENDING',
    });
    auditService.record.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GatewayService,
        { provide: PolicyService, useValue: policyService },
        { provide: RiskService, useValue: riskService },
        { provide: ToolsService, useValue: toolsService },
        { provide: ApprovalService, useValue: approvalService },
        { provide: ExecutionService, useValue: executionService },
        { provide: AuditService, useValue: auditService },
        { provide: AuthorizationService, useValue: authorizationService },
      ],
    }).compile();

    service = module.get<GatewayService>(GatewayService);
  });

  it('executes an authorized call when policy allows it', async () => {
    const result = await service.processToolCall(request);

    expect(result.decision).toBe('ALLOW');
    expect(result.executed).toBe(true);
    expect(executionService.execute).toHaveBeenCalledWith(request);
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        decision: 'ALLOW',
        executed: true,
        event: 'EXECUTED',
      }),
    );
  });

  it('blocks a call when policy denies it', async () => {
    policyService.evaluate.mockReturnValue('BLOCK');

    const result = await service.processToolCall(request);

    expect(result.decision).toBe('BLOCK');
    expect(result.executed).toBe(false);
    expect(executionService.execute).not.toHaveBeenCalled();
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        decision: 'BLOCK',
        executed: false,
        event: 'BLOCKED',
      }),
    );
  });

  it('requests approval without executing the call', async () => {
    policyService.evaluate.mockReturnValue('REQUIRE_APPROVAL');

    const result = await service.processToolCall(request);

    expect(result.decision).toBe('REQUIRE_APPROVAL');
    expect(result.executed).toBe(false);
    
    expect(result).toMatchObject({
  decision: 'REQUIRE_APPROVAL',
  executed: false,
  approval: {
    id: 'approval-1',
    status: 'PENDING',
  },
});
    expect(approvalService.createApproval).toHaveBeenCalled();
    expect(executionService.execute).not.toHaveBeenCalled();
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        decision: 'REQUIRE_APPROVAL',
        executed: false,
        event: 'APPROVAL_REQUIRED',
      }),
    );
  });

  it('blocks critical-risk calls even when policy allows them', async () => {
    riskService.calculateRisk.mockReturnValue({
      score: 95,
      level: 'CRITICAL',
      reason: 'Critical risk.',
    });

    const result = await service.processToolCall(request);

    expect(result.decision).toBe('BLOCK');
    expect(result.executed).toBe(false);
    expect(executionService.execute).not.toHaveBeenCalled();
  });

  it('rejects an unauthorized agent without executing the tool', async () => {
  authorizationService.authorize.mockResolvedValue(false);

  await expect(service.processToolCall(request)).rejects.toThrow(
    'is not authorized',
  );

  expect(toolsService.findTool).not.toHaveBeenCalled();
  expect(executionService.execute).not.toHaveBeenCalled();
  expect(auditService.record).toHaveBeenCalledWith(
    expect.objectContaining({
      decision: 'BLOCK',
      executed: false,
      event: 'BLOCKED',
    }),
  );
});

it('blocks an unregistered tool operation without executing it', async () => {
  toolsService.findTool.mockReturnValue(undefined);

  const result = await service.processToolCall(request);

  expect(result.decision).toBe('BLOCK');
  expect(result.executed).toBe(false);
  expect(executionService.execute).not.toHaveBeenCalled();
  expect(auditService.record).toHaveBeenCalledWith(
    expect.objectContaining({
      decision: 'BLOCK',
      executed: false,
      event: 'BLOCKED',
    }),
  );
});
});
