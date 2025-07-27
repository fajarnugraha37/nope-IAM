/**
 * Event-driven (RabbitMQ/Kafka) integration example (skeleton)
 * @packageDocumentation
 */
import type { IAM } from '../core/iam.js';

/**
 * Event-driven handler for IAM access control
 * Expects event to have user, action, resource, context fields
 */
export async function handleEvent(iam: IAM, event: any) {
  const { user, action, resource, context } = event;
  if (!user) throw new Error('User not found');
  const result = await iam.can({ user, action, resource, context });
  if (!result.decision) throw new Error('Access denied');
  // Continue event processing...
}
