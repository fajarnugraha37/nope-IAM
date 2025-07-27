import type { CanParams } from '../core/iam';
import { IAM } from '../core/iam';

/**
 * Method decorator to log access attempts, decisions, and context for auditing.
 * Logs to iam.config.logger if available, otherwise console.
 * @param opts - Optional: logLevel (default 'info'), custom message, or function to format log
 */
export function LogAccess(opts?: {
  logLevel?: 'info' | 'warn',
  message?: string | ((ctx: any) => string)
}): MethodDecorator {
  return (target, propertyKey, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;
    descriptor.value = async function (this: any, ...args: any[]) {
      // Prefer this.logger, then this.iam.logger, then console
      const logger = this?.logger || this?.iam?.logger || console;
      let result: any = undefined;
      let error: any = undefined;
      try {
        result = await original.apply(this, args);
        if (logger) {
          const ctx = {
            user: this.user,
            args,
            result,
            method: typeof propertyKey === 'symbol' ? propertyKey.toString() : String(propertyKey),
            class: target.constructor?.name,
          };
          let msg = opts?.message;
          if (typeof msg === 'function') msg = msg(ctx);
          if (!msg) msg = `Access attempt: user=${ctx.user?.id}, method=${ctx.method}, result=${JSON.stringify(result)}`;
          if (typeof logger[opts?.logLevel || 'info'] === 'function') {
            logger[opts?.logLevel || 'info'](msg, ctx);
          } else {
            console.log(msg, ctx);
          }
        }
        return result;
      } catch (err) {
        error = err;
        if (logger) {
          const ctx = {
            user: this.user,
            args,
            error,
            method: typeof propertyKey === 'symbol' ? propertyKey.toString() : String(propertyKey),
            class: target.constructor?.name,
          };
          let msg = opts?.message;
          if (typeof msg === 'function') msg = msg(ctx);
          if (!msg) msg = `Access denied: user=${ctx.user?.id}, method=${ctx.method}, error=${error?.message}`;
          if (typeof logger[opts?.logLevel || 'warn'] === 'function') {
            logger[opts?.logLevel || 'warn'](msg, ctx);
          } else {
            console.warn(msg, ctx);
          }
        }
        throw err;
      }
    };
    return descriptor;
  };
}


/**
 * Method decorator to allow if user can perform any of the listed actions on any of the listed resources.
 * @param actions - Array of actions
 * @param resources - Resource string or array of resource strings
 */
export function AllowActions(actions: string[], resources: string | string[]): MethodDecorator {
  return (target, propertyKey, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;
    descriptor.value = async function (this: any, ...args: any[]) {
      const iam: IAM = this?.iam || (global as any).iam;
      if (!iam) throw new Error('IAM instance not found');
      const resourceList = Array.isArray(resources) ? resources : [resources];
      for (const action of actions) {
        for (const resource of resourceList) {
          const result = await iam.can({ user: this.user, action, resource });
          if (result.decision) {
            return original.apply(this, args);
          }
        }
      }
      throw new Error('Access denied: none of the actions/resources allowed');
    };
    return descriptor;
  };
}

/**
 * Method decorator to deny if user can perform any of the listed actions on any of the listed resources (explicit deny logic).
 * @param actions - Array of actions
 * @param resources - Resource string or array of resource strings
 */
export function DenyActions(actions: string[], resources: string | string[]): MethodDecorator {
  return (target, propertyKey, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;
    descriptor.value = async function (this: any, ...args: any[]) {
      const iam: IAM = this?.iam || (global as any).iam;
      if (!iam) throw new Error('IAM instance not found');
      const resourceList = Array.isArray(resources) ? resources : [resources];
      for (const action of actions) {
        for (const resource of resourceList) {
          const result = await iam.can({ user: this.user, action, resource });
          if (result.decision) throw new Error('Access denied: explicitly denied action');
        }
      }
      return original.apply(this, args);
    };
    return descriptor;
  };
}

/**
 * Method decorator to allow access only if a custom condition function returns true.
 * @param condition - Function (user, ...args) => boolean
 */
export function AccessCondition(condition: (user: any, ...args: any[]) => boolean): MethodDecorator {
  return (target, propertyKey, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;
    descriptor.value = function (this: any, ...args: any[]) {
      if (!condition(this.user, ...args)) 
        throw new Error('Access denied: condition failed');
      return original.apply(this, args);
    };
    return descriptor;
  };
}

/**
 * Method decorator for access control using IAM.can
 * @param params - Partial CanParams (action/resource may be dynamic)
 */
export function AccessControl(params: Partial<CanParams> | ((...args: any[]) => Partial<CanParams>)): MethodDecorator {
  return (target, propertyKey, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;
    if (typeof original !== 'function') {
      throw new Error('AccessControl can only be applied to methods');
    }
    descriptor.value = function (this: any, ...args: any[]) {
      const iam: IAM = this?.iam || (global as any).iam;
      if (!iam) throw new Error('IAM instance not found');
      const canParams = typeof params === 'function' ? params.bind(this)(...args) : params;
      const { action = '', resource = '', context = {} } = canParams;
      return Promise.resolve(iam.can({
        user: this.user,
        action: String(action),
        resource: String(resource),
        context
      })).then((result) => {
        if (!result.decision) throw new Error('Access denied');
        return original.apply(this, args);
      });
    };
    return descriptor;
  };
}
