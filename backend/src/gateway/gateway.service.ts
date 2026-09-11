import { Injectable } from '@nestjs/common';
import { PolicyService } from '../policy/policy.service';
import { RiskService } from '../risk/risk.service';
import { ToolsService } from '../tools/tools.service';
import { ToolCallDto } from './dto/tool-call.dto';

@Injectable()
export class GatewayService {
  constructor(
    private readonly policyService: PolicyService,
    private readonly riskService: RiskService,
    private readonly toolsService: ToolsService,
  ) {}

  processToolCall(request: ToolCallDto) {
    // Step 1: Verify that the requested tool operation
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
          reason: 'Tool operation is not registered with AgentGate.',
        },
        timestamp: new Date().toISOString(),
        executed: false,
        message: 'Unknown tool operation blocked by AgentGate.',
      };

      console.log('[AGENTGATE]', JSON.stringify(response, null, 2));

      return response;
    }

    // Step 2: Calculate the risk of the registered operation.
    const risk = this.riskService.calculateRisk(
      toolDefinition,
      request.target,
    );

    // Step 3: Evaluate the operation against policy.
    const policy = this.policyService.evaluate(
      request.tool,
      request.operation,
      request.target,
    );

    // Step 4: Determine the final decision.
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

    // Temporary audit output.
    console.log('[AGENTGATE]', JSON.stringify(response, null, 2));

    // Step 5: Block the request if policy rejected it.
    if (decision === 'BLOCK') {
      return {
        ...response,
        executed: false,
        message: 'Tool call blocked by AgentGate policy.',
      };
    }

    // Step 6: Pause the request if human approval is required.
    if (decision === 'REQUIRE_APPROVAL') {
      return {
        ...response,
        executed: false,
        message: 'Human approval required before execution.',
      };
    }

    // Step 7: Execute the safe mock tool.
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