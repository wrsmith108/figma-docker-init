# Security Headers Guide

## Overview

This document provides guidance on implementing security headers for production deployments of vibe-to-docker containerized applications.

> **Note**: For local development, these headers are **optional**. They become critical when deploying to production or exposing your application to the internet.

## Why Security Headers Matter

Security headers protect your application from common web vulnerabilities:
- **XSS (Cross-Site Scripting)**: Headers prevent injection of malicious scripts
- **Clickjacking**: Prevents your site from being embedded in malicious iframes
- **MIME Sniffing**: Stops browsers from misinterpreting content types
- **Information Leakage**: Reduces data exposed to attackers

## Implementation Options

### Option 1: Reverse Proxy (Recommended for Production)

Add a reverse proxy (nginx, Caddy, Traefik) in front of your containerized app.

#### Using nginx

**docker-compose.yml**:
```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    networks:
      - app-network

  app:
    build:
      context: ../
      dockerfile: .vibe-docker/Dockerfile
    expose:
      - "3000"
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

**nginx.conf**:
```nginx
http {
    # Modern security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Content Security Policy (adjust for your needs)
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'" always;

    # Strict Transport Security (HTTPS only)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # Permissions Policy (formerly Feature Policy)
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    server {
        listen 80;
        listen [::]:80;
        server_name your-domain.com;

        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        listen [::]:443 ssl http2;
        server_name your-domain.com;

        # SSL configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
        ssl_prefer_server_ciphers on;

        location / {
            proxy_pass http://app:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

#### Using Caddy (Automatic HTTPS)

**Caddyfile**:
```caddy
your-domain.com {
    reverse_proxy app:3000

    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
        Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:"
        Permissions-Policy "geolocation=(), microphone=(), camera=()"
        -Server  # Remove server header
    }
}
```

**docker-compose.yml**:
```yaml
services:
  caddy:
    image: caddy:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - app
    networks:
      - app-network

volumes:
  caddy_data:
  caddy_config:
```

### Option 2: Application-Level Headers

If you can't use a reverse proxy, add headers in your application code.

#### React/Vite Applications

**vite.config.js**:
```javascript
export default {
  server: {
    headers: {
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  }
}
```

#### Next.js Applications

**next.config.js**:
```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
          },
        ],
      },
    ]
  },
}
```

## Security Headers Explained

### Essential Headers

#### 1. X-Frame-Options
```
X-Frame-Options: SAMEORIGIN
```
- **Purpose**: Prevents clickjacking attacks
- **Values**:
  - `DENY`: Never allow framing
  - `SAMEORIGIN`: Only allow same-origin framing
  - `ALLOW-FROM https://example.com`: Allow specific origin (deprecated)

#### 2. X-Content-Type-Options
```
X-Content-Type-Options: nosniff
```
- **Purpose**: Prevents MIME-type sniffing
- **Effect**: Browsers respect `Content-Type` header strictly

#### 3. X-XSS-Protection
```
X-XSS-Protection: 1; mode=block
```
- **Purpose**: Enables browser XSS filtering (legacy browsers)
- **Note**: Modern browsers use CSP instead
- **Values**:
  - `0`: Disable filter
  - `1`: Enable filter
  - `1; mode=block`: Enable and block rendering

#### 4. Referrer-Policy
```
Referrer-Policy: strict-origin-when-cross-origin
```
- **Purpose**: Controls what referrer information is sent
- **Values**:
  - `no-referrer`: Never send referrer
  - `strict-origin`: Send origin only on HTTPS→HTTPS
  - `strict-origin-when-cross-origin`: Full URL same-origin, origin only cross-origin (recommended)

### Advanced Headers

#### 5. Content-Security-Policy (CSP)
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:
```
- **Purpose**: Prevents XSS and data injection attacks
- **Directives**:
  - `default-src 'self'`: Only load resources from same origin
  - `script-src`: Control script sources
  - `style-src`: Control stylesheet sources
  - `img-src`: Control image sources
  - `connect-src`: Control AJAX/WebSocket connections

**⚠️ Warning**: CSP can break your app if configured incorrectly. Test thoroughly!

**Gradual Implementation**:
1. Start with `Content-Security-Policy-Report-Only` to test without blocking
2. Monitor violation reports
3. Adjust policy based on findings
4. Switch to enforcing mode

#### 6. Strict-Transport-Security (HSTS)
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```
- **Purpose**: Force HTTPS connections
- **Required**: HTTPS must be available
- **Parameters**:
  - `max-age=31536000`: Enforce for 1 year
  - `includeSubDomains`: Apply to all subdomains
  - `preload`: Submit to browser preload list

**⚠️ Critical**: Only enable after confirming HTTPS works correctly!

#### 7. Permissions-Policy
```
Permissions-Policy: geolocation=(), microphone=(), camera=()
```
- **Purpose**: Control browser features (camera, microphone, etc.)
- **Syntax**: `feature=(allowed-origins)`
- **Example**: Disable all powerful features by default

## Testing Your Headers

### 1. Browser DevTools
1. Open DevTools (F12)
2. Go to Network tab
3. Refresh page
4. Click on document request
5. Check Response Headers

### 2. Online Security Scanners
- **Security Headers**: https://securityheaders.com/
- **Mozilla Observatory**: https://observatory.mozilla.org/
- **SSL Labs**: https://www.ssllabs.com/ssltest/ (for HTTPS)

### 3. Command Line Testing
```bash
# Check headers with curl
curl -I https://your-domain.com

# Check specific header
curl -I https://your-domain.com | grep -i "x-frame-options"
```

## Header Grade Scale

Security scanners typically grade headers A-F:

- **A+**: Excellent security posture
  - All essential headers present
  - CSP configured properly
  - HSTS with preload
  - Permissions Policy configured

- **A**: Strong security
  - All essential headers present
  - Basic CSP configured
  - HSTS enabled

- **B**: Good security
  - Most essential headers present
  - May be missing CSP or HSTS

- **C-F**: Needs improvement
  - Missing critical headers
  - Vulnerable to common attacks

## Production Deployment Checklist

Before deploying to production:

- [ ] **HTTPS Enabled**: All traffic over TLS 1.2+
- [ ] **Essential Headers**: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
- [ ] **Referrer Policy**: Configured to prevent information leakage
- [ ] **CSP Configured**: Start with report-only mode, then enforce
- [ ] **HSTS Enabled**: After confirming HTTPS stability
- [ ] **Permissions Policy**: Disable unused browser features
- [ ] **Headers Tested**: Use online scanners (aim for A or A+)
- [ ] **SSL/TLS Strong**: TLS 1.2+ only, strong ciphers
- [ ] **Server Header Hidden**: Don't expose server version
- [ ] **Monitoring Setup**: Track CSP violations and security issues

## Common Mistakes to Avoid

### 1. CSP Too Strict
**Problem**: `default-src 'none'` breaks everything
**Solution**: Start with `default-src 'self'` and add exceptions as needed

### 2. HSTS Without HTTPS
**Problem**: Enabling HSTS before HTTPS works locks out users
**Solution**: Only enable HSTS after HTTPS is stable

### 3. Forgetting WebSocket in CSP
**Problem**: `connect-src 'self'` blocks WebSocket connections
**Solution**: Add `ws:` or `wss:` to `connect-src` if using WebSockets

### 4. Inline Scripts Blocked
**Problem**: CSP blocks `<script>` tags and `onclick` handlers
**Solution**:
- Use external `.js` files instead of inline scripts
- Add nonce or hash for required inline scripts
- Avoid `unsafe-inline` in production

### 5. Third-Party Resources Blocked
**Problem**: CSP blocks Google Fonts, CDN assets, analytics
**Solution**: Explicitly allow trusted domains in CSP

## Framework-Specific Considerations

### React + Vite
- Vite injects scripts using `unsafe-inline` by default in dev mode
- Production builds use hashed files, safer for CSP
- Test CSP with production build before deploying

### Next.js
- Built-in security headers support in `next.config.js`
- Automatic handling of `_next/` static assets
- Be careful with `unsafe-eval` if using dynamic imports

### Bolt (StackBlitz)
- WebContainer environments may have restrictions
- Test headers in actual deployment, not just preview

## Additional Resources

### Official Documentation
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Content Security Policy Reference](https://content-security-policy.com/)

### Tools
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [Security Headers Scanner](https://securityheaders.com/)
- [Report URI](https://report-uri.com/) - CSP violation reporting

### Further Reading
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Helmet.js](https://helmetjs.github.io/) - Security headers for Express/Node.js
- [HSTS Preload List](https://hstspreload.org/)

---

## Quick Start: Minimal Secure Configuration

If you're deploying to production and just need the basics:

### nginx Minimal Config
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

### Caddy Minimal Config
```caddy
header {
    X-Frame-Options "SAMEORIGIN"
    X-Content-Type-Options "nosniff"
    X-XSS-Protection "1; mode=block"
    Referrer-Policy "strict-origin-when-cross-origin"
}
```

This provides **Grade B security** - good enough for most applications. For Grade A/A+, add CSP and HSTS after testing.

---

**Document Version**: 1.0.0
**Last Updated**: January 15, 2025
**Maintained by**: vibe-to-docker Security Team
