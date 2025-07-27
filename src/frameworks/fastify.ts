/**
 * Fastify plugin example (skeleton)
 * @packageDocumentation
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import type { IAM } from '../core/iam';

/**
 * Fastify onRequest hook for IAM access control
 * Expects request.user, request.action, request.resource, request.context
 */
export function iamFastifyHook(iam: IAM) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    const action = (request as any).action || request.method.toLowerCase();
    const resource = (request as any).resource || request.url;
    const context = (request as any).context || {};
    if (!user) return reply.status(401).send({ error: 'User not found' });
    const result = await iam.can({ user, action, resource, context });
    if (!result.decision) return reply.status(403).send({ error: 'Access denied', trace: result.trace });
  };
}
