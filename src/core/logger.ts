import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import dotenv from "dotenv";

/**
 * Logger interface for pluggable logging
 * @public
 */
export interface ILogger {
  /** Log an informational message */
  info(message: string, ...meta: unknown[]): void;
  /** Log a warning message */
  warn(message: string, ...meta: unknown[]): void;
  /** Log an error message */
  error(message: string, ...meta: unknown[]): void;
  /** Log a debug message */
  debug(message: string, ...meta: unknown[]): void;
}

/**
 * Supported log levels for the IAM logger.
 * - 'debug': All logs
 * - 'info': Info, warn, error
 * - 'warn': Warn, error
 * - 'error': Error only
 * - 'none': No logs
 * @public
 */
export type LogLevel = "debug" | "info" | "warn" | "error" | "none";

/**
 * Default simple logger (console-based, respects log level)
 * @public
 */
export class DefaultLogger implements ILogger {
  constructor(private level: LogLevel = "info") {
    this.info = this.shouldLog("info")
        ? (message: string, ...meta: unknown[]) => console.info("[IAM][INFO]", message, ...meta)
        : () => {/** no-op */};
    this.warn = this.shouldLog("warn")
        ? (message: string, ...meta: unknown[]) => console.warn("[IAM][WARN]", message, ...meta)
        : () => {/** no-op */};
    this.error = this.shouldLog("error")
        ? (message: string, ...meta: unknown[]) => console.error("[IAM][ERROR]", message, ...meta)
        : () => {/** no-op */};
    this.debug = this.shouldLog("debug")
        ? (message: string, ...meta: unknown[]) => console.debug("[IAM][DEBUG]", message, ...meta)
        : () => {/** no-op */};
  }

  private shouldLog(lvl: LogLevel) {
    const order = ["debug", "info", "warn", "error"];
    return (
      this.level !== "none" && order.indexOf(lvl) >= order.indexOf(this.level)
    );
  }

  info(message: string, ...meta: unknown[]) {
  }
  
  warn(message: string, ...meta: unknown[]) {
  }
  
  error(message: string, ...meta: unknown[]) {
  }
  
  debug(message: string, ...meta: unknown[]) {
  }
}

/**
 * IAM configuration object
 * @public
 */
export interface IAMConfig {
  /** Optional custom logger instance */
  logger?: ILogger;
  /** Log level for the default logger */
  logLevel?: LogLevel;
  // Add more config options as needed
}

/**
 * Loads IAM configuration from environment variables or a config file.
 * Supports JSON, YAML, or .env files. Returns a partial IAMConfig.
 *
 * @param options - Optional config loader options
 * @returns Partial<IAMConfig>
 *
 * @example
 * // Loads config from process.env and optionally from iam.config.json
 * const config = loadIAMConfig();
 *
 * // Loads config from a specific file
 * const config = loadIAMConfig({ file: './my-iam-config.yaml' });
 */
export function loadIAMConfig(
  options?: { file?: string } | { env?: Record<string, unknown> }
): Partial<IAMConfig> {
  const config: Partial<IAMConfig> = {};
  if (process.env.IAM_LOG_LEVEL) {
    config.logLevel = process.env.IAM_LOG_LEVEL as LogLevel;
  }

  if (options) {
    if ("env" in options) {
      Object.assign(config, options.env);
    } else if ("file" in options) {
      try {
        const filePath = options.file!;
        if (fs.existsSync(filePath)) {
          const ext = path.extname(filePath).toLowerCase();
          const raw = fs.readFileSync(filePath, "utf-8");
          let parsed: any;
          if (ext === ".json") {
            parsed = JSON.parse(raw);
          } else if (ext === ".yaml" || ext === ".yml") {
            parsed = yaml.load(raw);
          } else if (ext === ".env") {
            parsed = dotenv.parse(raw);
          }
          if (parsed) {
            if (parsed.logLevel) config.logLevel = parsed.logLevel as LogLevel;
            if (parsed.IAM_LOG_LEVEL) config.logLevel = parsed.IAM_LOG_LEVEL as LogLevel;
            Object.assign(config, parsed);
          }
        }
      } catch {
        // Ignore file errors
      }
    }
  }

  return config;
}

//
// Documentation: Using and customizing logging and configuration
//
// By default, the IAM library uses a console-based logger (DefaultLogger) with 'info' level.
// You can provide your own logger by implementing the ILogger interface and passing it via IAMConfig.
//
// Example: Custom logger
// ```
// import { IAM, DefaultLogger, IAMConfig, ILogger } from 'your-iam-lib';
//
// class MyLogger implements ILogger {
//   info(msg: string, ...meta: unknown[]) { /* custom info logic */ }
//   warn(msg: string, ...meta: unknown[]) { /* custom warn logic */ }
//   error(msg: string, ...meta: unknown[]) { /* custom error logic */ }
//   debug(msg: string, ...meta: unknown[]) { /* custom debug logic */ }
// }
//
// const config: IAMConfig = {
//   logger: new MyLogger(),
//   logLevel: 'debug',
// };
// const iam = new IAM({ config });
// ```
//
// Example: Loading config from environment or file
// ```ts
// import { loadIAMConfig, IAM } from 'your-iam-lib';
// const config = loadIAMConfig({ file: './iam.config.json' });
// const iam = new IAM({ config });
// ```
//
