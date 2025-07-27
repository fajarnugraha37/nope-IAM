/**
 * Main exports for the IAM library
 * @packageDocumentation
 */

export * from './core/iam';
export * from './types/entities';
export * from './types/decision';
export * from './adapters/inMemoryAdapter';
export * from './adapters/jsonFileAdapter';
export * from './decorators/accessControl';
export * from './utils/roleAssignment';
export * from './utils/serialization';
export * from './core/evaluator';

export * from './frameworks/express';
export * from './frameworks/hono';
export * from './frameworks/fastify';
export * from './frameworks/nestjs';
export * from './frameworks/eventDriven';
export * from './frameworks/serverless';
