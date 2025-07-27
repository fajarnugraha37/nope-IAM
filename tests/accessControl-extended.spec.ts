import {
  AccessControl,
  AllowActions,
  DenyActions,
  AccessCondition,
  LogAccess,
} from "../src/decorators/accessControl";
import { IAM } from "../src/core/iam";
import { InMemoryAdapter } from "../src/adapters/inMemoryAdapter";
import { defaultPolicyEvaluator } from "../src/core/defaultEvaluator";
import { DefaultLogger } from "../src/core/logger";
import type { User, Role, Policy } from "../src/types/entities";
import { fail } from "assert";

describe("AccessControl and related decorators", () => {
  const user: User = { id: "u1", roleIds: ["r1"], policyIds: ["p1"] };
  const role: Role = { id: "r1", name: "admin", policyIds: ["p1"] };
  const policy: Policy = {
    id: "p1",
    name: "AllowRead",
    statements: [{ effect: "Allow", actions: ["read"], resources: ["doc:1"] }],
  };
  const adapter = new InMemoryAdapter({
    users: [user],
    roles: [role],
    policies: [policy],
  });
  const logger = new DefaultLogger("error");
  const iam = new IAM({
    storage: adapter,
    evaluatorFunc: defaultPolicyEvaluator,
    config: { logger, logLevel: "error" },
  });

  it("LogAccess logs access attempts and results (success and error)", async () => {
    const logs: any[] = [];
    const mockLogger = {
      info: (msg: string, ctx: any) => logs.push({ level: 'info', msg, ctx }),
      warn: (msg: string, ctx: any) => logs.push({ level: 'warn', msg, ctx })
    };
    class Test {
      logger = mockLogger;
      user = { id: 'u1' };
      // @ts-expect-error
      @LogAccess()
      async foo(): Promise<any> { return 'ok'; }
      // @ts-expect-error
      @LogAccess({ logLevel: 'warn', message: ctx => `Denied for ${ctx.user?.id}` })
      async fail(): Promise<any> { throw new Error('fail'); }
    }
    const t = new Test();
    await expect(t.foo()).resolves.toBe('ok');
    expect(logs.some(l => l.level === 'info' && l.msg.includes('Access attempt'))).toBeTruthy();
    await expect(t.fail()).rejects.toThrow('fail');
    expect(logs.some(l => l.level === 'warn' && l.msg.includes('Denied for u1'))).toBeTruthy();
  });

  it("AccessControl allows when permitted", async () => {
    class Test {
      iam = iam;
      user = user;
      // @ts-expect-error
      @AccessControl({ action: "read", resource: "doc:1" })
      async foo(): Promise<any> {
        return "ok";
      }
    }
    const t = new Test();
    await expect(t.foo()).resolves.toBe("ok");
  });


  it("AllowActions allows if user can perform any listed action on any resource", async () => {
    class Test {
      iam = iam;
      user = user;
      // @ts-expect-error
      @AllowActions(["read", "write"], ["doc:1", "doc:2"])
      async foo(): Promise<any> {
        return "ok";
      }
    }
    const t = new Test();
    await expect(t.foo()).resolves.toBe("ok");

    class Test2 {
      iam = iam;
      user = user;
      // @ts-expect-error
      @AllowActions(["write", "delete"], ["doc:2", "doc:3"])
      async foo(): Promise<any> {
        return "fail";
      }
    }
    const t2 = new Test2();
    await expect(t2.foo()).rejects.toThrow(/Access denied/);
  });


  it("DenyActions denies if user can perform any listed action on any resource", async () => {
    class Test {
      iam = iam;
      user = user;
      // @ts-expect-error
      @DenyActions(["read", "write"], ["doc:1", "doc:2"])
      async foo(): Promise<any> {
        return "fail";
      }
    }
    const t = new Test();
    await expect(t.foo()).rejects.toThrow(/explicitly denied action/);

    class Test2 {
      iam = iam;
      user = user;
      // @ts-expect-error
      @DenyActions(["delete"], ["doc:2", "doc:3"])
      async foo(): Promise<any> {
        return "ok";
      }
    }
    const t2 = new Test2();
    await expect(t2.foo()).resolves.toBe("ok");
  });

  it("AccessCondition allows only if condition returns true", async () => {
    class Test {
      iam = iam;
      user = { ...user, isActive: true };
      // @ts-expect-error
      @AccessCondition((user) => user.isActive)
      async foo(): Promise<any> {
        return "ok";
      }
    }
    const t = new Test();
    await expect(t.foo()).resolves.toBe("ok");
    class Fail {
      iam = iam;
      user = { ...user, isActive: false };
      // @ts-expect-error
      @AccessCondition((user) => user.isActive)
      async foo(): Promise<any> {
        return "fail";
      }
    }
    const f = new Fail();
    try {
      await t.foo();
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toMatch(/condition failed/);
      } else {
        fail(error);
      }
    }
  });


  it("AllowActions allows if user can perform any listed action on a single resource", async () => {
    class Test {
      iam = iam;
      user = user;
      // @ts-expect-error
      @AllowActions(["read", "write"], "doc:1")
      async foo(): Promise<any> {
        return "ok";
      }
    }
    const t = new Test();
    await expect(t.foo()).resolves.toBe("ok");
    class Fail {
      iam = iam;
      user = user;
      // @ts-expect-error
      @AllowActions(["write", "delete"], "doc:1")
      async foo(): Promise<any> {
        return "fail";
      }
    }
    const f = new Fail();
    await expect(f.foo()).rejects.toThrow(/Access denied/);
  });
});
