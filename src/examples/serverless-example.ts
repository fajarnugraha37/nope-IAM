/**
 * Example: Serverless handler integration with IAM
 */
import { IAM, serverlessHandler, InMemoryAdapter } from '..';

const adapter = new InMemoryAdapter();
const iam = new IAM();

export async function handler(event: unknown, context: unknown) {
  await serverlessHandler(iam, event, context);
}
