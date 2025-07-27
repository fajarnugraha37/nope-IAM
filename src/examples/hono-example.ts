/**
 * Example: Hono integration with IAM
 */
import { Hono } from 'hono';
import { IAM, iamHonoMiddleware, InMemoryAdapter } from '../index.js';

const app = new Hono();
const adapter = new InMemoryAdapter();
const iam = new IAM();

app.use(iamHonoMiddleware(iam));

app.get('/resource', (c) => c.text('Resource accessed'));

export default app;
