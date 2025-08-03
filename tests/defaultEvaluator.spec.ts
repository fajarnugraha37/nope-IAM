/**
 * Unit tests for defaultPolicyEvaluator (IAM core)
 */
import { defaultPolicyEvaluator } from '../src/core/defaultEvaluator';
import { DefaultLogger } from '../src/core/logger';
import type { User, Role, Policy } from '../src/types/entities';
import { defaultConditionOperators } from '../src/core/evaluator';

describe('defaultPolicyEvaluator', () => {
  const user: User = { id: 'u1', roleIds: ['r1'], policyIds: [] };
  const role: Role = { id: 'r1', name: 'admin', policyIds: ['p1'] };
  const allowPolicy: Policy = {
    id: 'p1',
    name: 'AllowRead',
    statements: [
      { effect: 'Allow', actions: ['read'], resources: ['doc:1'] },
    ],
  };
  const denyPolicy: Policy = {
    id: 'p2',
    name: 'DenyWrite',
    statements: [
      { effect: 'Deny', actions: ['write'], resources: ['doc:1'] },
    ],
  };
  const logger = new DefaultLogger('debug');
  const evaluator = defaultPolicyEvaluator(logger);

  it('should allow when user or role policy allows', async () => {
    const result = await evaluator(
      user,
      'read',
      'doc:1',
      {},
      [allowPolicy],
      [role],
      defaultConditionOperators
    );
    expect(result.decision).toBe(true);
    expect(result.trace.checkedPolicies).toContain('p1');
    expect(result.trace.reason).toMatch(/Allowed by policy/);
  });

  it('should deny when no policy matches', async () => {
    const result = await evaluator(
      user,
      'delete',
      'doc:1',
      {},
      [allowPolicy],
      [role],
      defaultConditionOperators
    );
    expect(result.decision).toBe(false);
    expect(result.trace.reason).toMatch(/No matching policy/);
  });

  it('should not evaluate the same policy more than once', async () => {
    const result = await evaluator(
      user,
      'delete',
      'doc:1',
      {},
      [allowPolicy],
      [role],
      defaultConditionOperators
    );
    const occurrences = result.trace.checkedPolicies.filter((id) => id === 'p1');
    expect(occurrences).toHaveLength(1);
  });

  it('should deny when explicit deny policy matches', async () => {
    const result = await evaluator(
      user,
      'write',
      'doc:1',
      {},
      [denyPolicy],
      [role],
      defaultConditionOperators
    );
    expect(result.decision).toBe(false);
    expect(result.trace.reason).toMatch(/Denied by policy/);
  });

  it('should evaluate conditions (eq operator)', async () => {
    const condPolicy: Policy = {
      id: 'p3',
      name: 'AllowIfOwner',
      statements: [
        {
          effect: 'Allow',
          actions: ['read'],
          resources: ['doc:2'],
          conditions: [{ operator: 'eq', key: 'owner', value: 'u1' }],
        },
      ],
    };
    const ctx = { owner: 'u1' };
    const result = await evaluator(
      user,
      'read',
      'doc:2',
      ctx,
      [condPolicy],
      [],
      defaultConditionOperators
    );
    expect(result.decision).toBe(true);
  });

  it('should not allow if condition fails', async () => {
    const condPolicy: Policy = {
      id: 'p3',
      name: 'AllowIfOwner',
      statements: [
        {
          effect: 'Allow',
          actions: ['read'],
          resources: ['doc:2'],
          conditions: [{ operator: 'eq', key: 'owner', value: 'u1' }],
        },
      ],
    };
    const ctx = { owner: 'u2' };
    const result = await evaluator(
      user,
      'read',
      'doc:2',
      ctx,
      [condPolicy],
      [],
      defaultConditionOperators
    );
    expect(result.decision).toBe(false);
  });

  it('should support custom condition operator', async () => {
    const customOps = { ...defaultConditionOperators, always: () => true };
    const condPolicy: Policy = {
      id: 'p4',
      name: 'AllowAlways',
      statements: [
        {
          effect: 'Allow',
          actions: ['read'],
          resources: ['doc:3'],
          conditions: [{ operator: 'always', key: '', value: '' }],
        },
      ],
    };
    const result = await evaluator(
      user,
      'read',
      'doc:3',
      {},
      [condPolicy],
      [],
      customOps
    );
    expect(result.decision).toBe(true);
  });
});
