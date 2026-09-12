import { Injectable } from '@nestjs/common';

export type PolicyDecision =
  | 'ALLOW'
  | 'BLOCK'
  | 'REQUIRE_APPROVAL';

@Injectable()
export class PolicyService {
  evaluate(
    tool: string,
    operation: string,
    target: string,
  ): PolicyDecision {
    const normalizedTool = tool.toLowerCase();
    const normalizedOperation = operation.toLowerCase();
    const normalizedTarget = target.toLowerCase();

    // Production branch deletion is forbidden.
    if (
      normalizedTool === 'github' &&
      normalizedOperation === 'delete_branch' &&
      normalizedTarget === 'production'
    ) {
      return 'BLOCK';
    }

    // Sending an email requires human approval.
    if (
      normalizedTool === 'email' &&
      normalizedOperation === 'send_email'
    ) {
      return 'REQUIRE_APPROVAL';
    }

    // Destructive database operations require human approval.
    if (
      normalizedTool === 'database' &&
      (
        normalizedOperation === 'update' ||
        normalizedOperation === 'delete_all'
      )
    ) {
      return 'REQUIRE_APPROVAL';
    }

    // Everything else is currently allowed.
    return 'ALLOW';
  }
}