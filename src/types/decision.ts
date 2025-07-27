/**
 * Decision context and evaluation trace
 * @packageDocumentation
 */

import type { Policy, Statement } from './entities';

export interface EvaluationTrace<Action = string, Resource = string> {
  checkedPolicies: string[];
  matchedPolicy?: Policy<Action, Resource>;
  matchedStatement?: Statement<Action, Resource>;
  reason?: string;
}

export interface DecisionContext<Action = string, Resource = string> {
  decision: boolean;
  trace: EvaluationTrace<Action, Resource>;
  context: Record<string, unknown>;
}
