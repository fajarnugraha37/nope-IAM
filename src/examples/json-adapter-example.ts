/**
 * Example: Using the JSONFileAdapter for IAM
 * Demonstrates loading and saving IAM entities from a JSON file
 */
import { IAM } from '../core/iam';
import { JSONFileAdapter } from '../adapters/jsonFileAdapter';
import { defaultPolicyEvaluator } from '../core/defaultEvaluator';
import type { User, Role, Policy } from '../types/entities';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Prepare a JSON file with initial data
const data = {
  users: [
    { id: 'u1', roleIds: ['r1'], policyIds: [] },
  ],
  roles: [
    { id: 'r1', name: 'reader', policyIds: ['p1'] },
  ],
  policies: [
    {
      id: 'p1',
      name: 'AllowRead',
      statements: [
        { effect: 'Allow', actions: ['read'], resources: ['doc:1'] },
      ],
    },
  ],
};
const jsonPath = join(__dirname, 'iam-data.json');
writeFileSync(jsonPath, JSON.stringify(data, null, 2));

const adapter = new JSONFileAdapter({
    filePath: jsonPath,
});
const iam = new IAM({ storage: adapter, evaluatorFunc: defaultPolicyEvaluator });

async function main() {
  const user: User = { id: 'u1', roleIds: ['r1'], policyIds: [] };
  const result = await iam.can({ user, action: 'read', resource: 'doc:1' });
  console.log('JSONFileAdapter: Decision:', result.decision); // true
}

main().catch(console.error);
