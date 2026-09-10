import { Injectable } from '@nestjs/common';

export type ToolSensitivity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ToolDefinition {
  name: string;
  operation: string;
  description: string;
  sensitivity: ToolSensitivity;
}

@Injectable()
export class ToolsService {
  private readonly tools: ToolDefinition[] = [
    {
      name: 'github',
      operation: 'list_branches',
      description: 'List repository branches.',
      sensitivity: 'LOW',
    },
    {
      name: 'github',
      operation: 'get_branch_details',
      description: 'Get details about a repository branch.',
      sensitivity: 'LOW',
    },
    {
      name: 'github',
      operation: 'delete_branch',
      description: 'Delete a repository branch.',
      sensitivity: 'HIGH',
    },
    {
      name: 'github',
      operation: 'delete_repository',
      description: 'Delete an entire repository.',
      sensitivity: 'CRITICAL',
    },
    {
      name: 'database',
      operation: 'select',
      description: 'Read records from the database.',
      sensitivity: 'LOW',
    },
    {
      name: 'database',
      operation: 'update',
      description: 'Modify database records.',
      sensitivity: 'HIGH',
    },
    {
      name: 'database',
      operation: 'delete_all',
      description: 'Delete all records from a database table.',
      sensitivity: 'CRITICAL',
    },
    {
      name: 'database',
      operation: 'drop_table',
      description: 'Permanently remove a database table.',
      sensitivity: 'CRITICAL',
    },
    {
      name: 'email',
      operation: 'send_email',
      description: 'Send an email to an external recipient.',
      sensitivity: 'MEDIUM',
    },
    {
      name: 'crm',
      operation: 'update_customer',
      description: 'Modify customer information.',
      sensitivity: 'HIGH',
    },
  ];

  findTool(tool: string, operation: string): ToolDefinition | undefined {
    return this.tools.find(
      (definition) =>
        definition.name.toLowerCase() === tool.toLowerCase() &&
        definition.operation.toLowerCase() === operation.toLowerCase(),
    );
  }

  getAllTools(): ToolDefinition[] {
    return this.tools;
  }
}