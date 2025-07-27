/**
 * Example: Using the InMemoryAdapter for IAM
 */
import { IAM } from '../core/iam';
import { InMemoryAdapter } from '../adapters/inMemoryAdapter';
import { defaultPolicyEvaluator } from '../core/defaultEvaluator';
import type { User, Role, Policy } from '../types/entities';

const policy: Policy = {
  id: 'p1',
  name: 'AllowRead',
  statements: [
    { effect: 'Allow', actions: ['read'], resources: ['doc:1'] },
  ],
};
const role: Role = { id: 'r1', name: 'reader', policyIds: ['p1'] };
const user: User = { id: 'u1', roleIds: ['r1'], policyIds: [] };

const adapter = new InMemoryAdapter({ users: [user], roles: [role], policies: [policy] });
const iam = new IAM({ storage: adapter, evaluator: defaultPolicyEvaluator });

async function main() {
  const result = await iam.can({ user, action: 'read', resource: 'doc:1' });
  console.log('InMemoryAdapter: Decision:', result.decision); // true
}

main().catch(console.error);
