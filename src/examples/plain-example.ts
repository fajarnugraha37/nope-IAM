/**
 * Plain TypeScript usage example for the IAM library (no framework)
 * Demonstrates defining users, roles, policies, and evaluating access
 */
import { DefaultLogger, IAM, InMemoryAdapter, defaultPolicyEvaluator, defaultConditionOperators } from '../index.js';
import type { User, Role, Policy } from '../index.js';

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
// Set up the IAM engine with in-memory storage and centralized logger
const logger = new DefaultLogger('debug');
const iam = new IAM({
  storage: adapter,
  evaluatorFunc: defaultPolicyEvaluator,
  config: { logger, logLevel: 'debug' },
});

async function main() {
  // Evaluate access for the user
  const result = await iam.can({ user, action: 'read', resource: 'doc:1' });
  console.log('Decision:', result.decision); // true
  console.log('Trace:', result.trace);

  // Try an action not allowed by policy
  const denied = await iam.can({ user, action: 'write', resource: 'doc:1' });
  console.log('Decision:', denied.decision); // false
  console.log('Trace:', denied.trace);

  // --- Demonstrate all new operators ---
  const context = {
    num: 10,
    str: 'hello world',
    arr: [1, 2, 3],
    regexStr: 'abc123',
  };

  const operators = defaultConditionOperators;

  // eq
  console.log('eq:', operators.eq('num', 10, context)); // true
  // ne
  console.log('ne:', operators.ne('num', 5, context)); // true
  // gt
  console.log('gt:', operators.gt('num', 5, context)); // true
  // lt
  console.log('lt:', operators.lt('num', 20, context)); // true
  // gte
  console.log('gte:', operators.gte('num', 10, context)); // true
  // lte
  console.log('lte:', operators.lte('num', 10, context)); // true
  // in
  console.log('in:', operators.in('num', [5, 10, 15], context)); // true
  // contains (string)
  console.log('contains (string):', operators.contains('str', 'world', context)); // true
  // contains (array)
  console.log('contains (array):', operators.contains('arr', 2, context)); // true
  // regex (RegExp)
  console.log('regex (RegExp):', operators.regex('regexStr', /^abc\d+$/, context)); // true
  // regex (string)
  console.log('regex (string):', operators.regex('regexStr', 'abc', context)); // true
}

main().catch(console.error);
