/**
 * Core IAM engine and API
 * @packageDocumentation
 */


import type { User, Role, Policy } from '../types/entities';
import type { DecisionContext } from '../types/decision';
import type { IAMStorage } from './storage';
import type { PolicyEvaluator } from './evaluator';

export interface CanParams<Action = string, Resource = string, Context = Record<string, unknown>> {
  user: User;
  action: Action;
  resource: Resource;
  context?: Context;
}


/**
 * Options for IAM engine
 */
export interface IAMOptions {
  storage?: IAMStorage;
  evaluator?: PolicyEvaluator;
  hooks?: {
    onDecision?: <Action, Resource>(ctx: DecisionContext<Action, Resource>) => void | Promise<void>;
    onError?: (err: unknown) => void | Promise<void>;
    // Add more hooks as needed
  };
}

/**
 * IAM engine for policy-based access control.
 *
 * @remarks
 * Extensible, type-safe, and pluggable IAM engine inspired by AWS IAM.
 * Supports custom storage, evaluators, and hooks.
 */
export class IAM {
  /** Storage adapter for IAM entities */
  private storage?: IAMStorage;
  /** Custom policy evaluator */
  private evaluator?: PolicyEvaluator;
  /** Optional hooks for logging, auditing, etc. */
  private hooks?: IAMOptions['hooks'];

  /**
   * Create a new IAM engine instance.
   * @param options - IAM engine options
   */
  /**
   * Create a new IAM engine instance.
   * @param options - IAM engine options
   */
  constructor(options?: IAMOptions) {
    this.storage = options?.storage;
    this.evaluator = options?.evaluator;
    this.hooks = options?.hooks;
  }

  /**
   * Main API: evaluates if a user can perform an action on a resource.
   * @param params - Evaluation parameters
   * @returns DecisionContext
   */
  /**
   * Evaluate if a user can perform an action on a resource.
   *
   * @typeParam Action - Action type
   * @typeParam Resource - Resource type
   * @typeParam Context - Context type
   * @param params - Evaluation parameters
   * @returns DecisionContext with evaluation trace
   */
  async can<Context = Record<string, unknown>>(
    params: CanParams<string, string, Context>
  ): Promise<DecisionContext<string, string>> {
    try {
      if (!this.storage) throw new Error('No storage adapter configured');
      const user = params.user;
      // Fetch user-attached policies and roles
      const [userPolicies, userRoles] = await Promise.all([
        this.storage.getPolicies(user.policyIds),
        this.storage.getRoles(user.roleIds),
      ]);
      // Collect all policies from user and roles
      const rolePolicyIds = userRoles.flatMap(r => r.policyIds);
      const rolePolicies = await this.storage.getPolicies(rolePolicyIds);
      const allPolicies = [...userPolicies, ...rolePolicies];
      // Use custom or default evaluator
      const evaluator = this.evaluator ?? (await import('./defaultEvaluator')).defaultPolicyEvaluator;
      const operators = (await import('./evaluator')).defaultConditionOperators;
      const result = await evaluator(
        user,
        params.action,
        params.resource,
        params.context ?? {},
        allPolicies,
        userRoles,
        operators
      );
      if (this.hooks?.onDecision) await this.hooks.onDecision(result);
      return result;
    } catch (err) {
      if (this.hooks?.onError) await this.hooks.onError(err);
      return {
        decision: false,
        trace: { checkedPolicies: [], reason: (err as Error).message },
        context: params.context || {},
      };
    }
  }
}
