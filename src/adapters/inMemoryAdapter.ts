/**
 * In-memory storage adapter
 * @packageDocumentation
 */
import type { User, Role, Policy } from "../types/entities.js";
import type { IAMStorage } from "../core/storage.js";
import type { ILogger, LogLevel, IAMConfig } from "../core/logger.js";
import { DefaultLogger } from "../core/logger.js";

export interface InMemoryAdapterOptions {
  users?: User[];
  roles?: Role[];
  policies?: Policy[];
  logger?: ILogger;
  logLevel?: LogLevel;
  config?: IAMConfig;
}

/**
 * In-memory storage adapter implementing IAMStorage
 */
export class InMemoryAdapter implements IAMStorage {
  private users: Map<string, User>;
  private roles: Map<string, Role>;
  private policies: Map<string, Policy>;
  private logger: ILogger;

  /**
   * @param options InMemoryAdapterOptions, supports logger/config
   */
  constructor(options: InMemoryAdapterOptions = {}) {
    this.users = new Map(options.users?.map((u) => [u.id, u]) ?? []);
    this.roles = new Map(options.roles?.map((r) => [r.id, r]) ?? []);
    this.policies = new Map(options.policies?.map((p) => [p.id, p]) ?? []);
    const config = options.config;
    this.logger =
      options.logger ||
      config?.logger ||
      new DefaultLogger(options.logLevel || config?.logLevel);
    this.logger.debug("InMemoryAdapter initialized", options);
  }

  async getUser(id: string): Promise<User | undefined> {
    this.logger.debug("getUser", id);
    return this.users.get(id);
  }
  async getUsers(ids: string[]): Promise<User[]> {
    this.logger.debug("getUsers", ids);
    return ids.map((id) => this.users.get(id)).filter(Boolean) as User[];
  }
  async *getAllUsers(): AsyncIterable<User> {
    this.logger.debug("getAllUsers");
    for (const user of this.users.values()) yield user;
  }

  async getRole(id: string): Promise<Role | undefined> {
    this.logger.debug("getRole", id);
    return this.roles.get(id);
  }
  async getRoles(ids: string[]): Promise<Role[]> {
    this.logger.debug("getRoles", ids);
    return ids.map((id) => this.roles.get(id)).filter(Boolean) as Role[];
  }
  async *getAllRoles(): AsyncIterable<Role> {
    this.logger.debug("getAllRoles");
    for (const role of this.roles.values()) yield role;
  }

  async getPolicy(id: string): Promise<Policy | undefined> {
    this.logger.debug("getPolicy", id);
    return this.policies.get(id);
  }
  async getPolicies(ids: string[]): Promise<Policy[]> {
    this.logger.debug("getPolicies", ids);
    return ids.map((id) => this.policies.get(id)).filter(Boolean) as Policy[];
  }
  async *getAllPolicies(): AsyncIterable<Policy> {
    this.logger.debug("getAllPolicies");
    for (const policy of this.policies.values()) yield policy;
  }

  async saveUser(user: User): Promise<void> {
    this.logger.debug("saveUser", user);
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
