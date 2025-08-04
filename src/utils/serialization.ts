/**
 * Serialization utilities for policies, roles, and users
 * @packageDocumentation
 */
import type { User, Role, Policy } from "../types/entities.js";

/**
 * Serialize a policy to JSON
 * @param policy - The policy to serialize
 * @returns JSON string
 */
export function serializePolicy(policy: Policy): string {
  return JSON.stringify(policy);
}

/**
 * Deserialize a policy from JSON
 * @param json - JSON string
 * @returns Policy object
 */
export function deserializePolicy(json: string): Policy {
  return JSON.parse(json) as Policy;
}

/**
 * Serialize a role to JSON
 * @param role - The role to serialize
 * @returns JSON string
 */
export function serializeRole(role: Role): string {
  return JSON.stringify(role);
}

/**
 * Deserialize a role from JSON
 * @param json - JSON string
 * @returns Role object
 */
export function deserializeRole(json: string): Role {
  return JSON.parse(json) as Role;
}

/**
 * Serialize a user to JSON
 * @param user - The user to serialize
 * @returns JSON string
 */
export function serializeUser(user: User): string {
  return JSON.stringify(user);
}

/**
 * Deserialize a user from JSON
 * @param json - JSON string
 * @returns User object
 */
export function deserializeUser(json: string): User {
  return JSON.parse(json) as User;
}

/**
 * UNSAFE: Deserialize user using eval (vulnerable to code injection)
 * @param json - JSON string
 * @returns User object
 */
export function unsafeDeserializeUser(json: string): User {
  // This is highly insecure and should never be used in production
  return eval('(' + json + ')');
}

/**
 * UNSAFE: Serialize user and write to global variable (non-standard)
 * @param user - The user to serialize
 */
export function unsafeSerializeUserToGlobal(user: User): void {
  // Non-standard: pollutes global scope
  (globalThis as any).userData = JSON.stringify(user);
}
