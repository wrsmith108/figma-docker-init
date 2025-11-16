# Docker Security Best Practices

## Overview

This document outlines the security features implemented in vibe-to-docker and provides guidance for secure deployment of containerized applications.

## Implemented Security Features

### 1. Image Security

#### Base Image Pinning
**Status**: ✅ Implemented

```dockerfile
# Images pinned to specific versions with SHA256 digests
FROM node:20-alpine@sha256:... AS deps
```

**Benefits**:
- Prevents supply chain attacks from compromised base images
- Ensures reproducible builds
- Allows security scanning of specific image versions

**Verification**:
```bash
# Check image digests in generated Dockerfile
docker image inspect node:20-alpine --format='{{.RepoDigests}}'
```

#### Package Version Pinning
**Status**: ✅ Implemented

```dockerfile
# System packages pinned to specific versions
RUN apk add --no-cache libc6-compat=1.2.4-r0
```

**Benefits**:
- Prevents unexpected package updates
- Ensures consistent security posture
- Facilitates vulnerability tracking

#### Multi-Stage Builds
**Status**: ✅ Implemented

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
# ... install dependencies

# Stage 2: Build
FROM node:20-alpine AS builder
# ... build application

# Stage 3: Production
FROM node:20-alpine AS production
# ... minimal runtime
```

**Benefits**:
- Reduces final image size (smaller attack surface)
- Excludes build tools from production image
- Separates build-time and runtime dependencies

#### OCI Image Labels
**Status**: ✅ Implemented

```dockerfile
LABEL org.opencontainers.image.source="https://github.com/wrsmith108/vibe-to-docker"
LABEL org.opencontainers.image.version="{{VERSION}}"
LABEL org.opencontainers.image.description="Docker container for {{PROJECT_NAME}}"
LABEL org.opencontainers.image.created="{{BUILD_DATE}}"
```

**Benefits**:
- Provenance tracking
- Build metadata
- Security audit trails

### 2. Runtime Security

#### No New Privileges
**Status**: ✅ Implemented

```yaml
# docker-compose.yml
security_opt:
  - no-new-privileges:true
```

**Benefits**:
- Prevents privilege escalation attacks
- Blocks setuid/setgid binaries
- Mitigates container breakout attempts

**Impact**: Blocks attacks like:
- Exploiting setuid binaries
- Privilege escalation via kernel exploits
- Container escape techniques

#### Read-Only Root Filesystem
**Status**: ✅ Implemented

```yaml
# docker-compose.yml
read_only: true
volumes:
  - /app/node_modules  # Writable for package manager
  - /tmp               # Temporary files
```

**Benefits**:
- Prevents malware persistence
- Blocks unauthorized file modifications
- Reduces incident response complexity

**Trade-offs**:
- Requires explicit writable volumes
- May impact applications expecting write access

#### Capability Dropping
**Status**: ✅ Implemented

```yaml
# docker-compose.yml
cap_drop:
  - ALL
```

**Benefits**:
- Removes unnecessary Linux capabilities
- Minimizes container permissions
- Reduces kernel attack surface

**Dropped Capabilities**: All default Docker capabilities including:
- `CAP_NET_RAW` (prevents packet sniffing)
- `CAP_SYS_ADMIN` (prevents system modifications)
- `CAP_SYS_PTRACE` (prevents debugging other processes)

#### Resource Limits
**Status**: ✅ Implemented

```yaml
# docker-compose.yml
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 1G
    reservations:
      memory: 256M
```

**Benefits**:
- Prevents resource exhaustion attacks
- Ensures fair resource sharing
- Protects host system stability

**Recommended Limits**:
- **Development**: 512MB RAM, 1 CPU
- **Production**: 1GB RAM, 2 CPUs
- **Heavy Workloads**: 2GB+ RAM, 4+ CPUs

### 3. Network Security

#### Health Monitoring
**Status**: ✅ Implemented

```dockerfile
# Dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:{{PORT}}/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
```

```yaml
# docker-compose.yml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/"]
  interval: 30s
  timeout: 3s
  start_period: 5s
  retries: 3
```

**Benefits**:
- Detects compromised containers
- Enables automatic container replacement
- Improves service reliability

**Alignment**: Health checks are consistent between Dockerfile and docker-compose.yml

### 4. Build Security

#### .dockerignore
**Status**: ✅ Implemented

```dockerignore
# Prevent sensitive files from entering build context
.env
.env.local
.git
node_modules
*.log
*.md
tests/
```

**Benefits**:
- Prevents accidental secret leakage
- Reduces build context size
- Speeds up builds

**Critical Files to Exclude**:
- `.env`, `.env.*` (secrets)
- `.git` (repository history)
- `node_modules` (large, unnecessary)
- `*.key`, `*.pem` (private keys)
- `*.log` (may contain sensitive data)

#### Build Context Scoping
**Status**: ✅ Implemented

```dockerfile
# Only copy necessary files
COPY package*.json ./
COPY src ./src
COPY public ./public
```

**Benefits**:
- Minimizes attack surface
- Reduces layer cache invalidation
- Improves build performance

#### Layer Caching Optimization
**Status**: ✅ Implemented

```dockerfile
# Copy dependency files first (changes less frequently)
COPY package*.json ./
RUN npm ci

# Copy source code last (changes frequently)
COPY . .
RUN npm run build
```

**Benefits**:
- Faster builds (reuse cached layers)
- Reduced CI/CD time
- Lower bandwidth usage

### 5. User Permissions

#### Non-Root User
**Status**: ✅ Implemented

```dockerfile
# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

# Switch to non-root user
USER appuser
```

**Benefits**:
- Limits damage from container compromise
- Prevents root-level attacks
- Follows least privilege principle

**Important**: Install global packages (like `serve`) BEFORE switching to non-root user.

## Security Checklist

### Pre-Deployment

- [ ] **Environment Variables**
  - [ ] Review `.env` for hardcoded secrets
  - [ ] Verify all secrets use environment variables
  - [ ] Confirm `.env` is in `.gitignore`

- [ ] **Image Security**
  - [ ] Base images pinned with SHA256 digests
  - [ ] System packages pinned to specific versions
  - [ ] Multi-stage builds minimize final image size

- [ ] **Runtime Security**
  - [ ] `no-new-privileges` enabled
  - [ ] Read-only root filesystem where possible
  - [ ] All capabilities dropped (`cap_drop: ALL`)
  - [ ] Resource limits configured appropriately

- [ ] **Network Security**
  - [ ] Health checks aligned (Dockerfile + docker-compose)
  - [ ] Ports properly exposed (only necessary ones)
  - [ ] TLS/HTTPS enabled in production

- [ ] **Build Security**
  - [ ] `.dockerignore` excludes sensitive files
  - [ ] Build context properly scoped
  - [ ] Layer caching optimized

### Production Deployment

- [ ] **Secrets Management**
  - [ ] Use Docker Secrets, AWS Secrets Manager, or Vault
  - [ ] Never pass secrets via environment variables in docker-compose
  - [ ] Rotate secrets regularly

- [ ] **Monitoring & Logging**
  - [ ] Container logs aggregated (ELK, Datadog, CloudWatch)
  - [ ] Security events monitored
  - [ ] Health check failures alerted

- [ ] **Network Segmentation**
  - [ ] Internal services on dedicated Docker networks
  - [ ] External services isolated
  - [ ] Network policies enforced

- [ ] **Updates & Maintenance**
  - [ ] Base images updated regularly
  - [ ] Security patches applied promptly
  - [ ] Vulnerability scanning automated

## Vulnerability Scanning

### Trivy (Recommended)

```bash
# Scan image for vulnerabilities
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image your-image:tag

# Scan with severity filter
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image --severity HIGH,CRITICAL your-image:tag

# Generate report
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image --format json --output report.json your-image:tag
```

### Docker Scan (Built-in)

```bash
# Basic scan
docker scan your-image:tag

# Scan with Snyk integration
docker scan --accept-license your-image:tag

# Exclude base image vulnerabilities
docker scan --exclude-base your-image:tag
```

### GitHub Container Scanning

```yaml
# .github/workflows/scan.yml
name: Container Scan

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build image
        run: docker build -t test-image .

      - name: Run Trivy scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: test-image
          format: sarif
          output: trivy-results.sarif

      - name: Upload results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: trivy-results.sarif
```

## Additional Recommendations

### 1. Secrets Management

**Docker Secrets (Swarm/Stack)**:
```bash
# Create secret
echo "my-secret-value" | docker secret create db_password -

# Use in docker-compose.yml
services:
  app:
    secrets:
      - db_password

secrets:
  db_password:
    external: true
```

**AWS Secrets Manager**:
```javascript
// Load secrets at runtime
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

async function getSecret(secretName) {
  const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
  return JSON.parse(data.SecretString);
}
```

**HashiCorp Vault**:
```bash
# Inject secrets at runtime
docker run -e VAULT_ADDR=https://vault.example.com \
  -e VAULT_TOKEN=s.xxxxx \
  your-image:tag
```

### 2. Content Trust (Image Signing)

```bash
# Enable Docker Content Trust
export DOCKER_CONTENT_TRUST=1

# Sign images during push
docker push your-image:tag

# Verify signatures during pull
docker pull your-image:tag
```

### 3. Regular Updates

**Automated Base Image Updates**:
```yaml
# .github/workflows/update-base-images.yml
name: Update Base Images

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Update base image digests
        run: |
          # Script to update SHA256 digests
          ./scripts/update-base-images.sh

      - name: Create pull request
        uses: peter-evans/create-pull-request@v4
        with:
          title: 'chore: update base image digests'
```

**Dependency Updates**:
```bash
# Use Dependabot or Renovate for automated PRs
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: npm
    directory: "/"
    schedule:
      interval: weekly
```

### 4. Network Segmentation

```yaml
# docker-compose.yml with network isolation
version: '3.8'

services:
  frontend:
    networks:
      - public
      - internal

  backend:
    networks:
      - internal
      - database

  db:
    networks:
      - database

networks:
  public:
    driver: bridge
  internal:
    driver: bridge
    internal: true  # No external access
  database:
    driver: bridge
    internal: true
```

### 5. Audit Logging

```yaml
# Enable Docker audit logging
# /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "audit": {
    "enabled": true,
    "log-file": "/var/log/docker-audit.log"
  }
}
```

### 6. Security Scanning in CI/CD

```yaml
# .github/workflows/ci.yml
name: CI

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - name: Run npm audit
        run: npm audit --audit-level=high --production

      - name: Scan dependencies with Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

      - name: Build and scan Docker image
        run: |
          docker build -t test-image .
          docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
            aquasecurity/trivy image --severity HIGH,CRITICAL test-image
```

## Incident Response

### Container Compromise Indicators

**Signs of compromise**:
- Unexpected network connections
- High CPU/memory usage
- Modified files (if read-only filesystem bypassed)
- Failed health checks
- Unusual process activity

**Immediate Actions**:
```bash
# Stop compromised container
docker stop <container-id>

# Export logs for forensics
docker logs <container-id> > incident-logs.txt

# Export container filesystem
docker export <container-id> > incident-filesystem.tar

# Analyze with Trivy
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasecurity/trivy image --scanners vuln,secret,config <image-id>

# Check for backdoors
docker exec <container-id> find / -perm -4000 2>/dev/null
```

**Post-Incident**:
1. Review security logs
2. Update vulnerability database
3. Patch affected systems
4. Rotate all secrets
5. Document lessons learned
6. Update security policies

## Security Resources

### Official Documentation
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)
- [OWASP Container Security](https://owasp.org/www-project-docker-security/)
- [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker)

### Security Tools
- **Trivy**: Container vulnerability scanner
- **Snyk**: Dependency and container scanning
- **Anchore**: Deep container inspection
- **Clair**: Static analysis for vulnerabilities
- **Falco**: Runtime security monitoring

### Compliance Frameworks
- **SOC 2**: Service Organization Control 2
- **PCI DSS**: Payment Card Industry Data Security Standard
- **HIPAA**: Health Insurance Portability and Accountability Act
- **GDPR**: General Data Protection Regulation

## Summary

vibe-to-docker implements comprehensive security best practices out of the box:

| Feature | Status | Impact |
|---------|--------|--------|
| Base image pinning | ✅ | Prevents supply chain attacks |
| Package version pinning | ✅ | Ensures reproducible builds |
| Multi-stage builds | ✅ | Reduces attack surface |
| No new privileges | ✅ | Blocks privilege escalation |
| Read-only filesystem | ✅ | Prevents malware persistence |
| Capability dropping | ✅ | Minimizes permissions |
| Resource limits | ✅ | Prevents DoS attacks |
| Health monitoring | ✅ | Detects compromised containers |
| Non-root user | ✅ | Limits damage from breaches |

For production deployments, ensure you implement additional security measures like secrets management, network segmentation, vulnerability scanning, and audit logging.

**Security is a continuous process, not a one-time configuration.** Regularly review and update your security posture to address emerging threats.
