import { Test, TestingModule } from '@nestjs/testing';
import { jest } from '@jest/globals';
import { ApprovalController } from './approval.controller.js';
import { ReviewerAuthGuard } from '../auth/reviewer-auth.guard.js';
import { ConfigService } from '@nestjs/config';
import { ApprovalService } from './approval.service.js';

describe('ApprovalController', () => {
  let controller: ApprovalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApprovalController],
      providers: [
        {
          provide: ApprovalService,
          useValue: {},
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(ReviewerAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ApprovalController>(ApprovalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
