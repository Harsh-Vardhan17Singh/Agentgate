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
    const action = `${tool}.${operation}`.toLowerCase();

    // Explicitly dangerous operations
    if (
      action === 'database.delete_all' ||
      action === 'database.drop_table' ||
      action === 'github.delete_repository'
    ) {
      return 'BLOCK';
    }

    // Never allow production branch deletion automatically
    if (
      tool.toLowerCase() === 'github' &&
      operation.toLowerCase() === 'delete_branch' &&
      target.toLowerCase() === 'production'
    ) {
      return 'BLOCK';
    }

    // Operations that require a human
    if (
      action === 'email.send_email' ||
      action === 'crm.update_customer'
    ) {
      return 'REQUIRE_APPROVAL';
    }

    // Read operations
    if (
      action.startsWith('github.read') ||
      action === 'database.select'
    ) {
      return 'ALLOW';
    }

    // Safe branch operations
    if (
      action === 'github.list_branches' ||
      action === 'github.get_branch_details' ||
      action === 'github.delete_branch'
    ) {
      return 'ALLOW';
    }

    // Unknown actions are not trusted automatically
    return 'BLOCK';
  }
}