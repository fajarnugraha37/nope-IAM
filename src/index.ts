/**
 * Main exports for the IAM library
 * @packageDocumentation
 */

export * from "./adapters/inMemoryAdapter.js";
export * from "./adapters/jsonFileAdapter.js";

export * from "./core/defaultEvaluator.js";
export * from "./core/evaluator.js";
export * from "./core/iam.js";
export * from "./core/logger.js";
export * from "./core/storage.js";

export * from "./decorators/accessControl.js";

export * from "./types/decision.js";
export * from "./types/entities.js";

export * from "./utils/roleAssignment.js";
export * from "./utils/serialization.js";
