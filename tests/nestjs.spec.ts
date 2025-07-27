/**
 * Unit tests for IamGuard (NestJS integration)
 */
import { IamGuard } from '../src/frameworks/nestjs';
import { IAM } from '../src/core/iam';
import { InMemoryAdapter } from '../src/adapters/inMemoryAdapter';
import { defaultPolicyEvaluator } from '../src/core/defaultEvaluator';
import type { User, Role, Policy } from '../src/types/entities';

describe('IamGuard', () => {
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
  const iam = new IAM({ storage: adapter, evaluator: defaultPolicyEvaluator });
  const guard = new IamGuard(iam);

  function makeContext(req: any) {
    return {
      switchToHttp: () => ({ getRequest: () => req }),
    } as any;
  }

  it('should return true if access allowed', async () => {
    const req = { user, action: 'read', resource: 'doc:1', method: 'read', path: 'doc:1', context: {} };
    const context = makeContext(req);
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should return false if user is missing', async () => {
    const req = { action: 'read', resource: 'doc:1', method: 'read', path: 'doc:1', context: {} };
    const context = makeContext(req);
    await expect(guard.canActivate(context)).resolves.toBe(false);
  });

  it('should return false if access denied', async () => {
    const req = { user: { ...user, roleIds: [] }, action: 'read', resource: 'doc:1', method: 'read', path: 'doc:1', context: {} };
    const context = makeContext(req);
    await expect(guard.canActivate(context)).resolves.toBe(false);
  });

  it('should use fallback action/resource if not provided', async () => {
    const req = { user, method: 'read', path: 'doc:1', context: {} };
    const context = makeContext(req);
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});
