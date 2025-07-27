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
