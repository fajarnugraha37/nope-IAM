/**
 * Utilities for assigning/unassigning roles to users
 * @packageDocumentation
 */
import type { User } from '../types/entities.js';

export function assignRole(user: User, roleId: string): User {
  return { ...user, roleIds: [...user.roleIds, roleId] };
}

export function unassignRole(user: User, roleId: string): User {
  return { ...user, roleIds: user.roleIds.filter(rid => rid !== roleId) };
}
