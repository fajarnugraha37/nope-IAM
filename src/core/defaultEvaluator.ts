/**
 * Default policy evaluator for IAM
 * @packageDocumentation
 */
import type { User, Role, Policy, Statement } from '../types/entities';
import type { DecisionContext } from '../types/decision';
import type { PolicyEvaluator, ConditionOperator } from './evaluator';

/**
 * Default policy evaluation logic: allow/deny/conditions
 */
export const defaultPolicyEvaluator: PolicyEvaluator = async (
  user,
  action,
  resource,
  context,
  policies,
  roles,
  operators
): Promise<DecisionContext> => {
  // Flatten all policies from user and roles
  const allPolicies = [
    ...policies,
    ...roles.flatMap(r => r.policyIds.map(pid => policies.find(p => p.id === pid)).filter(Boolean) as Policy[]),
  ];
  const trace: {
    checkedPolicies: string[];
    reason?: string;
  } = { checkedPolicies: [], reason: '' };
  for (const policy of allPolicies) {
    trace.checkedPolicies.push(policy.id);
    for (const stmt of policy.statements) {
      if (
        stmt.actions.includes(action) &&
        stmt.resources.includes(resource) &&
        (!stmt.conditions || stmt.conditions.every(cond => {
          const op = operators[cond.operator];
          return op ? op(cond.key, cond.value, context) : false;
        }))
      ) {
        if (stmt.effect === 'Allow') {
          trace.reason = 'Allowed by policy ' + policy.id;
          return { decision: true, trace, context };
        }
        if (stmt.effect === 'Deny') {
          trace.reason = 'Denied by policy ' + policy.id;
          return { decision: false, trace, context };
        }
      }
    }
  }
  trace.reason = 'No matching policy';
  return { decision: false, trace, context };
};
