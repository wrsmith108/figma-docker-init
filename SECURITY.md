# Security Policy

## Supported Versions

The following versions of vibe-to-docker are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 2.1.x   | :white_check_mark: |
| 2.0.x   | :white_check_mark: |
| 1.0.x   | :x:                |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of vibe-to-docker seriously. If you discover a security vulnerability, please follow these steps:

### Where to Report

Please report security vulnerabilities by:

1. **Email**: Send details to the maintainers at the repository owner's email
2. **GitHub Security Advisories**: Use the [Security Advisories](https://github.com/wrsmith108/vibe-to-docker/security/advisories) feature
3. **Private Disclosure**: For sensitive issues, please do NOT open a public issue

### What to Include

When reporting a vulnerability, please include:

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact of the vulnerability
- Any suggested fixes or mitigations
- Your contact information for follow-up

### Response Timeline

- **Initial Response**: Within 48 hours of report
- **Status Updates**: Every 7 days until resolved
- **Fix Timeline**: Critical vulnerabilities within 7 days, others within 30 days

### What to Expect

**If Accepted:**
- We will work with you to understand and validate the vulnerability
- A fix will be developed and tested
- A security advisory will be published
- Credit will be given to the reporter (unless you prefer to remain anonymous)
- A CVE may be requested for significant vulnerabilities

**If Declined:**
- We will explain why the report was not accepted
- Alternative solutions or mitigations may be suggested
- The report will be closed with explanation

## Security Best Practices

When using vibe-to-docker:

1. **Keep Updated**: Always use the latest supported version
2. **Review Generated Files**: Inspect Dockerfiles and configurations before deploying
3. **Secure Secrets**: Never commit sensitive data (API keys, passwords) to Docker configurations
4. **Environment Variables**: Use environment variables for sensitive configuration
5. **Container Security**: Follow Docker security best practices for production deployments
6. **Regular Scans**: Scan generated Docker images for vulnerabilities

## Automated Security

This repository uses:

- **CodeQL**: Automated code scanning for vulnerabilities
- **npm audit**: Dependency vulnerability scanning
- **Semantic Versioning**: Clear version tracking for security patches

## Disclosure Policy

- Security issues are disclosed publicly only after fixes are available
- Users are notified through GitHub Security Advisories
- Critical vulnerabilities trigger immediate patch releases
- Security patches are backported to supported versions when necessary

---

Thank you for helping keep vibe-to-docker and its users safe!
