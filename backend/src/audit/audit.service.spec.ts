import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { jest } from '@jest/globals';
import { AuditService, AuditEventInput } from './audit.service.js';
import { AuditEvent } from './schemas/audit-event.schema.js';

describe('AuditService', () => {
  let service: AuditService;

  const save = jest.fn<() => Promise<unknown>>();
  const find = jest.fn<() => {
    sort: jest.Mock;
  }>();

  const sort = jest.fn<() => {
    exec: jest.Mock;
  }>();

  const exec = jest.fn<() => Promise<unknown>>();

  const auditEventModel = jest.fn<(event: AuditEventInput) => {
    save: typeof save;
  }>();

  const eventInput: AuditEventInput = {
    agentId: 'test-agent',
    tool: 'github',
    operation: 'delete_branch',
    target: 'test-owner/test-repository',
    approvalId:'approval-test-123',
    decision: 'APPROVED',
    riskScore: 70,
    riskLevel: 'HIGH',
    executed: true,
    event: 'EXECUTED',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    auditEventModel.mockImplementation(() => ({
      save,
    }));

    find.mockReturnValue({ sort });
    sort.mockReturnValue({ exec });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getModelToken(AuditEvent.name),
          useValue: Object.assign(auditEventModel, { find }),
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('saves an audit event with the supplied fields', async () => {
    const savedEvent = {
      ...eventInput,
      toObject: () => eventInput,
    };

    save.mockResolvedValue(savedEvent);

    await expect(service.record(eventInput)).resolves.toBe(savedEvent);

    expect(auditEventModel).toHaveBeenCalledWith(eventInput);
    expect(auditEventModel).toHaveBeenCalledWith(
      expect.objectContaining({
        approvalId:'approval-test-123',
      }),
    );
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('propagates database save failures', async () => {
    const databaseError = new Error('Database unavailable');
    save.mockRejectedValue(databaseError);

    await expect(service.record(eventInput)).rejects.toThrow(
      'Database unavailable',
    );
  });

  it('retrieves all audit events newest first when no approval ID is supplied', async () => {
  const events = [eventInput];
  exec.mockResolvedValue(events);

  await expect(service.getEvents()).resolves.toBe(events);

  expect(find).toHaveBeenCalledWith({});
  expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
  expect(exec).toHaveBeenCalledTimes(1);
});

it('filters audit events by approval ID when supplied', async () => {
  const events = [eventInput];
  exec.mockResolvedValue(events);

  await expect(
    service.getEvents('approval-test-123'),
  ).resolves.toBe(events);

  expect(find).toHaveBeenCalledWith({
    approvalId: 'approval-test-123',
  });
  expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
  expect(exec).toHaveBeenCalledTimes(1);
 });
});