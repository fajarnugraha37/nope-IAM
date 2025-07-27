/**
 * Unit tests for AccessControl decorator
 */
import { AccessControl } from '../src/decorators/accessControl';
import { IAM } from '../src/core/iam';
import { InMemoryAdapter } from '../src/adapters/inMemoryAdapter';
import { defaultPolicyEvaluator } from '../src/core/defaultEvaluator';
import type { User, Role, Policy } from '../src/types/entities';

describe('AccessControl decorator', () => {
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

  it('should throw if not applied to a method', () => {
    expect(() => {
      AccessControl({ action: 'read', resource: 'doc:1' })({}, 'foo', {});
    }).toThrow('AccessControl can only be applied to methods');
  });

  it('should throw if IAM instance is missing', async () => {
    class Test {
      user = user;
      // @ts-expect-error
      @AccessControl({ action: 'read', resource: 'doc:1' })
      async foo() { return 'ok'; }
    }
    const t = new Test();
    // Remove global.iam if set
    const old = (global as any).iam;
    delete (global as any).iam;
    try {
        await t.foo();
    } catch (e) {
        expect(e.message).toBe('IAM instance not found');
    }
    if (old) (global as any).iam = old;
  });

  it('should allow decorated method when access is granted', async () => {
    class Test {
      iam = iam;
      user = user;
      // @ts-expect-error
      @AccessControl({ action: 'read', resource: 'doc:1' })
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
      @AccessControl({ action: 'write', resource: 'doc:1' })
      async foo() { return 'fail'; }
    }
    const t = new Test();
    await expect(t.foo()).rejects.toThrow('Access denied');
  });

  it('should support dynamic params function', async () => {
    class Test {
      iam = iam;
      user = user;
      // @ts-expect-error
      @AccessControl((action: string) => ({ action, resource: 'doc:1' }))
      async foo(action: string) { return action; }
    }
    const t = new Test();
    await expect(t.foo('read')).resolves.toBe('read');
    await expect(t.foo('write')).rejects.toThrow('Access denied');
  });
});
