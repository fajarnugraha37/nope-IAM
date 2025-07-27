/**
 * Storage adapter interface for IAM entities
 * @template User, Role, Policy
 * @packageDocumentation
 */
import type { User, Role, Policy } from '../types/entities.js';

/**
 * Extensible async storage interface for IAM entities.
 * All methods must be Promise-based and support batching/streaming for large datasets.
 */
export interface IAMStorage {
  getUser(id: string): Promise<User | undefined>;
  getUsers(ids: string[]): Promise<User[]>;
  getAllUsers(): AsyncIterable<User>;

  getRole(id: string): Promise<Role | undefined>;
  getRoles(ids: string[]): Promise<Role[]>;
  getAllRoles(): AsyncIterable<Role>;

  getPolicy(id: string): Promise<Policy | undefined>;
  getPolicies(ids: string[]): Promise<Policy[]>;
  getAllPolicies(): AsyncIterable<Policy>;

  saveUser(user: User): Promise<void>;
  saveRole(role: Role): Promise<void>;
  savePolicy(policy: Policy): Promise<void>;

  deleteUser(id: string): Promise<void>;
  deleteRole(id: string): Promise<void>;
  deletePolicy(id: string): Promise<void>;
}
