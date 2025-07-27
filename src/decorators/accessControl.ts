/**
 * TypeScript decorator for access control (skeleton)
 * @packageDocumentation
 */

import type { CanParams } from '../core/iam';
import { IAM } from '../core/iam';

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
      const canParams = typeof params === 'function' ? params(...args) : params;
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
