/**
 * Plain TypeScript usage example for the IAM library (no framework)
 * Demonstrates defining users, roles, policies, and evaluating access
 */
import { IAM } from '../core/iam';
import { InMemoryAdapter } from '../adapters/inMemoryAdapter';
import { defaultPolicyEvaluator } from '../core/defaultEvaluator';
import type { User, Role, Policy } from '../types/entities';

// Define a policy allowing read access to resource 'doc:1'
const policy: Policy = {
  id: 'p1',
  name: 'AllowRead',
  statements: [
    {
      effect: 'Allow',
      actions: ['read'],
      resources: ['doc:1'],
    },
  ],
};

// Define a role that includes the policy
const role: Role = {
  id: 'r1',
  name: 'reader',
  policyIds: ['p1'],
};

// Define a user assigned to the role
const user: User = {
  id: 'u1',
  roleIds: ['r1'],
  policyIds: [],
};

// Set up the IAM engine with in-memory storage
const adapter = new InMemoryAdapter({ users: [user], roles: [role], policies: [policy] });
const iam = new IAM({ storage: adapter, evaluator: defaultPolicyEvaluator });

async function main() {
  // Evaluate access for the user
  const result = await iam.can({ user, action: 'read', resource: 'doc:1' });
  console.log('Decision:', result.decision); // true
  console.log('Trace:', result.trace);

  // Try an action not allowed by policy
  const denied = await iam.can({ user, action: 'write', resource: 'doc:1' });
  console.log('Decision:', denied.decision); // false
  console.log('Trace:', denied.trace);
}

main().catch(console.error);
