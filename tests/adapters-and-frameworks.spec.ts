/**
 * Unit tests for IAM decorators and framework adapters
 */
import { IAM } from '../src/core/iam';
import { InMemoryAdapter } from '../src/adapters/inMemoryAdapter';
import { defaultPolicyEvaluator } from '../src/core/defaultEvaluator';
import { DefaultLogger } from '../src/core/logger';
import { User, Role, Policy } from '../src/types/entities';
import { AccessControl } from '../src/decorators/accessControl';
import { iamExpressMiddleware } from '../src/frameworks/express';
import { iamFastifyHook } from '../src/frameworks/fastify';
import { iamHonoMiddleware } from '../src/frameworks/hono';
import { IamGuard } from '../src/frameworks/nestjs';
import { handleEvent } from '../src/frameworks/eventDriven';
import { serverlessHandler } from '../src/frameworks/serverless';

// Mocks for framework objects
const mockReq = (user: any) => ({ user, method: 'GET', path: '/foo', action: undefined, resource: undefined, context: undefined });
const mockRes = () => {
  const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return res;
};
const mockNext = jest.fn();
const mockReply = () => ({ status: jest.fn().mockReturnThis(), send: jest.fn().mockReturnThis() });
const mockContext = () => ({ get: jest.fn(), req: { method: 'get', path: '/foo' }, text: jest.fn(), json: jest.fn() });

const user: User = { id: 'u1', roleIds: ['r1'], policyIds: [] };
const role: Role = { id: 'r1', name: 'admin', policyIds: ['p1'] };
const policy: Policy = {
  id: 'p1',
  name: 'AllowRead',
  statements: [
    { effect: 'Allow', actions: ['read', 'get'], resources: ['/foo'] },
  ],
};
const adapter = new InMemoryAdapter({ users: [user], roles: [role], policies: [policy] });
const logger = new DefaultLogger('debug');
const iam = new IAM({ storage: adapter, evaluatorFunc: defaultPolicyEvaluator, config: { logger, logLevel: 'debug' } });

describe('AccessControl decorator', () => {
  it('should allow decorated method when access is granted', async () => {
    class Test {
      iam = iam;
      user = user;
      // @ts-expect-error
      @AccessControl({ action: 'read', resource: '/foo' })
      async foo() { return 'ok'; }
    }
    const t = new Test();
    await expect(t.foo()).resolves.toBe('ok');
  });
  it('should deny decorated method when access is denied', async () => {
    class Test {
      iam = iam;
      user = user;
      // @ts-expect-error
      @AccessControl({ action: 'write', resource: '/foo' })
      async foo() { return 'fail'; }
    }
    const t = new Test();
    await expect(t.foo()).rejects.toThrow('Access denied');
  });
});

describe('Express middleware', () => {
  it('should call next() if access allowed', async () => {
    const req = mockReq({ ...user, roleIds: ['r1'] });
    const res = mockRes();
    const next = jest.fn();
    const middleware = iamExpressMiddleware(iam);
    await middleware(req as any, res, next);
    expect(next).toHaveBeenCalled();
  });
  it('should return 403 if access denied', async () => {
    const req = mockReq({ ...user, roleIds: [] });
    const res = mockRes();
    await iamExpressMiddleware(iam)(req as any, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe('Fastify hook', () => {
  it('should call reply if access denied', async () => {
    const reply = mockReply();
    const req = { ...mockReq({ ...user, roleIds: [] }), url: '/foo' };
    await iamFastifyHook(iam)(req as any, reply as any);
    expect(reply.status).toHaveBeenCalledWith(403);
  });
});

describe('Hono middleware', () => {
  it('should call next if access allowed', async () => {
    const c = mockContext();
    c.get.mockImplementation((k: string) => (k === 'user' ? user : k === 'action' ? 'read' : k === 'resource' ? '/foo' : undefined));
    const next = jest.fn();
    await iamHonoMiddleware(iam)(c as any, next);
    expect(next).toHaveBeenCalled();
  });
});

describe('NestJS guard', () => {
  it('should return true if access allowed', async () => {
    const guard = new IamGuard(iam);
    const context = {
      switchToHttp: () => ({ getRequest: () => ({ user, action: 'read', path: '/foo', method: 'get' }) })
    } as any;
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});

describe('Event-driven and serverless handlers', () => {
  it('should throw if access denied (event)', async () => {
    await expect(handleEvent(iam, { user: { ...user, roleIds: [] }, action: 'read', resource: '/foo', context: {} })).rejects.toThrow('Access denied');
  });
  it('should throw if access denied (serverless)', async () => {
    await expect(serverlessHandler(iam, { user: { ...user, roleIds: [] }, action: 'read', resource: '/foo', context: {} }, {})).rejects.toThrow('Access denied');
  });
});
