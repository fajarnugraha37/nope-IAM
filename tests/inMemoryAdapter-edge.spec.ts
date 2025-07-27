/**
 * Additional branch and edge case tests for InMemoryAdapter
 */
import { InMemoryAdapter } from '../src/adapters/inMemoryAdapter';
import type { User, Role, Policy } from '../src/types/entities';

describe('InMemoryAdapter edge cases', () => {
  it('should handle empty initialization', async () => {
    const adapter = new InMemoryAdapter();
    expect(await adapter.getUser('x')).toBeUndefined();
    expect(await adapter.getRole('x')).toBeUndefined();
    expect(await adapter.getPolicy('x')).toBeUndefined();
    const users: User[] = [];
    for await (const u of adapter.getAllUsers()) users.push(u);
    expect(users).toEqual([]);
    const roles: Role[] = [];
    for await (const r of adapter.getAllRoles()) roles.push(r);
    expect(roles).toEqual([]);
    const policies: Policy[] = [];
    for await (const p of adapter.getAllPolicies()) policies.push(p);
    expect(policies).toEqual([]);
  });

  it('should not throw when deleting non-existent entities', async () => {
    const adapter = new InMemoryAdapter();
    await expect(adapter.deleteUser('nope')).resolves.toBeUndefined();
    await expect(adapter.deleteRole('nope')).resolves.toBeUndefined();
    await expect(adapter.deletePolicy('nope')).resolves.toBeUndefined();
  });

  it('should overwrite existing user, role, policy on save', async () => {
    const user: User = { id: 'u', roleIds: [], policyIds: [] };
    const role: Role = { id: 'r', name: 'r', policyIds: [] };
    const policy: Policy = { id: 'p', name: 'p', statements: [] };
    const adapter = new InMemoryAdapter({ users: [user], roles: [role], policies: [policy] });
    const user2 = { ...user, roleIds: ['r'] };
    await adapter.saveUser(user2);
    expect(await adapter.getUser('u')).toEqual(user2);
    const role2 = { ...role, name: 'r2' };
    await adapter.saveRole(role2);
    expect(await adapter.getRole('r')).toEqual(role2);
    const policy2 = { ...policy, name: 'p2' };
    await adapter.savePolicy(policy2);
    expect(await adapter.getPolicy('p')).toEqual(policy2);
  });
});
