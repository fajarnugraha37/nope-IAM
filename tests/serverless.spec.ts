/**
 * Unit tests for serverlessHandler (serverless integration)
 */
import { serverlessHandler } from '../src/frameworks/serverless';
import { IAM } from '../src/core/iam';
import { InMemoryAdapter } from '../src/adapters/inMemoryAdapter';
import { defaultPolicyEvaluator } from '../src/core/defaultEvaluator';
import type { User, Role, Policy } from '../src/types/entities';

describe('serverlessHandler', () => {
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

  it('should resolve if access allowed', async () => {
    await expect(serverlessHandler(iam, { user, action: 'read', resource: 'doc:1', context: {} }, {})).resolves.toBeUndefined();
  });

  it('should throw if user is missing', async () => {
    await expect(serverlessHandler(iam, { action: 'read', resource: 'doc:1', context: {} }, {})).rejects.toThrow('User not found');
  });

  it('should throw if access denied', async () => {
    await expect(serverlessHandler(iam, { user: { ...user, roleIds: [] }, action: 'read', resource: 'doc:1', context: {} }, {})).rejects.toThrow('Access denied');
  });
});
