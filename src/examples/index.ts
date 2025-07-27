// Usage:
//   npm run example plain
//   npm run example in-memory
//   npm run example json
//   npm run example express
//   npm run example fastify
//   npm run example hono
//   npm run example nestjs
//   npm run example event
//   npm run example serverless

const arg = process.argv[2];
const map: Record<string, string> = {
  plain: './plain-example.ts',
  'in-memory': './in-memory-example.ts',
  json: './json-adapter-example.ts',
  express: './express-example.ts',
  fastify: './fastify-example.ts',
  hono: './hono-example.ts',
  nestjs: './nestjs-example.ts',
  event: './event-example.ts',
  serverless: './serverless-example.ts',
};

if (!arg || !(arg in map)) {
  console.log('Usage: npm run example <plain|in-memory|json|express|fastify|hono|nestjs|event|serverless>');
  process.exit(1);
}

console.log(`Running example: ${arg} ${map[arg]}`);
import(map[arg]).catch((err) => {
  console.error('Failed to run example:', err);
  process.exit(1);
});
