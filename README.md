

# NopeIAM

[![Publish to npm](https://github.com/fajarnugraha37/nope-IAM/actions/workflows/publish.yml/badge.svg)](https://github.com/fajarnugraha37/nope-IAM/actions/workflows/publish.yml)
[![npm version](https://img.shields.io/npm/v/@fajarnugraha37/nope-iam.svg?style=flat-square)](https://www.npmjs.com/package/@fajarnugraha37/nope-iam)
[![MIT License](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)](LICENSE)

**NPM Package:** [@fajarnugraha37/nope-iam](https://www.npmjs.com/package/@fajarnugraha37/nope-iam)

<p>
A highly extensible, type-safe IAM-like access control library for Node.js, inspired by AWS IAM. 
Deny by default, allow by vibes and less patience for your bad access patterns. 
Supports policies, roles, decorators, adapters, and rich evaluation context because you probably need it.
</p>

---

## Features
- **AWS IAM-inspired**: Users, roles, policies, statements, actions, resources, conditions, effects (allow/deny, mostly deny)
- **TypeScript-first**: Strict types, generics, and type-safe APIs (because you can't be trusted)
- **Pluggable storage**: In-memory, JSON/YAML file, and custom adapters for your ever-changing stack
- **Asynchronous evaluation**: Promise-based, always
- **Rich decision context**: Not just boolean, but evaluation trace, matched policy/statement, etc.
- **Decorators**: For route/method-level access control, with parameterized and composable support (so you can blame the decorator)
- **Agnostic**: Express, Hono, Fastify, NestJS, event-driven, serverless, and whatever's trendy next week
- **Role assignment utilities**: Assign/unassign roles to users
- **Serialization**: Import/export policies, roles, etc.
- **Logging & auditing**: Pluggable logger, `@LogAccess` decorator
- **Test-driven**: Robust unit tests, high coverage, and no excuses

---

## How It Works
NopeIAM is implements a flexible, policy-based access control system for Node.js applications. 
Deny by default, allow by exception, and always with receipts. 
Here's a high-level overview:

1. **Entities**
   - **Users**: Have unique IDs, can be assigned roles and policies.
   - **Roles**: Flat (no hierarchy, because hierarchies are for old-school enterprises), can have multiple policies attached.
   - **Policies**: Collections of statements that define what actions are allowed or denied on which resources, optionally with conditions.
   - **Statements**: Specify `effect` (Allow/Deny), `actions`, `resources`, and optional `conditions`.

2. **Evaluation Flow**
   - All access is denied by default because, obviously.
   - When you call `iam.can({ user, action, resource, context })`, NopeIAM:
     1. Gathers all policies attached to the user and their roles.
     2. Iterates through policy statements to find matches for the action/resource.
     3. Evaluates conditions (if any) using built-in or custom operators.
     4. Returns a rich decision context: allow/deny, matched policy/statement, evaluation trace, and a gentle reminder of who’s in charge.

3. **Extensibility**
   - **Decorators**: Use TypeScript decorators to enforce access control at the method/route level, so you can pretend it’s someone else’s fault.
   - **Adapters**: Swap storage backends (in-memory, JSON, RDBMS, etc.) without changing your code, because you will.
   - **Custom Evaluators**: Plug in your own policy evaluation logic if you think you can do better.
   - **Hooks**: Add custom logging, auditing, or analytics at key points in the evaluation lifecycle, for maximum blame assignment.

4. **Integration**
   - Works with Express, Fastify, Hono, NestJS, serverless, and event-driven systems. If it runs JavaScript, it probably works.
   - Decorators and middleware make it easy to protect routes, handlers, and business logic (or at least make it look like you tried).

5. **Features**
   - Role assignment utilities, serialization/import/export, logging/auditing, and more, for when you need plausible deniability.

---

## Project Journey

This project has evolved through a series of improvements and real-world feedback. Key milestones include:

- **2025-07-20:** Project scaffolding, initial TypeScript config, and in-memory adapter skeleton.
- **2025-07-27:**
  - Major refactor for type safety and extensibility.
  - Added async/await and streaming support to adapters.
  - Introduced comprehensive TSDoc comments and robust Jest unit tests.
  - Implemented CI/CD with GitHub Actions for automated npm publishing.
  - Fixed TypeScript ESM/declaration issues and Jest ESM compatibility.
  - Added a detailed [CHANGELOG.md](CHANGELOG.md) for transparent release notes.

See the [CHANGELOG.md](CHANGELOG.md) for a full history of changes, fixes, and planned features.

```
+-------------------+         +-------------------+         +-------------------+
|      User         |         |      Role         |         |     Policy        |
|-------------------|         |-------------------|         |-------------------|
| id                |         | id                |         | id                |
| roleIds[]         |<------->| policyIds[]       |<------->| statements[]      |
| policyIds[]       |         | name              |         | name              |
+-------------------+         +-------------------+         | statements:       |
                                                            | - effect          |
                                                            | - actions[]       |
                                                            | - resources[]     |
                                                            | - conditions[]    |
                                                            +-------------------+

      |                                      |                        |
      |                                      |                        |
      v                                      v                        v
+-------------------+         +-------------------+         +-------------------+
|   Decorators      |         |   IAM Engine      |         |   Storage Adapter |
|-------------------|         |-------------------|         |-------------------|
| @AccessControl    |         | can()             |         | InMemoryAdapter   |
| @RequireRole      |         | evaluate()        |         | JsonFileAdapter   |
| ...               |         | hooks, logger     |         | CustomStorage     |
+-------------------+         +-------------------+         +-------------------+
```

**Flow:**
- User makes a request (e.g., HTTP route or method call)
- Decorator triggers access check via IAM Engine
- IAM Engine loads user, roles, and policies from storage
- Policies/statements are evaluated for the action/resource/context
- Decision (allow/deny) is returned, with trace and logging

---


---

## Installation
```sh
npm install @fajarnugraha37/nope-iam --save
# or
yarn add @fajarnugraha37/nope-iam
# or
pnpm add @fajarnugraha37/nope-iam
```

**NPM Package:** [@fajarnugraha37/nope-iam](https://www.npmjs.com/package/@fajarnugraha37/nope-iam)

---

## Quick Example
```ts
import { IAM, InMemoryAdapter, defaultPolicyEvaluator } from '@fajarnugraha37/nope-iam';

const policy = { id: 'p1', name: 'AllowRead', statements: [ { effect: 'Allow', actions: ['read'], resources: ['doc:1'] } ] };
const role = { id: 'r1', name: 'reader', policyIds: ['p1'] };
const user = { id: 'u1', roleIds: ['r1'], policyIds: [] };
const adapter = new InMemoryAdapter({ users: [user], roles: [role], policies: [policy] });
const iam = new IAM({ storage: adapter, evaluatorFunc: defaultPolicyEvaluator });

const result = await iam.can({ user, action: 'read', resource: 'doc:1' });
console.log(result.decision); // true
```

---

## Decorators 
- Use `@AccessControl`, `@RequireRole`, `@RequirePolicy`, `@AllowActions`, `@DenyActions`, `@AccessCondition`, `@LogAccess` on methods

---

## Storage Adapters
- **InMemoryAdapter**: Fast prototyping, tests
- **JsonFileAdapter**: Simple persistence
- **Custom**: Implement the `IAMStorage` interface

---

## Logging & Auditing
- Pluggable logger (DefaultLogger, custom)
- `@LogAccess` decorator for method-level auditing

---

## Testing & Coverage
- Jest-based unit tests for all core modules, decorators, adapters, and integrations

---

## Publishing & Usage
- MIT License
- Ready for npm: includes type declarations, clean exports, and documentation
- Automated publishing via GitHub Actions on tag and manual trigger ([see workflow](.github/workflows/publish.yml)).
- TypeScript and Jest configuration are tuned for ESM and modern Node.js compatibility.

---

---

## Project Roadmap
- [x] **Core IAM Engine**: Type-safe, extensible, and async policy evaluation
- [x] **Policy, Role, User Model**: AWS IAM-inspired, with flat roles and explicit policy attachment
- [x] **In-Memory, JSON & YAML Adapters**: Pluggable storage, ready for custom and RDBMS adapters
- [x] **Rich Decorator Suite**: `@AccessControl`, `@RequireRole`, `@RequirePolicy`, `@AllowActions`, `@DenyActions`, `@AccessCondition`, `@LogAccess`
- [x] **Role Assignment Utilities**: Assign/unassign roles to users
- [x] **Serialization**: Import/export for policies, roles, etc.
- [x] **Pluggable Logger & Config**: Centralized, extensible logging and configuration
- [x] **Comprehensive Unit Tests**: High coverage, TDD, and edge case testing
- [x] **Documentation**: Full API docs, usage examples, and onboarding guides
- [x] **CI/CD Ready**: Clean build, type declarations, and npm publishing support
- [x] **Community Standards**: MIT license, contributing guide, and code quality best practices
- [ ] **Advanced Condition Operators**: Built-in and pluggable operators (e.g., time, IP, geo, custom context)
- [ ] **Policy Migration**: Tools for evolving and migrating policy schemas
- [ ] **Policy/Role Hierarchies**: Optional support for nested roles or policy inheritance
- [ ] **Decision Caching**: Per-request or per-session IAM decision cache for performance
- [ ] **Remote Storage**: Redis, RDBMS, MongoDB, or cloud adapter support
- [ ] **Multi-tenant Support**: Isolation and scoping for SaaS/multi-tenant apps
- [ ] **Audit/Event Hooks**: Webhooks, event emitters, or analytics integrations
- [ ] **Localization/Internationalization**: Error messages and docs in multiple languages
- [ ] **CLI Tooling**: Policy validation, import/export, and migration via CLI
- [ ] **Security Hardening**: Static analysis, fuzzing, and advanced threat modeling
- [ ] **Community Plugins**: Registry for custom adapters, evaluators, and decorators
- [ ] **Policy Simulation/Preview**: Simulate policy changes and preview their effects before applying
- [ ] **User/Role/Policy Importers**: Import from AWS IAM, Auth0, or other systems
- [ ] **Session/Token Integration**: JWT or OAuth2 integration for user context and claims-based access
- [ ] **Policy Expiry/Revocation**: Support for time-limited or revocable policies/roles
- [ ] **Delegated Authorization**: Allow users to delegate permissions to others (with constraints)
- [ ] **Policy Change Auditing**: Track and log all changes to policies, roles, and assignments
- [ ] **Plugin System**: Allow third-party plugins for custom evaluators, adapters, or decorators
- [ ] **Policy/Decision Export**: Export evaluation traces for compliance or debugging
- [ ] **Metrics**: Built-in metrics and tracing for access control evaluation

---

---

## Project Structure
```
├── src/
│   ├── core/           # IAM engine, evaluators, logger, storage
│   ├── adapters/       # In-memory, JSON, YAML
│   ├── decorators/     # Access control decorators
│   ├── types/          # Entities, decision context, etc.
│   └── utils/          # Role assignment, serialization
├── tests/              # Unit tests
├── coverage/           # Coverage reports
├── dist/               # Build output
├── package.json
├── tsconfig.json
├── LICENSE
└── README.md
```

---

---

## Contributing & Feedback
We welcome PRs, issues, and suggestions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) if available. For questions or feedback, open an issue or contact the author directly.
PRs and issues welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) if available.

---

---

## Author & License
Fajar Nugraha (<fajarnugraha37@gmail.com>)

---

## License
MIT
