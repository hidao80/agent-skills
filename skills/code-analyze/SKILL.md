---
name: code-analyze
description: |
    Record and update project documentation in a form that is easy for both humans and AI to read.
    Trigger examples: "Analyze the project", "Analyze the repository", "Document the source code"
---

# code-analyze Skill Details

## Traceability and Consistency

- **Commit hash**: Append the current commit hash to the last line of every file you change or create
- **Source of Truth**: When you detect a discrepancy, always prioritize test code (unit/integration) over the implementation
- **Verification**: When you find a discrepancy between layers (e.g., DB and API), record it as an "inconsistency"

## Documentation Hygiene

- **Pruning**: Completely remove all entries, notes, and TODOs related to files, components, or features that no longer exist in the codebase
- **Structure**: Keep the directory structure under `@z-ai/code-analyzed/{CATEGORY_NAME}.md` tidy as Open Knowledge Format
- **Front matter**: Include the following front matter in every `.md` file you generate:  

    ```frontmatter
    ---
    name: analyzed-{basename}
    description: {Describe the purpose in one sentence.}
    updated_at: {YYYY-MM-DD HH:MM:SS}
    type: analysis
    ---
    ```

## Information Quality

- **When speculating**: When making suggestions or speculating, present concise options and give each a recommendation level (1–5).
- **Clarity**: Use Mermaid syntax for all diagrams (ER diagrams, flow diagrams, use case diagrams).
- **Conciseness**: Omit descriptive or boilerplate content of configuration files; include only summaries or references.

## Target Files

**Execution rule:** Create or update in the following order.

| Step | Category name | Topics |
| --- | --- | --- |
| 1 | dependencies | Library names, versions, licenses, vulnerabilities, update status. |
| 2 | infrastructures | CD/CI and IaC. |
| 3 | databases | Connection information, architecture, migrations, table list by category with summaries, overview of domain areas. |
| 4 | screens | Entry points, default routes, URL patterns, controller inheritance hierarchy, base classes, view file conventions, base template files. |
| 5 | configurations | Main configuration files, per-environment configuration. |
| 6 | components | Application structure, custom vendor namespaces. |
| 7 | utilities | Global helper classes, functions, traits. |
| 8 | performance | Performance checks; identification of processing time, number of parallel processes, and bottlenecks. |
| 9 | known_bugs | Notes on security issues, architecture/design issues, compatibility issues, and limitations of the analysis. |
| 10 | security | **[Required]**: Injection (SQL/XSS/command/path traversal), leakage of secrets and credentials (hard-coded keys, committed .env), authentication and authorization (unprotected endpoints, bypasses); **[Recommended]**: CORS/security headers (CSP, HSTS, X-Frame-Options, etc.), data exposure (sensitive fields in API responses, stack traces on errors, etc.), dependency vulnerabilities (known CVEs in lock files, etc.); **[Optional]**: rate limiting/brute-force protection, file upload validation (MIME type, path restrictions), transport security (TLS version, cipher suites), etc. |
| 11 | test | What the provided tests cover. |
| 12 | development-workflow | Development workflow. |
| 13 | overview | Project overview, tech stack, repository structure, request flow, domain structure, scale, step count (approximate lines of code), main features, development workflow. |
| 14 | notes | Information not included in documents other than notes. |
| 15 | todo | Security (high priority), tests, database, code quality, infrastructure, developer experience, performance. |
| 16 | naming_convention | Variables, table names, column names, function names, class names. |
| 17 | use_cases | Use case diagrams. |
