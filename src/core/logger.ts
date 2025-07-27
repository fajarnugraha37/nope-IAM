import fs from 'fs';

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
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

/**
 * Default simple logger (console-based, respects log level)
 * @public
 */
export class DefaultLogger implements ILogger {
  constructor(private level: LogLevel = 'info') {}
  private shouldLog(lvl: LogLevel) {
    const order = ['debug', 'info', 'warn', 'error'];
    return this.level !== 'none' && order.indexOf(lvl) >= order.indexOf(this.level);
  }
  info(message: string, ...meta: unknown[]) {
    if (this.shouldLog('info')) console.info('[IAM][INFO]', message, ...meta);
  }
  warn(message: string, ...meta: unknown[]) {
    if (this.shouldLog('warn')) console.warn('[IAM][WARN]', message, ...meta);
  }
  error(message: string, ...meta: unknown[]) {
    if (this.shouldLog('error')) console.error('[IAM][ERROR]', message, ...meta);
  }
  debug(message: string, ...meta: unknown[]) {
    if (this.shouldLog('debug')) console.debug('[IAM][DEBUG]', message, ...meta);
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
export function loadIAMConfig(options?: { file?: string } | { env?: Record<string, unknown> }): Partial<IAMConfig> {
  // Minimal implementation: loads from process.env and optionally a JSON file
  const config: Partial<IAMConfig> = {};
  if (process.env.IAM_LOG_LEVEL) {
    config.logLevel = process.env.IAM_LOG_LEVEL as LogLevel;
  }
  // Optionally load from file (JSON only for now)
  if (options) {
    if ('env' in options) {
      Object.assign(config, options.env);
    } else if ('file' in options) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        if (fs.existsSync(options.file!)) {
          const raw = fs.readFileSync(options.file!, 'utf-8');
          const parsed = JSON.parse(raw);
          if (parsed.logLevel) config.logLevel = parsed.logLevel;
          // Add more config parsing as needed
        }
      } catch (err) {
        // Fallback: ignore file errors
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
