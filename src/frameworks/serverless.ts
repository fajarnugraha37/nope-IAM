/**
 * Serverless handler integration example (skeleton)
 * @packageDocumentation
 */
import type { IAM } from '../core/iam.js';

/**
 * Serverless handler for IAM access control
 * Expects event to have user, action, resource, context fields
 */
export async function serverlessHandler(iam: IAM, event: any, lambdaContext: any) {
  const { user, action, resource, context } = event;
  if (!user) throw new Error('User not found');
  const result = await iam.can({ user, action, resource, context });
  if (!result.decision) throw new Error('Access denied');
  // Continue serverless logic...
}
