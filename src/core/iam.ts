/**
 * Core IAM engine and API
 * @packageDocumentation
 */

import type { User, Role, Policy } from "../types/entities";
import type { DecisionContext } from "../types/decision";
import type { IAMStorage } from "./storage";
import type { PolicyEvaluator } from "./evaluator";

export interface CanParams<
  Action = string,
  Resource = string,
  Context = Record<string, unknown>
> {
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
    /** Called before evaluation starts */
    onBeforeDecision?: <Action, Resource>(
      params: CanParams<Action, Resource, any>
    ) => void | Promise<void>;
    /** Called after evaluation completes (success or error) */
    onAfterDecision?: <Action, Resource>(
      ctx: DecisionContext<Action, Resource> | undefined,
      err: unknown | undefined
    ) => void | Promise<void>;
    /** Called when a condition operator is checked */
    onConditionCheck?: (
      operator: string,
      key: string,
      value: unknown,
      context: Record<string, unknown>,
      result: boolean
    ) => void | Promise<void>;
    /** Called before/after storage access */
    onStorageAccess?: (
      method: string,
      args: unknown[],
      result?: unknown
    ) => void | Promise<void>;
    /** Called if a referenced role is not found */
    onRoleNotFound?: (roleId: string | null) => void | Promise<void>;
    onDecision?: <Action, Resource>(
      ctx: DecisionContext<Action, Resource>
    ) => void | Promise<void>;
    onError?: (err: unknown) => void | Promise<void>;
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
  private hooks?: IAMOptions["hooks"];

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
    let result: DecisionContext<string, string> | undefined = undefined;
    let error: unknown = undefined;
    try {
      if (this.hooks?.onBeforeDecision)
        await this.hooks.onBeforeDecision(params);
      if (!this.storage) throw new Error("No storage adapter configured");
      const user = params.user;
      // Storage access with hook
      const callStorage = async (method: keyof IAMStorage, ...args: any[]) => {
        if (this.hooks?.onStorageAccess)
          await this.hooks.onStorageAccess(method as string, args);
        const res = await (this.storage as any)[method](...args);
        if (this.hooks?.onStorageAccess)
          await this.hooks.onStorageAccess(method as string, args, res);
        return res;
      };
      // Fetch user-attached policies and roles
      const [userPolicies, userRoles] = await Promise.all([
        callStorage("getPolicies", user.policyIds),
        callStorage("getRoles", user.roleIds),
      ]);
      // User/role not found hooks
      // explain userRoles.some((r: Role | undefined) => !r)
      // If any role is not found, call the onRoleNotFound hook
      if (this.hooks?.onRoleNotFound) {
        if (params.user.roleIds.length === 0) {
          await this.hooks.onRoleNotFound(null);
        } else if (userRoles == undefined || userRoles.length === 0) {
            // If no roles found, we can still evaluate policies directly attached to the user
            for(const rid of user.roleIds) {
                await this.hooks.onRoleNotFound(rid);
            }
        } else if (userRoles.some((r: Role | undefined) => !r)) {
            for (const rid of user.roleIds) {
            if (
                !userRoles.find((r: Role | undefined) => r && r.id === rid))
                await this.hooks.onRoleNotFound(rid);
            }
        }
      }
      // Collect all policies from user and roles
      const rolePolicyIds = userRoles.flatMap((r: Role) => r.policyIds);
      const rolePolicies = await callStorage("getPolicies", rolePolicyIds);
      const allPolicies = [...userPolicies, ...rolePolicies];
      // Use custom or default evaluator
      const evaluator =
        this.evaluator ??
        (await import("./defaultEvaluator")).defaultPolicyEvaluator;
      // Patch operators to call onConditionCheck
      const operatorsRaw = (await import("./evaluator"))
        .defaultConditionOperators;
      const operators: typeof operatorsRaw = { ...operatorsRaw };
      if (this.hooks?.onConditionCheck) {
        for (const [name, op] of Object.entries(operatorsRaw)) {
          operators[name] = async (key, value, ctx) => {
            const res = await op(key, value, ctx);
            if (this.hooks && this.hooks.onConditionCheck) {
                await this.hooks.onConditionCheck(name, key, value, ctx, res);
            }
            return res;
          };
        }
      }
      result = await evaluator(
        user,
        params.action,
        params.resource,
        params.context ?? {},
        allPolicies,
        userRoles,
        operators
      );
      if (this.hooks?.onDecision) {
        await this.hooks.onDecision(result)
      }
      return result;
    } catch (err) {
      error = err;
      if (this.hooks?.onError) await this.hooks.onError(err);
      return {
        decision: false,
        trace: { checkedPolicies: [], reason: (err as Error).message },
        context: params.context || {},
      };
    } finally {
      if (this.hooks?.onAfterDecision) {
        try {
          await this.hooks.onAfterDecision(result, error);
        } catch (err) {
          console.error("Error in onAfterDecision hook:", err);
        }
      }
    }
  }
}
