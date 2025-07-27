/**
 * NestJS guard example (skeleton)
 * @packageDocumentation
 */

import { type  CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import type { IAM } from '../core/iam';

@Injectable()
export class IamGuard implements CanActivate {
  constructor(private readonly iam: IAM) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    const action = req.action || req.method.toLowerCase();
    const resource = req.resource || req.path;
    const ctx = req.context || {};
    if (!user) return false;
    const result = await this.iam.can({ user, action, resource, context: ctx });
    return !!result.decision;
  }
}
