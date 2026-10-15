import { Injectable } from '@nestjs/common';
import { ToolDefinition } from '../tools/tools.service';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskResult {
  score: number;
  level: RiskLevel;
  reason: string;
}

@Injectable()
export class RiskService {
  calculateRisk(
    toolDefinition: ToolDefinition,
    target: string,
  ): RiskResult {
    let score = this.getBaseScore(toolDefinition.sensitivity);
    let reason = `Base risk is based on ${toolDefinition.sensitivity.toLowerCase()} tool sensitivity.`;

    const normalizedTarget = target.toLowerCase();

    // Production is more sensitive than a normal development target.
    if (normalizedTarget === 'production') {
      score += 20;
      reason += ' Production is a sensitive target.';
    }

    // Destructive operations receive additional risk.
    if (
      toolDefinition.operation.toLowerCase().includes('delete') ||
      toolDefinition.operation.toLowerCase().includes('drop')
    ) {
      score += 10;
      reason += ' The operation is destructive.';
    }

    // Never allow the score to exceed 100.
    score = Math.min(score, 100);

    return {
      score,
      level: this.getRiskLevel(score),
      reason,
    };
  }

  private getBaseScore(sensitivity: ToolDefinition['sensitivity']): number {
    switch (sensitivity) {
      case 'LOW':
        return 10;

      case 'MEDIUM':
        return 40;

      case 'HIGH':
        return 70;

      case 'CRITICAL':
        return 90;

      default:
        return 100;
    }
  }

  private getRiskLevel(score: number): RiskLevel {
    if (score >= 90) {
      return 'CRITICAL';
    }

    if (score >= 70) {
      return 'HIGH';
    }

    if (score >= 40) {
      return 'MEDIUM';
    }

    return 'LOW';
  }
}