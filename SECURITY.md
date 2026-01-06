# Security Policy

## 🛡️ Security Philosophy

Pure Python AI Code Reviewer is designed with security and privacy as core principles:

- **100% Offline Operation** - Your code never leaves your machine
- **No Data Collection** - Zero telemetry or tracking
- **No External Dependencies** - No API calls to third-party services
- **Open Source** - Full transparency of all code

## 🔒 Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | ✅ Yes             |
| < 1.0   | ❌ No              |

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability, please follow these steps:

### 1. **Do NOT** create a public GitHub issue

Security vulnerabilities should be reported privately to protect users.

### 2. **Contact us directly**

- **Email**: sanyamk.work@outlook.in
- **Subject**: "Security Vulnerability Report - AI Code Reviewer"

### 3. **Include the following information**

- **Description** of the vulnerability
- **Steps to reproduce** the issue
- **Potential impact** assessment
- **Suggested fix** (if you have one)
- **Your contact information** for follow-up

### 4. **Response timeline**

- **Initial response**: Within 48 hours
- **Status update**: Within 7 days
- **Fix timeline**: Depends on severity (see below)

## 🎯 Vulnerability Severity Levels

### Critical (Fix within 24-48 hours)
- Remote code execution
- Privilege escalation
- Data exfiltration

### High (Fix within 1 week)
- Local code execution
- Sensitive data exposure
- Authentication bypass

### Medium (Fix within 2 weeks)
- Information disclosure
- Denial of service
- Input validation issues

### Low (Fix within 1 month)
- Minor information leaks
- Configuration issues
- Non-security bugs with security implications

## 🔐 Security Best Practices for Users

### Installation Security
- **Download only from official sources**:
  - VS Code Marketplace
  - Official GitHub releases
  - Verified distribution channels

- **Verify checksums** when available
- **Use latest version** for security updates

### Runtime Security
- **Run Python server locally only** (default: localhost:5001)
- **Don't expose server** to external networks
- **Use virtual environments** for Python dependencies
- **Keep dependencies updated** regularly

### Code Analysis Security
- **Review findings carefully** - Don't blindly apply suggestions
- **Understand security warnings** before making changes
- **Test changes thoroughly** in development environment

## 🛠️ Security Features

### Built-in Protections
- **Input sanitization** for all code analysis
- **Safe AST parsing** with error handling
- **Sandboxed execution** of analysis tools
- **No eval() or exec()** in core code
- **Minimal permissions** required

### Privacy Protections
- **Local processing only** - No cloud analysis
- **No code transmission** to external services
- **No usage analytics** or telemetry
- **No persistent storage** of analyzed code

## 🔍 Security Auditing

### Regular Security Reviews
- **Code audits** before each release
- **Dependency scanning** for known vulnerabilities
- **Static analysis** of extension code
- **Manual testing** of security features

### Third-party Tools
We use these tools to maintain security:
- **Bandit** - Python security linting
- **Safety** - Dependency vulnerability scanning
- **ESLint** - JavaScript/TypeScript security rules
- **npm audit** - Node.js dependency checking

## 📋 Security Checklist for Contributors

Before submitting code:

- [ ] No hardcoded secrets or credentials
- [ ] Input validation for all user data
- [ ] Error handling doesn't expose sensitive info
- [ ] No unsafe operations (eval, exec, etc.)
- [ ] Dependencies are up-to-date and secure
- [ ] Code follows security best practices

## 🚫 Out of Scope

The following are **not** considered security vulnerabilities:

- **Performance issues** (unless they enable DoS)
- **Feature requests** or enhancements
- **Issues in third-party dependencies** (report to upstream)
- **Social engineering** attacks
- **Physical access** scenarios

## 🏆 Security Hall of Fame

We recognize security researchers who help improve our security:

*No vulnerabilities reported yet - be the first!*

## 📞 Contact Information

For security-related questions or concerns:

- **Security Email**: [INSERT YOUR EMAIL]
- **PGP Key**: [INSERT PGP KEY ID IF AVAILABLE]
- **Response Time**: 48 hours maximum

## 📜 Disclosure Policy

- **Coordinated disclosure** - We work with researchers to fix issues before public disclosure
- **Credit given** - Security researchers are credited (with permission)
- **Timeline transparency** - We provide regular updates on fix progress
- **Public disclosure** - Details published after fix is available

---

**Thank you for helping keep Pure Python AI Code Reviewer secure!** 🛡️

*Last updated: January 2026*