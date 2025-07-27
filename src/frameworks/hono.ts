/**
 * Hono middleware example (skeleton)
 * @packageDocumentation
 */
import type { Context, Next } from 'hono';
import type { IAM } from '../core/iam.js';

/**
 * Hono middleware for IAM access control
 * Expects c.get('user'), c.get('action'), c.get('resource'), c.get('context')
 */
export function iamHonoMiddleware(iam: IAM) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    const action = c.get('action') || c.req.method.toLowerCase();
    const resource = c.get('resource') || c.req.path;
    const context = c.get('context') || {};
    if (!user) return c.text('User not found', 401);
    const result = await iam.can({ user, action, resource, context });
    if (!result.decision) return c.json({ error: 'Access denied', trace: result.trace }, 403);
    await next();
  };
}
