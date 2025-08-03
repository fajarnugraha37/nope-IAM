/**
 * Default policy evaluator for IAM
 * @packageDocumentation
 */
import type { Policy } from "../types/entities.js";
import type { DecisionContext } from "../types/decision.js";
import type { PolicyEvaluator } from "./evaluator.js";
import type { ILogger } from "../core/logger.js";

/**
 * Default policy evaluation logic: allow/deny/conditions
 * Logger is provided by IAM and passed as an option.
 * @public
 * @param options - { logger } instance from IAM
 * @returns PolicyEvaluator
 */
export function defaultPolicyEvaluator(_logger: ILogger): PolicyEvaluator {
  const logger: ILogger = _logger;
  return async (
    user,
    action,
    resource,
    context,
    policies,
    roles,
    operators
  ): Promise<DecisionContext> => {
    logger.debug("defaultPolicyEvaluator: evaluating", {
      user,
      action,
      resource,
      context,
    });
    // Flatten policies and remove duplicates to avoid evaluating the same policy twice
    // (e.g. a policy attached directly to the user and through a role)
    const allPolicies = [
      ...new Map(policies.map((p) => [p.id, p])).values(),
    ];
    const trace: {
      checkedPolicies: string[];
      reason?: string;
    } = { checkedPolicies: [], reason: "" };
    for (const policy of allPolicies) {
      trace.checkedPolicies.push(policy.id);
      for (const stmt of policy.statements) {
        if (
          stmt.actions.includes(action) &&
          stmt.resources.includes(resource) &&
          (!stmt.conditions ||
            stmt.conditions.every((cond) => {
              const op = operators[cond.operator];
              const result = op ? op(cond.key, cond.value, context) : false;
              logger.debug("Condition check", { cond, result });
              return result;
            }))
        ) {
          if (stmt.effect === "Allow") {
            trace.reason = "Allowed by policy " + policy.id;
            logger.info("Access allowed", {
              policyId: policy.id,
              statement: stmt,
            });
            return { decision: true, trace, context };
          }
          if (stmt.effect === "Deny") {
            trace.reason = "Denied by policy " + policy.id;
            logger.warn("Access denied", {
              policyId: policy.id,
              statement: stmt,
            });
            return { decision: false, trace, context };
          }
        }
      }
    }
    trace.reason = "No matching policy";
    logger.warn("No matching policy found", { user, action, resource });
    return { decision: false, trace, context };
  };
}
