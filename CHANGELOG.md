# Changelog

All notable changes to this project will be documented in this file. This project adheres to [Semantic Versioning](https://semver.org/).

---


## [0.2.5] - 2025-07-27
### Added
- Initial implementation of `InMemoryAdapter` for IAM storage with async/await and streaming support.
- Type-safe interfaces for `User`, `Role`, `Policy` entities.
- Pluggable logger with configurable log level.
- Async CRUD methods for users, roles, and policies.
- Iterable access for all entities (for large dataset streaming).
- TSDoc comments for all public APIs.
- Jest unit tests for all adapter methods.
- GitHub Actions workflow for automated npm publishing on tag and manual trigger.

### Changed
- Improved logger initialization to support config and custom loggers.
- Enhanced error handling for missing entities.
- Updated TypeScript configuration for better ESM compatibility and declaration output.
- Refined Jest configuration for ESM and TypeScript support, improved test matching and coverage collection.

### Fixed
- Fixed bug where saving a user with an existing ID would not update the user.
- Fixed type inference for empty adapter initialization.
- Fixed CI/CD pipeline to ensure successful TypeScript build and npm publish.
- Fixed Jest ESM/TypeScript compatibility issues in test runs.

---

## [0.1.0] - 2025-07-20
### Added
- Project scaffolding and initial TypeScript configuration.
- Core entity types and interfaces.
- Basic in-memory storage adapter skeleton.
- Initial test setup with Jest.

---

## [Unreleased]
- Planned: RDBMS adapter with Drizzle ORM.
- Planned: JSON file adapter with import/export utilities.
- Planned: Policy evaluation engine and decorators for framework integration.
- Planned: Advanced condition operators and simulation API.
