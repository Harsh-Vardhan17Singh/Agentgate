import { Test, TestingModule } from '@nestjs/testing';
import { GatewayController } from './gateway.controller.js';
import { GatewayService } from './gateway.service.js';
import { AuthService } from '../auth/auth.service.js';

describe('GatewayController', () => {
  let controller: GatewayController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GatewayController],
      providers: [
        {
          provide: GatewayService,
          useValue: {},
        },
        {
          provide: AuthService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<GatewayController>(GatewayController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
