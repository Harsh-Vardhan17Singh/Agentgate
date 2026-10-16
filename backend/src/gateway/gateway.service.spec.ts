import { Test, TestingModule } from '@nestjs/testing';
import { GatewayService } from './gateway.service.js';
import { PolicyService } from '../policy/policy.service.js';
import { RiskService } from '../risk/risk.service.js';
import { ToolsService } from '../tools/tools.service.js';
import { ApprovalService } from '../approval/approval.service.js';
import { ExecutionService } from '../execution/execution.service.js';
import { AuditService } from '../audit/audit.service.js';
import { AuthorizationService } from '../auth/authorization.service.js';

describe('GatewayService', () => {
  let service: GatewayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GatewayService,
        { provide: PolicyService, useValue: {} },
        { provide: RiskService, useValue: {} },
        { provide: ToolsService, useValue: {} },
        { provide: ApprovalService, useValue: {} },
        { provide: ExecutionService, useValue: {} },
        { provide: AuditService, useValue: {} },
        { provide: AuthorizationService, useValue: {} },
      ],
    }).compile();

    service = module.get<GatewayService>(GatewayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
