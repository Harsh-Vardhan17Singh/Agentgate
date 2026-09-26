import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { PolicyService } from '../policy/policy.service';
import { RiskService } from '../risk/risk.service';
import { ToolsService } from '../tools/tools.service';
import { AuthenticatedToolCall } from './dto/authenticated-tool-call';
import { ApprovalService } from '../approval/approval.service';
import { ExecutionService } from '../execution/execution.service';
import { AuditService } from '../audit/audit.service';
import { AuthorizationService } from '../auth/authorization.service';

@Injectable()
export class GatewayService {
  constructor(
    private readonly policyService: PolicyService,
    private readonly riskService: RiskService,
    private readonly toolsService: ToolsService,
    private readonly approvalService: ApprovalService,
    private readonly executionService: ExecutionService,
    private readonly auditService: AuditService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async processToolCall(request: AuthenticatedToolCall) {
    // Step 1: Verify that the authenticated agent
    // is authorized to perform this operation.
    const authorized =
      await this.authorizationService.authorize(
        request.agentId,
        request.tool,
        request.operation,
      );

    if (!authorized) {
      await this.auditService.record({
        agentId: request.agentId,
        tool: request.tool,
        operation: request.operation,
        target: request.target,
        decision: 'BLOCK',
        riskScore: 0,
        riskLevel: 'NOT_EVALUATED',
        executed: false,
        event: 'BLOCKED',
      });

      throw new ForbiddenException(
        `Agent '${request.agentId}' is not authorized to perform '${request.tool}:${request.operation}'`,
      );
    }

    // Step 2: Verify that the requested tool operation
    // is registered with AgentGate.
    const toolDefinition = this.toolsService.findTool(
      request.tool,
      request.operation,
    );

    if (!toolDefinition) {
      const response = {
        request,
        decision: 'BLOCK',
        risk: {
          score: 100,
          level: 'CRITICAL',
          reason:
            'Tool operation is not registered with AgentGate.',
        },
        timestamp: new Date().toISOString(),
        executed: false,
        message: 'Unknown tool operation blocked by AgentGate.',
      };

      console.log(
        '[AGENTGATE]',
        JSON.stringify(response, null, 2),
      );

      await this.auditService.record({
        agentId: request.agentId,
        tool: request.tool,
        operation: request.operation,
        target: request.target,
        decision: 'BLOCK',
        riskScore: 100,
        riskLevel: 'CRITICAL',
        executed: false,
        event: 'BLOCKED',
      });

      return response;
    }

    // Step 3: Calculate the risk of the registered operation.
    const risk = this.riskService.calculateRisk(
      toolDefinition,
      request.target,
    );

    // Step 4: Evaluate the operation against policy.
    const policy = this.policyService.evaluate(
      request.tool,
      request.operation,
      request.target,
    );

    // Step 5: Determine the final decision.
    let decision = policy;

    // Critical operations are never executed automatically.
    if (risk.level === 'CRITICAL') {
      decision = 'BLOCK';
    }

    const response = {
      request,
      tool: toolDefinition,
      decision,
      risk,
      timestamp: new Date().toISOString(),
    };

    console.log(
      '[AGENTGATE]',
      JSON.stringify(response, null, 2),
    );

    // Step 6: Block the request if policy rejected it.
    if (decision === 'BLOCK') {
      await this.auditService.record({
        agentId: request.agentId,
        tool: request.tool,
        operation: request.operation,
        target: request.target,
        decision,
        riskScore: risk.score,
        riskLevel: risk.level,
        executed: false,
        event: 'BLOCKED',
      });

      return {
        ...response,
        executed: false,
        message: 'Tool call blocked by AgentGate policy.',
      };
    }

    // Step 7: Pause the request if human approval is required.
    if (decision === 'REQUIRE_APPROVAL') {
      const approval = this.approvalService.createApproval(
        request,
        risk,
      );

      await this.auditService.record({
        agentId: request.agentId,
        tool: request.tool,
        operation: request.operation,
        target: request.target,
        decision,
        riskScore: risk.score,
        riskLevel: risk.level,
        executed: false,
        event: 'APPROVAL_REQUIRED',
      });

      return {
        ...response,
        executed: false,
        approval,
        message: 'Human approval required before execution.',
      };
    }

    // Step 8: Execute the approved tool through ExecutionService.
    const result = await this.executionService.execute(request);

    await this.auditService.record({
      agentId: request.agentId,
      tool: request.tool,
      operation: request.operation,
      target: request.target,
      decision: 'ALLOW',
      riskScore: risk.score,
      riskLevel: risk.level,
      executed: true,
      event: 'EXECUTED',
    });

    return {
      ...response,
      executed: true,
      result,
      message: 'Tool call allowed and executed.',
    };
  }
}