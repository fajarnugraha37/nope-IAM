/**
 * Unit tests for JSONFileAdapter
 */
import { JSONFileAdapter } from '../src/adapters/jsonFileAdapter';
import type { User, Role, Policy } from '../src/types/entities';
import { promises as fs } from 'fs';
import { join } from 'path';

describe('JSONFileAdapter', () => {
  const user: User = { id: 'u1', roleIds: ['r1'], policyIds: ['p1'] };
  const role: Role = { id: 'r1', name: 'role', policyIds: ['p1'] };
  const policy: Policy = { id: 'p1', name: 'policy', statements: [] };
  let adapter: JSONFileAdapter;
  let tmpPath: string;

  beforeEach(async () => {
    tmpPath = join(__dirname, 'iam-json-test.json');
    await fs.writeFile(tmpPath, JSON.stringify({ users: [user], roles: [role], policies: [policy] }, null, 2));
    adapter = new JSONFileAdapter({ filePath: tmpPath });
  });
  afterEach(async () => {
    await fs.unlink(tmpPath).catch(() => {});
  });

  it('should get user by id', async () => {
    expect(await adapter.getUser('u1')).toEqual(user);
    expect(await adapter.getUser('nope')).toBeUndefined();
  });

  it('should get users by ids', async () => {
    expect(await adapter.getUsers(['u1'])).toEqual([user]);
    expect(await adapter.getUsers(['nope'])).toEqual([]);
  });

  it('should get all users (async iterable)', async () => {
    const users: User[] = [];
    for await (const u of adapter.getAllUsers()) users.push(u);
    expect(users).toEqual([user]);
  });

  it('should get role by id', async () => {
    expect(await adapter.getRole('r1')).toEqual(role);
    expect(await adapter.getRole('nope')).toBeUndefined();
  });

  it('should get roles by ids', async () => {
    expect(await adapter.getRoles(['r1'])).toEqual([role]);
    expect(await adapter.getRoles(['nope'])).toEqual([]);
  });

  it('should get all roles (async iterable)', async () => {
    const roles: Role[] = [];
    for await (const r of adapter.getAllRoles()) roles.push(r);
    expect(roles).toEqual([role]);
  });

  it('should get policy by id', async () => {
    expect(await adapter.getPolicy('p1')).toEqual(policy);
    expect(await adapter.getPolicy('nope')).toBeUndefined();
  });

  it('should get policies by ids', async () => {
    expect(await adapter.getPolicies(['p1'])).toEqual([policy]);
    expect(await adapter.getPolicies(['nope'])).toEqual([]);
  });

  it('should get all policies (async iterable)', async () => {
    const policies: Policy[] = [];
    for await (const p of adapter.getAllPolicies()) policies.push(p);
    expect(policies).toEqual([policy]);
  });

  it('should save and update user', async () => {
    const u2: User = { id: 'u2', roleIds: [], policyIds: [] };
    await adapter.saveUser(u2);
    expect(await adapter.getUser('u2')).toEqual(u2);
    const updated = { ...u2, roleIds: ['r1'] };
    await adapter.saveUser(updated);
    expect(await adapter.getUser('u2')).toEqual(updated);
  });

  it('should save and update role', async () => {
    const r2: Role = { id: 'r2', name: 'r2', policyIds: [] };
    await adapter.saveRole(r2);
    expect(await adapter.getRole('r2')).toEqual(r2);
    const updated = { ...r2, name: 'updated' };
    await adapter.saveRole(updated);
    expect(await adapter.getRole('r2')).toEqual(updated);
  });

  it('should save and update policy', async () => {
    const p2: Policy = { id: 'p2', name: 'p2', statements: [] };
    await adapter.savePolicy(p2);
    expect(await adapter.getPolicy('p2')).toEqual(p2);
    const updated = { ...p2, name: 'updated' };
    await adapter.savePolicy(updated);
    expect(await adapter.getPolicy('p2')).toEqual(updated);
  });

  it('should delete user', async () => {
    await adapter.deleteUser('u1');
    expect(await adapter.getUser('u1')).toBeUndefined();
  });

  it('should delete role', async () => {
    await adapter.deleteRole('r1');
    expect(await adapter.getRole('r1')).toBeUndefined();
  });

  it('should delete policy', async () => {
    await adapter.deletePolicy('p1');
    expect(await adapter.getPolicy('p1')).toBeUndefined();
  });
});
