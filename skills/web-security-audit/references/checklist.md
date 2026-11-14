# Security Audit - Reference Document

## Search Patterns

### 1. External Communication Patterns

#### HTTP/HTTPS Communication
```regex
fetch\s*\(
XMLHttpRequest
axios\.(get|post|put|delete|patch)
http\.request
https\.request
request\(
got\(
superagent
needle
```

#### WebSocket Communication
```regex
new\s+WebSocket\(
ws://
wss://
socket\.io
```

#### Other Network Communication
```regex
net\.connect
dgram\.
dns\.resolve
```

### 2. Data Storage Patterns

#### Browser Storage
```regex
localStorage\.(setItem|getItem)
sessionStorage\.(setItem|getItem)
document\.cookie
```

#### Databases
```regex
indexedDB\.open
openDatabase\(
new\s+Dexie\(
mongoose\.connect
sequelize
knex
```

#### File System (Node.js)
```regex
fs\.writeFile
fs\.appendFile
fs\.createWriteStream
writeFileSync
```

### 3. Dangerous Code Execution Patterns

#### Dynamic Code Execution
```regex
eval\s*\(
new\s+Function\(
setTimeout\s*\(\s*["']
setInterval\s*\(\s*["']
```

#### Command Execution
```regex
child_process\.exec
child_process\.spawn
child_process\.execFile
shell\.exec
require\(['"]child_process['"]\)
```

#### Template Injection
```regex
<script>
innerHTML\s*=
dangerouslySetInnerHTML
v-html=
```

### 4. Authentication and Authorization Patterns

#### Sensitive Information Patterns
```regex
password\s*[:=]
api[_-]?key\s*[:=]
secret\s*[:=]
token\s*[:=]
private[_-]?key\s*[:=]
access[_-]?token\s*[:=]
bearer\s+
authorization:\s*
```

#### Environment Variable Access
```regex
process\.env\.
\$\{env:
ENV\[['"]
os\.environ
```

### 5. SQL Injection

```regex
SELECT\s+.*?\$\{
INSERT\s+INTO\s+.*?\$\{
UPDATE\s+.*?SET\s+.*?\$\{
DELETE\s+FROM\s+.*?\$\{
"SELECT\s+.*?"\s*\+\s*
'SELECT\s+.*?'\s*\+\s*
query\(.*?\+.*?\)
```

### 6. XSS (Cross-Site Scripting)

```regex
innerHTML\s*=\s*.*?\+
\.html\(.*?\+
document\.write\(
eval\(.*?request
\$\{.*?req\.
dangerouslySetInnerHTML.*?\{
v-html=
```

### 7. Path Traversal

```regex
\.\./
\.\.\\
path\.join\(.*?req\.
fs\.readFile\(.*?req\.
```

### 8. CSRF (Cross-Site Request Forgery)

```regex
cors\(
Access-Control-Allow-Origin:\s*\*
withCredentials:\s*true
```

## Checklists

### External Communication Checklist

- [ ] Check the destination of every fetch call
- [ ] Identify where XMLHttpRequest is used
- [ ] Check WebSocket connection destinations
- [ ] Presence of analytics libraries (Google Analytics, etc.)
- [ ] Presence of tracking code (Facebook Pixel, etc.)
- [ ] Check what data is sent to external APIs
- [ ] Confirm no data is sent without user consent

### Data Storage Checklist

- [ ] Contents of data stored in localStorage
- [ ] Purpose of sessionStorage usage
- [ ] Information stored in cookies
- [ ] IndexedDB usage
- [ ] Whether personal information is encrypted
- [ ] Data retention period settings
- [ ] Implementation of data deletion features

### Vulnerability Checklist

#### Code Execution
- [ ] No use of eval()
- [ ] No use of new Function()
- [ ] Input validation when executing child processes
- [ ] Safety of dynamic require()

#### Injection
- [ ] Parameterization of SQL queries
- [ ] Sanitization of user input
- [ ] HTML escaping
- [ ] Validation of command-line arguments

#### Authentication and Authorization
- [ ] Password hashing
- [ ] Secure token storage
- [ ] Session management implementation
- [ ] Permission check implementation

#### Data Exposure
- [ ] Verbosity of error messages
- [ ] Removal of debug code
- [ ] Proper management of environment variables
- [ ] .gitignore configuration

### Third-Party Library Checklist

- [ ] Confirm the purpose of every dependency
- [ ] Check the last update date (maintenance status)
- [ ] Check for known vulnerabilities (npm audit, etc.)
- [ ] Check licenses
- [ ] Evaluate download counts and trustworthiness
- [ ] Remove unnecessary dependencies

## Risk Assessment Matrix

### Risk Level Definitions

| Level | Description | Example |
|-------|-------------|---------|
| **Very low** | Almost no risk | Local processing only |
| **Low** | Minimal risk | Only trusted libraries used |
| **Medium** | Needs attention | Child process execution, environment variable access |
| **High** | Serious risk | Unvalidated external input, dangerous code execution |
| **Critical** | Requires immediate action | Exposed credentials, SQL injection |

#### Risk Level Criteria

| Item | Very low | Low | Medium | High | Critical |
|------|----------|-----|--------|------|----------|
| **External communication** | None | Trusted APIs | Third-party APIs | Unknown endpoints | Unencrypted transmission |
| **Data storage** | None | Settings only | Non-sensitive data | Personal information (encrypted) | Personal information (plaintext) |
| **Code execution** | None | Static code only | Validated dynamic execution | Restricted dynamic execution | Unvalidated dynamic execution |
| **Input validation** | N/A | Full validation | Basic validation | Partial validation | No validation |
| **Authentication** | N/A | Multi-factor authentication | Basic authentication | Weak authentication | No authentication |

### Vulnerability Severity

| CVSS | Level | Response deadline |
|------|-------|-------------------|
| 9.0–10.0 | Critical | Immediately |
| 7.0–8.9 | High | Within 1 week |
| 4.0–6.9 | Medium | Within 1 month |
| 0.1–3.9 | Low | Next release |

## Security Best Practices

### 1. Input Validation

```typescript
// ❌ Bad
const userId = req.query.id;
db.query(`SELECT * FROM users WHERE id = ${userId}`);

// ✅ Good
const userId = parseInt(req.query.id);
if (isNaN(userId) || userId < 0) {
  throw new Error('Invalid user ID');
}
db.query('SELECT * FROM users WHERE id = ?', [userId]);
```

### 2. Output Escaping

```javascript
// ❌ Bad
element.innerHTML = userInput;

// ✅ Good
element.textContent = userInput;
// or
element.innerHTML = DOMPurify.sanitize(userInput);
```

### 3. Managing Sensitive Information

```bash
# ❌ Bad
API_KEY=abc123  # Written directly in code

# ✅ Good
# Store in a .env file
API_KEY=abc123

# Add to .gitignore
echo ".env" >> .gitignore
```

### 4. Child Process Execution

```typescript
// ❌ Bad
const { exec } = require('child_process');
exec(`ls ${userInput}`);

// ✅ Good
const { spawn } = require('child_process');
spawn('ls', [userInput]);
```

### 5. CORS Configuration

```javascript
// ❌ Bad
app.use(cors({ origin: '*' }));

// ✅ Good
app.use(cors({
  origin: 'https://trusted-domain.com',
  credentials: true
}));
```

## Criteria for Evaluating External Communication

### Conditions for Trustworthy External Communication

1. **Necessity**: Essential to implementing the feature
2. **Transparency**: Disclosed to the user
3. **Consent**: User consent has been obtained
4. **Encryption**: Uses HTTPS/TLS
5. **Minimalism**: Sends only the minimum necessary data
6. **Privacy**: Handles personal information appropriately

### Characteristics of Problematic External Communication

1. **Concealment**: No notice to the user
2. **Excess**: Sends unnecessary data
3. **Plaintext**: No encryption
4. **Tracking**: Tracking without consent
5. **Unknown**: Unclear destination
6. **Leakage**: Sends sensitive information

## Common False-Positive Patterns

### 1. Code in Comments

```javascript
// Do not use eval() in this function
function safeExecute(code) {
  // Safe implementation
}
```

→ `eval()` inside a comment is never actually executed

### 2. String Literals

```javascript
const warning = "eval() is dangerous";
console.log(warning);
```

→ Mentioning it as a string is not a problem

### 3. Test Code

```javascript
// test/security.spec.ts
it('should prevent eval injection', () => {
  expect(() => eval(userInput)).toThrow();
});
```

→ Usage for testing purposes may be acceptable

### 4. Development Debug Code

```javascript
if (process.env.NODE_ENV === 'development') {
  console.log('Debug:', sensitiveData);
}
```

→ Not executed in production

## Tools and Automation

### Recommended Tools

1. **npm audit**: Vulnerability checks for npm dependencies
2. **Snyk**: Continuous security monitoring
3. **ESLint security plugins**: Static analysis
4. **OWASP ZAP**: Dynamic security testing
5. **SonarQube**: Code quality and security analysis

### Example Commands

```bash
# Check npm dependencies for vulnerabilities
npm audit

# Detailed report
npm audit --json

# Automatic fixes (use with caution)
npm audit fix

# Snyk scan
npx snyk test

# ESLint security check
npx eslint --plugin security .
```

## Related Links

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
