# Multi-stage Dockerfile for React/Vite/TypeScript projects with heavy UI dependencies
# Optimized for Figma-exported projects with Radix UI, Tailwind, and complex component libraries
# Based on proven patterns from resolved Figma-to-Docker workflows

# Stage 1: Dependencies stage - separate layer for better caching
FROM node:18-alpine AS deps

# Set working directory
WORKDIR /app

# Copy package files first for optimal layer caching
COPY package*.json ./

# Install dependencies only (production for smaller layer)
RUN npm ci --only=production --silent && \
    npm cache clean --force

# Stage 2: Build stage
FROM node:18-alpine AS builder

# Set build arguments
ARG NODE_ENV=production

# Add metadata labels
LABEL maintainer="{{PROJECT_NAME}} Team"
LABEL description="React/Vite/TypeScript project with UI libraries build stage"
LABEL version="1.0.0"
LABEL figma-docker-init="ui-heavy"

# Set working directory
WORKDIR /app

# Copy node_modules from deps stage for better caching
COPY --from=deps /app/node_modules ./node_modules

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies) for build stage
# This is critical for Figma projects with complex UI library dependencies
RUN npm ci --silent && \
    npm cache clean --force

# Copy source code (excluding files in .dockerignore)
COPY . .

# Build the application
# Output directory: {{BUILD_OUTPUT_DIR}}
RUN npm run build

# Stage 3: Production stage with Nginx
FROM nginx:1.25-alpine AS production

# Add metadata labels
LABEL maintainer="{{PROJECT_NAME}} Team"
LABEL description="Production nginx server for React SPA with UI libraries"
LABEL stage="production"

# Switch to root user for package installation
USER root

# Install dumb-init for proper signal handling and security updates
RUN apk add --no-cache dumb-init && \
    apk upgrade --no-cache

# Create nginx user and group if they don't exist
RUN addgroup -g 101 -S nginx || true && \
    adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx || true

# Remove default nginx configuration
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration for SPA routing with performance optimizations and SSL support
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # SSL configuration (certificates mounted at runtime)
    ssl_certificate /etc/ssl/certs/server.crt;
    ssl_certificate_key /etc/ssl/certs/server.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Performance optimizations
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 16M;

    # Gzip compression (important for large UI bundles)
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Cache static assets (CSS, JS, images from UI libraries)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    # Handle client-side routing (React Router)
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Prevent caching of index.html for dynamic content
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Metrics endpoint for monitoring
    location /metrics {
        access_log off;
        stub_status on;
        allow 127.0.0.1;
        allow ::1;
        deny all;
    }

    # Security: Hide nginx version
    server_tokens off;

    # Prevent access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

# Copy built application from builder stage
COPY --from=builder --chown=nginx:nginx /app/{{BUILD_OUTPUT_DIR}} /usr/share/nginx/html

# Create SSL certificate directory
RUN mkdir -p /etc/ssl/certs && \
    chown -R nginx:nginx /etc/ssl/certs

# Ensure proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Create nginx cache, log, and run directories with proper permissions
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run/nginx && \
    chown -R nginx:nginx /var/cache/nginx /var/log/nginx /var/run/nginx

# Switch to non-root user for security
USER nginx

# Expose ports 80 and 443
EXPOSE 80 443

# Enhanced health check with SSL support
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Use dumb-init as entrypoint for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start nginx in foreground mode
CMD ["nginx", "-g", "daemon off;"]