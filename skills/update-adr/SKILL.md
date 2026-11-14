---
name: update-adr
description: |
  Create or update Architecture Decision Record (ADR) documentation from the Git log.
  Trigger examples: "Create an ADR", "Update the ADR", "Create an architecture decision record", "Update the architecture decision record"
---

# update-adr Skill Details

Create Architecture Decision Record (ADR) documentation as `@docs/ADR.md` from the git log. If the `docs/` directory does not exist, create it. If `docs/ADR.md` already exists, update it based on the contents of the git log.

## Scope of the ADR

Reflect only committed content. Do not reflect uncommitted changes.

## Criteria for Extracting Decisions

Extract content related to architecture decisions from the commit messages and contents of committed commits.

## ADR Format

Create the ADR following the format below.

```
---

## ADR-{%03d}: {ADR title} — {summary}

**Date**: YYYY-MM-DD (initial commit `{commit-hash}` onward)
**Status**: {status: Accepted | Deprecated | Superseded | Rejected | Proposed} 

**Context**: {context: why the decision was made, what problem it solves, what alternatives were considered}

**Decision**: {decision: what was decided, how it is implemented, what trade-offs were made}

**Consequences**: {consequences: the effects of the decision, its benefits, drawbacks, and future challenges}

**Update-{%03d} ({YYYY-MM-DD}, `{commit-hash-N}`, `{commit-hash-N+1}`, ...)**: {update: how the decision changed, why it changed, what alternatives were considered}

``` 

## Rules

1. Do not run automatically after a commit.
2. When changing the content of an existing ADR, always append it as an update history entry.
3. When creating a new ADR, continue the numbering of existing ADRs and append it as an update history entry.
4. Assign numbers in ascending order.
