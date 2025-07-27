/**
 * Example: Express integration with IAM
 */
import express from 'express';
import { IAM, iamExpressMiddleware, InMemoryAdapter } from '../index.js';

const app = express();
const adapter = new InMemoryAdapter();
const iam = new IAM();

app.use(iamExpressMiddleware(iam));

app.get('/resource', (req, res) => {
  res.send('Resource accessed');
});

app.listen(3000);
