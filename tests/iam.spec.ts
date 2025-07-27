/**
 * Unit tests for IAM core logic (TDD)
 */
import { IAM } from "../src/core/iam";
import { InMemoryAdapter } from "../src/adapters/inMemoryAdapter";
import { defaultPolicyEvaluator } from "../src/core/defaultEvaluator";
import { User, Role, Policy } from "../src/types/entities";

import { JSONFileAdapter } from "../src/adapters/jsonFileAdapter";
import { assignRole, unassignRole } from "../src/utils/roleAssignment";
import {
  serializeUser,
  deserializeUser,
  serializeRole,
  deserializeRole,
  serializePolicy,
  deserializePolicy,
} from "../src/utils/serialization";
import { promises as fs } from "fs";
import { join } from "path";

describe("IAM core and adapters", () => {
  const user: User = { id: "u1", roleIds: ["r1"], policyIds: [] };
  const role: Role = { id: "r1", name: "admin", policyIds: ["p1"] };
  const policy: Policy = {
    id: "p1",
    name: "AllowRead",
    statements: [{ effect: "Allow", actions: ["read"], resources: ["doc:1"] }],
  };

  describe("InMemoryAdapter", () => {
    const adapter = new InMemoryAdapter({
      users: [user],
      roles: [role],
      policies: [policy],
    });
    const iam = new IAM({
      storage: adapter,
      evaluator: defaultPolicyEvaluator,
    });

    it("should allow access when policy allows", async () => {
      const result = await iam.can({ user, action: "read", resource: "doc:1" });
      expect(result.decision).toBe(true);
      expect(result.trace.checkedPolicies).toContain("p1");
    });

    it("should deny access when no policy matches", async () => {
      const result = await iam.can({
        user,
        action: "write",
        resource: "doc:1",
      });
      expect(result.decision).toBe(false);
      expect(result.trace.reason).toMatch(/No matching policy/);
    });

    it("should support direct user-attached policy", async () => {
      const user2: User = { id: "u2", roleIds: [], policyIds: ["p1"] };
      await adapter.saveUser(user2);
      const result = await iam.can({
        user: user2,
        action: "read",
        resource: "doc:1",
      });
      expect(result.decision).toBe(true);
    });

    it("should support role assignment utilities", () => {
      const u = { ...user, roleIds: [] };
      const withRole = assignRole(u, "r1");
      expect(withRole.roleIds).toContain("r1");
      const withoutRole = unassignRole(withRole, "r1");
      expect(withoutRole.roleIds).not.toContain("r1");
    });
  });

  describe("JSONFileAdapter", () => {
    const tmpPath = join(__dirname, "iam-test.json");
    let adapter: JSONFileAdapter;
    let iam: IAM;

    beforeAll(async () => {
      await fs.writeFile(
        tmpPath,
        JSON.stringify(
          { users: [user], roles: [role], policies: [policy] },
          null,
          2
        )
      );
      adapter = new JSONFileAdapter({ filePath: tmpPath });
      iam = new IAM({ storage: adapter, evaluator: defaultPolicyEvaluator });
    });
    afterAll(async () => {
      await fs.unlink(tmpPath).catch(() => {});
    });

    it("should allow access using JSONFileAdapter", async () => {
      const result = await iam.can({ user, action: "read", resource: "doc:1" });
      expect(result.decision).toBe(true);
    });

    it("should deny access for unknown user", async () => {
      const unknownUser: User = { id: "nouser", roleIds: [], policyIds: [] };
      const result = await iam.can({
        user: unknownUser,
        action: "read",
        resource: "doc:1",
      });
      expect(result.decision).toBe(false);
    });
  });

  describe("Serialization utilities", () => {
    it("should serialize and deserialize user, role, and policy", () => {
      const u = { ...user, attributes: { foo: "bar" } };
      const uJson = serializeUser(u);
      expect(deserializeUser(uJson)).toEqual(u);
      const rJson = serializeRole(role);
      expect(deserializeRole(rJson)).toEqual(role);
      const pJson = serializePolicy(policy);
      expect(deserializePolicy(pJson)).toEqual(policy);
    });
  });

  describe("Edge cases and errors", () => {
    it("should not fail if hooks are not provided", async () => {
      const adapter = new InMemoryAdapter({ users: [user], roles: [role], policies: [policy] });
      const iam = new IAM({ storage: adapter, evaluator: defaultPolicyEvaluator });
      const result = await iam.can({ user, action: "read", resource: "doc:1" });
      expect(result.decision).toBe(true);
    });

    it("should handle missing context gracefully", async () => {
      const adapter = new InMemoryAdapter({ users: [user], roles: [role], policies: [policy] });
      const iam = new IAM({ storage: adapter, evaluator: defaultPolicyEvaluator });
      const result = await iam.can({ user, action: "read", resource: "doc:1" });
      expect(result.decision).toBe(true);
    });

    it("should call onRoleNotFound with null if user has no roles", async () => {
      const userNoRoles: User = { id: "u5", roleIds: [], policyIds: [] };
      const adapter = new InMemoryAdapter({ users: [userNoRoles], roles: [], policies: [] });
      const onRoleNotFound = jest.fn();
      const iam = new IAM({ storage: adapter, evaluator: defaultPolicyEvaluator, hooks: { onRoleNotFound } });
      await iam.can({ user: userNoRoles, action: "read", resource: "doc:1" });
      expect(onRoleNotFound).toHaveBeenCalledWith(null);
    });

    it("should call onRoleNotFound for all missing roles if user has multiple missing roles", async () => {
      const userMultiMissing: User = { id: "u6", roleIds: ["rX", "rY"], policyIds: [] };
      const adapter = new InMemoryAdapter({ users: [userMultiMissing], roles: [], policies: [] });
      const onRoleNotFound = jest.fn();
      const iam = new IAM({ storage: adapter, evaluator: defaultPolicyEvaluator, hooks: { onRoleNotFound } });
      await iam.can({ user: userMultiMissing, action: "read", resource: "doc:1" });
      expect(onRoleNotFound).toHaveBeenCalledWith("rX");
      expect(onRoleNotFound).toHaveBeenCalledWith("rY");
    });

    it("should handle error thrown in onAfterDecision hook gracefully", async () => {
      const adapter = new InMemoryAdapter({ users: [user], roles: [role], policies: [policy] });
      const onAfterDecision = jest.fn(() => { throw new Error("after fail"); });
      const iam = new IAM({ storage: adapter, evaluator: defaultPolicyEvaluator, hooks: { onAfterDecision } });
      const result = await iam.can({ user, action: "read", resource: "doc:1" });
      expect(result.decision).toBe(true);
    });
    it("should call onBeforeDecision and onAfterDecision hooks", async () => {
      const adapter = new InMemoryAdapter({ users: [user], roles: [role], policies: [policy] });
      const calls: string[] = [];
      const onBeforeDecision = jest.fn<any, any>(() => calls.push('before'));
      const onAfterDecision = jest.fn<any, any>(() => calls.push('after'));
      const iam = new IAM({
        storage: adapter,
        evaluator: defaultPolicyEvaluator,
        hooks: { onBeforeDecision, onAfterDecision },
      });
      await iam.can({ user, action: "read", resource: "doc:1" });
      expect(onBeforeDecision).toHaveBeenCalled();
      expect(onAfterDecision).toHaveBeenCalled();
      expect(calls).toEqual(['before', 'after']);
    });

    it("should call onConditionCheck for each operator used", async () => {
      // Use a policy with a condition to trigger the operator and ensure it matches
      const condPolicy: Policy = {
        id: "p2",
        name: "AllowReadIfFoo",
        statements: [
          {
            effect: "Allow",
            actions: ["read"],
            resources: ["doc:1"],
            conditions: [
              { operator: "eq", key: "foo", value: "bar" }
            ],
          },
        ],
      };
      const condUser: User = { id: "u4", roleIds: [], policyIds: ["p2"] };
      const adapter = new InMemoryAdapter({ users: [condUser], roles: [], policies: [condPolicy] });
      const onConditionCheck = jest.fn();
      const iam = new IAM({
        storage: adapter,
        evaluator: defaultPolicyEvaluator,
        hooks: { onConditionCheck: (op, key, value, context, result) => {
            onConditionCheck(op, key, value, context, result);
        } },
      });
      const res = await iam.can({ user: condUser, action: "read", resource: "doc:1", context: { foo: "bar" } });
      expect(onConditionCheck).toHaveBeenCalledWith('eq', 'foo', 'bar', expect.anything(), true);
    });

    it("should call onStorageAccess before and after storage method", async () => {
      const adapter = new InMemoryAdapter({ users: [user], roles: [role], policies: [policy] });
      const onStorageAccess = jest.fn();
      const iam = new IAM({
        storage: adapter,
        evaluator: defaultPolicyEvaluator,
        hooks: { onStorageAccess },
      });
      await iam.can({ user, action: "read", resource: "doc:1" });
      // Should be called for getPolicies and getRoles (before and after)
      expect(onStorageAccess).toHaveBeenCalledWith('getPolicies', expect.any(Array));
      expect(onStorageAccess).toHaveBeenCalledWith('getRoles', expect.any(Array));
      expect(onStorageAccess).toHaveBeenCalledWith('getPolicies', expect.any(Array), expect.anything());
    });

    it("should call onRoleNotFound if a referenced role is missing", async () => {
      // Use a user referencing a missing role, and a policy attached to that role
      const missingRoleUser: User = { id: "u3", roleIds: ["missingRole"], policyIds: [] };
      const missingRolePolicy: Policy = {
        id: "p3",
        name: "AllowReadViaMissingRole",
        statements: [
          { effect: "Allow", actions: ["read"], resources: ["doc:1"] }
        ],
      };
      // The policy is attached to the missing role, but the role itself is not present
      const onRoleNotFound = jest.fn();
      const adapter = new InMemoryAdapter({ users: [missingRoleUser], roles: [], policies: [missingRolePolicy] });
      const iam = new IAM({
        storage: adapter,
        evaluator: defaultPolicyEvaluator,
        hooks: { onRoleNotFound },
      });
      await iam.can({ user: missingRoleUser, action: "read", resource: "doc:1" });
      expect(onRoleNotFound).toHaveBeenCalledWith('missingRole');
    });
    it("should return false if no storage adapter is configured", async () => {
      const iam = new IAM();
      const result = await iam.can({ user, action: "read", resource: "doc:1" });
      expect(result.decision).toBe(false);
      expect(result.trace.reason).toMatch(/No storage adapter/);
    });

    it("should call onDecision hook if provided", async () => {
      const adapter = new InMemoryAdapter({
        users: [user],
        roles: [],
        policies: [],
      });
      const onDecision = jest.fn();
      const iam = new IAM({
        storage: adapter,
        evaluator: defaultPolicyEvaluator,
        hooks: { onDecision },
      });
      await iam.can({ user, action: "read", resource: "doc:1" });
      expect(onDecision).toHaveBeenCalled();
    });

    it("should call onError hook if provided", async () => {
      const onError = jest.fn();
      const iam = new IAM({ hooks: { onError } });
      await iam.can({ user, action: "read", resource: "doc:1" });
      expect(onError).toHaveBeenCalled();
    });

    it("should handle error thrown in onDecision hook", async () => {
      const adapter = new InMemoryAdapter({
        users: [user],
        roles: [],
        policies: [],
      });
      const onDecision = jest.fn().mockImplementation(() => {
        throw new Error("hook fail");
      });
      const iam = new IAM({
        storage: adapter,
        evaluator: defaultPolicyEvaluator,
        hooks: { onDecision },
      });
      const result = await iam.can({ user, action: "read", resource: "doc:1" });
      expect(result.decision).toBe(false);
      expect(result.trace.reason).toMatch(/hook fail/);
    });

    it("should handle error thrown in onError hook gracefully", async () => {
      const iam = new IAM({
        hooks: {
          onError: (err) => {
            expect(err).toBeInstanceOf(Error);
            if (err instanceof Error) {
              expect(err.message).toMatch(/No storage adapter/);
            } else {
                throw new Error("Unexpected error type");
            }
          },
        },
      });
      const result = await iam.can({ user, action: "read", resource: "doc:1" });
      expect(result.decision).toBe(false);
      expect(result.trace.reason).toMatch(/No storage adapter/);
    });
  });
});
