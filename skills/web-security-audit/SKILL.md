---
name: web-security-audit
description: |
    Check the security of a repository. Use when investigating external communication, data storage, third-party libraries, and security risks.
    Use cases: security audits, vulnerability checks, privacy reviews, investigation of external communication.
    Trigger examples: "Run a security audit", "Perform a vulnerability check", "Review privacy", "Investigate external communication"
---

# web-security-audit Skill Details

Comprehensively investigate the security of the repository and check for unintended external communication or data retention that the user may not be aware of.

## Reference Files

Read the following before running.

- `references/checklist.md`: search patterns, checklists, risk assessment matrix, common false-positive patterns
- `references/report-format.md`: report template

## Investigation Items

1. External communication checks
2. Data persistence and storage
3. Third-party libraries
4. PWA/Service Worker
5. Other security risks

## Procedure

### Step 1: Explore the Codebase

Use the Explore agent via the Task tool to investigate the following:

```
- Search for code related to external communication
- Usage of data storage APIs
- Analysis of dependencies in package.json
- Detection of security risk patterns
```

### Step 2: Pattern Search

Use the Grep tool to search for the patterns in `references/checklist.md`

### Step 3: Detailed File Analysis

Read the detected files with the Read tool and check the context:

- The actual purpose of use
- Handling of user input
- Implementation status of security measures
- Assessment of potential risks

### Step 4: Create the Report

Create the report in the format of `references/report-format.md`.

## Best Practices

1. **Incremental investigation**: Search broadly first, then perform detailed analysis
2. **Focus on context**: Understand the intent of the code before making a judgment
3. **Eliminate false positives**: Distinguish between safe and dangerous usage
4. **Specific citations**: Include file names and line numbers
5. **Provide recommendations**: Present solutions, not just problems

## Notes

- This skill performs static analysis. Runtime behavior must be verified separately.
- The internal code of third-party libraries is not fully analyzed.
- Because false positives are possible, leave the final judgment to a human.
