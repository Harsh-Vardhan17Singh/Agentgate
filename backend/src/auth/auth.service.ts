import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

interface AgentIdentity {
  agentId: string;
  name: string;
  active: boolean;
}

@Injectable()
export class AuthService {
  private readonly agents = new Map<
    string,
    AgentIdentity
  >([
    [
      'dev-agent-key',
      {
        agentId: 'demo-agent',
        name: 'Development Agent',
        active: true,
      },
    ],
    [
      'admin-agent-key',
      {
        agentId: 'admin-agent',
        name: 'Admin Agent',
        active: true,
      },
    ],
  ]);

  authenticate(apiKey: string): AgentIdentity {
    const agent = this.agents.get(apiKey);

    if (!agent || !agent.active) {
      throw new UnauthorizedException(
        'Invalid or inactive agent credentials',
      );
    }

    return agent;
  }
}
