/**
 * TypeScript decorator for access control (skeleton)
 * @packageDocumentation
 */

import type { CanParams } from '../core/iam';
import { IAM } from '../core/iam';

/**
 * Method decorator to allow if user can perform any of the listed actions on the resource.
 * @param actions - Array of actions
 * @param resource - Resource string
 */
export function AllowActions(actions: string[], resource: string): MethodDecorator {
  return AccessControl((...args: any[]) => ({ action: actions[0], resource })); // Only checks first action for now
}

/**
 * Method decorator to deny if user can perform any of the listed actions (explicit deny logic).
 * @param actions - Array of actions
 * @param resource - Resource string
 */
export function DenyActions(actions: string[], resource: string): MethodDecorator {
  return (target, propertyKey, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;
    descriptor.value = async function (this: any, ...args: any[]) {
      const iam: IAM = this?.iam || (global as any).iam;
      if (!iam) throw new Error('IAM instance not found');
      for (const action of actions) {
        const result = await iam.can({ user: this.user, action, resource });
        if (result.decision) throw new Error('Access denied: explicitly denied action');
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
