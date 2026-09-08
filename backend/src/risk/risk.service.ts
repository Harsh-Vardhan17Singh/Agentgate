import { Injectable } from '@nestjs/common';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskResult {
  score: number;
  level: RiskLevel;
  reason: string;
}

@Injectable()
export class RiskService {
  calculateRisk(tool: string, operation: string): RiskResult {
    const action = `${tool}.${operation}`.toLowerCase();

    if (
      action.includes('delete_repository') ||
      action.includes('delete_all') ||
      action.includes('drop_table')
    ) {
      return {
        score: 98,
        level: 'CRITICAL',
        reason: 'Destructive operation affecting a major resource.',
      };
    }

    if (
      action.includes('delete') ||
      action.includes('modify') ||
      action.includes('update')
    ) {
      return {
        score: 75,
        level: 'HIGH',
        reason: 'Operation can modify or remove existing data.',
      };
    }

    if (
      action.includes('send_email') ||
      action.includes('send_message')
    ) {
      return {
        score: 40,
        level: 'MEDIUM',
        reason: 'External communication can have user or business impact.',
      };
    }

    return {
      score: 10,
      level: 'LOW',
      reason: 'Read-only or low-impact operation.',
    };
  }
}