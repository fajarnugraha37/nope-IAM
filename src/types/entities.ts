/**
 * Core IAM entities and types
 * @packageDocumentation
 */

export type Effect = 'Allow' | 'Deny';

export interface Condition {
  operator: string;
  key: string;
  value: unknown;
}

export interface Statement<Action = string, Resource = string> {
  sid?: string;
  effect: Effect;
  actions: Action[];
  resources: Resource[];
  conditions?: Condition[];
}

export interface Policy<Action = string, Resource = string> {
  id: string;
  name: string;
  statements: Statement<Action, Resource>[];
  description?: string;
}

export interface Role {
  id: string;
  name: string;
  policyIds: string[];
  description?: string;
}

export interface User {
  id: string;
  roleIds: string[];
  policyIds: string[];
  attributes?: Record<string, unknown>;
}
