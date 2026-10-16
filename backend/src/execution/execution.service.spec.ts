import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionService } from './execution.service.js';
import { GitHubExecutionAdapter } from './adapters/github-execution.adapter.js';

describe('ExecutionService', () => {
  let service: ExecutionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecutionService,
        {
          provide: GitHubExecutionAdapter,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ExecutionService>(ExecutionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
