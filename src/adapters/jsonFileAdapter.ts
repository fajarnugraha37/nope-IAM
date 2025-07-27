/**
 * JSON file storage adapter (skeleton)
 * @packageDocumentation
 */
import type { User, Role, Policy } from '../types/entities.js';
import type { IAMStorage } from '../core/storage.js';
import { promises as fs } from 'fs';

export interface JSONFileAdapterOptions {
  filePath: string;
}

/**
 * JSON file storage adapter implementing IAMStorage
 */
export class JSONFileAdapter implements IAMStorage {
  private filePath: string;
  private data: { users: User[]; roles: Role[]; policies: Policy[] } = { users: [], roles: [], policies: [] };
  private loaded = false;

  constructor(options: JSONFileAdapterOptions) {
    this.filePath = options.filePath;
  }

  private async load() {
    if (this.loaded) return;
    try {
      const raw = await fs.readFile(this.filePath, 'utf-8');
      this.data = JSON.parse(raw);
    } catch {
      this.data = { users: [], roles: [], policies: [] };
    }
    this.loaded = true;
  }
  private async save() {
    await fs.writeFile(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  async getUser(id: string): Promise<User | undefined> {
    await this.load();
    return this.data.users.find(u => u.id === id);
  }
  async getUsers(ids: string[]): Promise<User[]> {
    await this.load();
    return this.data.users.filter(u => ids.includes(u.id));
  }
  async *getAllUsers(): AsyncIterable<User> {
    await this.load();
    for (const user of this.data.users) yield user;
  }

  async getRole(id: string): Promise<Role | undefined> {
    await this.load();
    return this.data.roles.find(r => r.id === id);
  }
  async getRoles(ids: string[]): Promise<Role[]> {
    await this.load();
    return this.data.roles.filter(r => ids.includes(r.id));
  }
  async *getAllRoles(): AsyncIterable<Role> {
    await this.load();
    for (const role of this.data.roles) yield role;
  }

  async getPolicy(id: string): Promise<Policy | undefined> {
    await this.load();
    return this.data.policies.find(p => p.id === id);
  }
  async getPolicies(ids: string[]): Promise<Policy[]> {
    await this.load();
    return this.data.policies.filter(p => ids.includes(p.id));
  }
  async *getAllPolicies(): AsyncIterable<Policy> {
    await this.load();
    for (const policy of this.data.policies) yield policy;
  }

  async saveUser(user: User): Promise<void> {
    await this.load();
    const idx = this.data.users.findIndex(u => u.id === user.id);
    if (idx >= 0) this.data.users[idx] = user;
    else this.data.users.push(user);
    await this.save();
  }
  async saveRole(role: Role): Promise<void> {
    await this.load();
    const idx = this.data.roles.findIndex(r => r.id === role.id);
    if (idx >= 0) this.data.roles[idx] = role;
    else this.data.roles.push(role);
    await this.save();
  }
  async savePolicy(policy: Policy): Promise<void> {
    await this.load();
    const idx = this.data.policies.findIndex(p => p.id === policy.id);
    if (idx >= 0) this.data.policies[idx] = policy;
    else this.data.policies.push(policy);
    await this.save();
  }

  async deleteUser(id: string): Promise<void> {
    await this.load();
    this.data.users = this.data.users.filter(u => u.id !== id);
    await this.save();
  }
  async deleteRole(id: string): Promise<void> {
    await this.load();
    this.data.roles = this.data.roles.filter(r => r.id !== id);
    await this.save();
  }
  async deletePolicy(id: string): Promise<void> {
    await this.load();
    this.data.policies = this.data.policies.filter(p => p.id !== id);
    await this.save();
  }
}
