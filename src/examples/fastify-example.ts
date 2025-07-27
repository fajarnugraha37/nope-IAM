/**
 * Example: Fastify integration with IAM
 */
import Fastify from 'fastify';
import { IAM, iamFastifyHook, InMemoryAdapter } from '..';

const fastify = Fastify();
const adapter = new InMemoryAdapter();
const iam = new IAM();

fastify.addHook('onRequest', iamFastifyHook(iam));

fastify.get('/resource', async (request, reply) => {
  return 'Resource accessed';
});

fastify.listen({ port: 3000 });
