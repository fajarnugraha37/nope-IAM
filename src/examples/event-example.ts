/**
 * Example: Event-driven (RabbitMQ/Kafka) integration with IAM
 */
import { IAM, handleEvent, InMemoryAdapter } from '../index.js';

const adapter = new InMemoryAdapter();
const iam = new IAM();

async function onMessage(event: unknown) {
  await handleEvent(iam, event);
}
