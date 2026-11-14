# Security Audit Report Template - Reference Document

Arrange items that include a risk level in descending order of risk level.

```markdown
## Security Audit Report

**Audit date**: YYYY-MM-DD
**Target repository**: {repository name}
**Audit scope**: {full scan/partial scan}

### Executive Summary

{Describe the overall assessment in 2–3 sentences}

### Findings Summary

| Category | Risk level | Count |
|----------|------------|-------|
| External communication | {level} | {count} |
| Data storage | {level} | {count} |
| Vulnerabilities | {level} | {count} |
| Libraries | {level} | {count} |

### Detailed Findings

#### 1. External Communication

- **Finding**: {specific details}
- **Risk assessment**: {level}
- **Location**: {file/path:line_number}
- **Details**: {specific description of the issue}
- **Impact**: {security impact}
- **Recommended actions**:
  1. {action 1}
  2. {action 2}

#### 2. Data Storage

{Describe in the same format}

#### 3. Security Vulnerabilities

{Describe in the same format}

#### 4. Third-Party Libraries

{Describe in the same format}

### Overall Assessment

- **Risk level**: {Very low/Low/Medium/High/Critical}
- **Observations**: {overall assessment and summary}

### Recommendations by Priority

#### Immediately
- [ ] {item 1}
- [ ] {item 2}

#### Within 1 Week
- [ ] {item 1}
- [ ] {item 2}

#### Within 1 Month
- [ ] {item 1}
- [ ] {item 2}

#### At Next Release
- [ ] {item 1}
- [ ] {item 2}

### References

- {related documents}
- {reference URLs}
```
