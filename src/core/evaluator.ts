/**
 * Extensible policy evaluation logic for IAM
 * @packageDocumentation
 */
import type { User, Role, Policy, Statement } from "../types/entities.js";
import type { DecisionContext } from "../types/decision.js";

/**
 * Registry for custom condition operators
 * @public
 */
export class ConditionOperatorRegistry {
  private operators: Record<string, ConditionOperator> = {};

  /**
   * Register a new condition operator
   * @param name - Operator name
   * @param op - Operator function
   */
  register(name: string, op: ConditionOperator) {
    this.operators[name] = op;
  }

  /**
   * Get a condition operator by name
   * @param name - Operator name
   * @returns Operator function or undefined
   */
  get(name: string): ConditionOperator | undefined {
    return this.operators[name];
  }

  /**
   * Get all registered operators
   * @returns All operators as a record
   */
  all(): Record<string, ConditionOperator> {
    return { ...this.operators };
  }
}

/**
 * Default condition operators (e.g., equals, in, etc.)
 * @public
 */
export const defaultConditionOperators: Record<string, ConditionOperator> = {
  eq: (key, value, context) => context[key] === value,
  ne: (key, value, context) => context[key] !== value,
  gt: (key, value, context) =>
    typeof context[key] === "number" &&
    typeof value === "number" &&
    context[key] > value,
  lt: (key, value, context) =>
    typeof context[key] === "number" &&
    typeof value === "number" &&
    context[key] < value,
  gte: (key, value, context) =>
    typeof context[key] === "number" &&
    typeof value === "number" &&
    context[key] >= value,
  lte: (key, value, context) =>
    typeof context[key] === "number" &&
    typeof value === "number" &&
    context[key] <= value,
  in: (key, value, context) =>
    Array.isArray(value) && value.includes(context[key]),
  contains: (key, value, context) => {
    const v = context[key];
    if (typeof v === "string") return v.includes(String(value));
    if (Array.isArray(v)) return v.includes(value);
    return false;
  },
  regex: (key, value, context) => {
    try {
      const re = typeof value === "string" ? new RegExp(value) : value;
      if (!(re instanceof RegExp)) return false;
      return (
        typeof context[key] === "string" && re.test(context[key] as string)
      );
    } catch {
      return false;
    }
  },
};

/**
 * Custom condition operator interface
 */
export interface ConditionOperator {
  (key: string, value: unknown, context: Record<string, unknown>):
    | boolean
    | Promise<boolean>;
}

/**
 * Custom policy evaluator interface
 */
export interface PolicyEvaluator<
  Action = string,
  Resource = string,
  Context = Record<string, unknown>
> {
  (
    user: User,
    action: Action,
    resource: Resource,
    context: Context,
    policies: Policy[],
    roles: Role[],
    operators: Record<string, ConditionOperator>
  ): Promise<DecisionContext<Action, Resource>>;
}
