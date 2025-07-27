/**
 * Unit tests for iamHonoMiddleware (Hono integration)
 */
import { iamHonoMiddleware } from '../src/frameworks/hono';
import { IAM } from '../src/core/iam';
import { InMemoryAdapter } from '../src/adapters/inMemoryAdapter';
import { defaultPolicyEvaluator } from '../src/core/defaultEvaluator';
import { DefaultLogger } from '../src/core/logger';
import type { User, Role, Policy } from '../src/types/entities';

describe('iamHonoMiddleware', () => {
  const user: User = { id: 'u1', roleIds: ['r1'], policyIds: [] };
  const role: Role = { id: 'r1', name: 'admin', policyIds: ['p1'] };
  const policy: Policy = {
    id: 'p1',
    name: 'AllowRead',
    statements: [
      { effect: 'Allow', actions: ['read'], resources: ['doc:1'] },
    ],
  };
  const adapter = new InMemoryAdapter({ users: [user], roles: [role], policies: [policy] });
  const logger = new DefaultLogger('debug');
  const iam = new IAM({ storage: adapter, evaluatorFunc: defaultPolicyEvaluator, config: { logger, logLevel: 'debug' } });

  it('should call next if access allowed', async () => {
    const c = {
      get: (k: string) => (k === 'user' ? user : k === 'action' ? 'read' : k === 'resource' ? 'doc:1' : undefined),
      req: { method: 'read', path: 'doc:1' },
    } as any;
    const next = jest.fn();
    await iamHonoMiddleware(iam)(c, next);
    expect(next).toHaveBeenCalled();
  });

  it('should return 401 if user is missing', async () => {
    const c = {
      get: () => undefined,
      req: { method: 'read', path: 'doc:1' },
      text: jest.fn(),
    } as any;
    const next = jest.fn();
    await iamHonoMiddleware(iam)(c, next);
    expect(c.text).toHaveBeenCalledWith('User not found', 401);
  });

  it('should return 403 if access denied', async () => {
    const c = {
      get: (k: string) => (k === 'user' ? { ...user, roleIds: [] } : k === 'action' ? 'read' : k === 'resource' ? 'doc:1' : undefined),
      req: { method: 'read', path: 'doc:1' },
      json: jest.fn(),
    } as any;
    const next = jest.fn();
    await iamHonoMiddleware(iam)(c, next);
    expect(c.json).toHaveBeenCalledWith({ error: 'Access denied', trace: expect.anything() }, 403);
  });
});
