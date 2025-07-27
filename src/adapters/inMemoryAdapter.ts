/**
 * In-memory storage adapter
 * @packageDocumentation
 */

import type { User, Role, Policy } from '../types/entities';
import type { IAMStorage } from '../core/storage';

export interface InMemoryAdapterOptions {
  users?: User[];
  roles?: Role[];
  policies?: Policy[];
}

/**
 * In-memory storage adapter implementing IAMStorage
 */
export class InMemoryAdapter implements IAMStorage {
  private users: Map<string, User>;
  private roles: Map<string, Role>;
  private policies: Map<string, Policy>;

  constructor(options: InMemoryAdapterOptions = {}) {
    this.users = new Map(options.users?.map(u => [u.id, u]) ?? []);
    this.roles = new Map(options.roles?.map(r => [r.id, r]) ?? []);
    this.policies = new Map(options.policies?.map(p => [p.id, p]) ?? []);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }
  async getUsers(ids: string[]): Promise<User[]> {
    return ids.map(id => this.users.get(id)).filter(Boolean) as User[];
  }
  async *getAllUsers(): AsyncIterable<User> {
    for (const user of this.users.values()) yield user;
  }

  async getRole(id: string): Promise<Role | undefined> {
    return this.roles.get(id);
  }
  async getRoles(ids: string[]): Promise<Role[]> {
    return ids.map(id => this.roles.get(id)).filter(Boolean) as Role[];
  }
  async *getAllRoles(): AsyncIterable<Role> {
    for (const role of this.roles.values()) yield role;
  }

  async getPolicy(id: string): Promise<Policy | undefined> {
    return this.policies.get(id);
  }
  async getPolicies(ids: string[]): Promise<Policy[]> {
    return ids.map(id => this.policies.get(id)).filter(Boolean) as Policy[];
  }
  async *getAllPolicies(): AsyncIterable<Policy> {
    for (const policy of this.policies.values()) yield policy;
  }

  async saveUser(user: User): Promise<void> {
    this.users.set(user.id, user);
  }
  async saveRole(role: Role): Promise<void> {
    this.roles.set(role.id, role);
  }
  async savePolicy(policy: Policy): Promise<void> {
    this.policies.set(policy.id, policy);
  }

  async deleteUser(id: string): Promise<void> {
    this.users.delete(id);
  }
  async deleteRole(id: string): Promise<void> {
    this.roles.delete(id);
  }
  async deletePolicy(id: string): Promise<void> {
    this.policies.delete(id);
  }
}
