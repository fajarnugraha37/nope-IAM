/**
 * Main exports for the IAM library
 * @packageDocumentation
 */

export * from './adapters/inMemoryAdapter';
export * from './adapters/jsonFileAdapter';

export * from './core/defaultEvaluator';
export * from './core/evaluator';
export * from './core/iam';
export * from './core/logger';
export * from './core/storage';

export * from './decorators/accessControl';

export * from './frameworks/eventDriven';
export * from './frameworks/express';
export * from './frameworks/fastify';
export * from './frameworks/hono';
export * from './frameworks/nestjs';
export * from './frameworks/serverless';

export * from './types/decision';
export * from './types/entities';

export * from './utils/roleAssignment';
export * from './utils/serialization';
