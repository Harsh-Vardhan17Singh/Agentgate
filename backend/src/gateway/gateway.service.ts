import { Injectable } from '@nestjs/common';
import { PolicyService } from '../policy/policy.service';
import { RiskService } from '../risk/risk.service';
import { ToolCallDto } from './dto/tool-call.dto';

@Injectable()
export class GatewayService {
  constructor(
    private readonly policyService: PolicyService,
    private readonly riskService: RiskService,
  ) {}

  processToolCall(request: ToolCallDto) {
    const risk = this.riskService.calculateRisk(
      request.tool,
      request.operation,
    );

    const policy = this.policyService.evaluate(
      request.tool,
      request.operation,
      request.target,
    );

    let decision = policy;

    // Critical actions are never executed automatically.
    if (risk.level === 'CRITICAL') {
      decision = 'BLOCK';
    }

    const response = {
      request,
      decision,
      risk,
      timestamp: new Date().toISOString(),
    };

    // For now, this is our audit output.
    console.log('[AGENTGATE]', JSON.stringify(response, null, 2));

    if (decision === 'BLOCK') {
      return {
        ...response,
        executed: false,
        message: 'Tool call blocked by AgentGate policy.',
      };
    }

    if (decision === 'REQUIRE_APPROVAL') {
      return {
        ...response,
        executed: false,
        message: 'Human approval required before execution.',
      };
    }

    return {
      ...response,
      executed: true,
      result: this.executeMockTool(request),
      message: 'Tool call allowed and executed.',
    };
  }

  private executeMockTool(request: ToolCallDto) {
    return {
      tool: request.tool,
      operation: request.operation,
      target: request.target,
      status: 'SUCCESS',
      simulated: true,
    };
  }
}