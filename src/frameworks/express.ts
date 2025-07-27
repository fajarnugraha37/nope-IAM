/**
 * Express middleware example (skeleton)
 * @packageDocumentation
 */

import type { Request, Response, NextFunction } from 'express';
import type { IAM } from '../core/iam';

/**
 * Express middleware for IAM access control
 * Expects req.user, req.action, req.resource, req.context to be set by previous middleware
 */
export function iamExpressMiddleware(iam: IAM) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const action = (req as any).action || req.method.toLowerCase();
      const resource = (req as any).resource || req.path;
      const context = (req as any).context || {};
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      const result = await iam.can({ user, action, resource, context });
      if (!result.decision) {
        return res.status(403).json({ error: 'Access denied', trace: result.trace });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
