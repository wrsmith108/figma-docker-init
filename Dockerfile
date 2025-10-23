# Multi-stage Dockerfile for React/Vite/TypeScript projects with heavy UI dependencies
# Optimized for Figma-exported projects with Radix UI, Tailwind, and complex component libraries
# Based on proven patterns from resolved Figma-to-Docker workflows

# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set build arguments
ARG NODE_ENV=development

# Add metadata labels
LABEL maintainer="figma-docker-init Team"
LABEL description="React/Vite/TypeScript project with UI libraries"
LABEL version="1.0.0"
LABEL figma-docker-init="ui-heavy"

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy package files first for better layer caching
COPY package*.json ./

# Install ALL dependencies (including devDependencies) for build stage
# This is critical for Figma projects with complex UI library dependencies
RUN npm ci --silent && \
    npm cache clean --force

# Copy source code (excluding files in .dockerignore)
COPY . .

# Build the application (as root to have access to node_modules)
# Output directory: dist
RUN npm run build

# Change ownership to non-root user
RUN chown -R nextjs:nodejs /app
USER nextjs

# Stage 2: Production stage with Nginx
FROM nginx:alpine AS production

# Add metadata labels
LABEL maintainer="figma-docker-init Team"
LABEL description="Production nginx server for React SPA with UI libraries"
LABEL stage="production"

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create nginx user and group if they don't exist
RUN addgroup -g 101 -S nginx || true && \
    adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx || true

# Remove default nginx configuration
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration for SPA routing
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression (important for large UI bundles)
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
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
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

# Ensure proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Create nginx cache, log, and run directories with proper permissions
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run/nginx && \
    chown -R nginx:nginx /var/cache/nginx /var/log/nginx /var/run/nginx

# Keep running as root for nginx in container (standard practice)
# USER nginx

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Use dumb-init as entrypoint for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start nginx in foreground mode
CMD ["nginx", "-g", "daemon off;"]