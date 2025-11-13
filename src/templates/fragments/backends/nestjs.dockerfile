# NestJS Backend Fragment
# Composable Dockerfile fragment for NestJS backend
# Insertion Point: BACKEND_SETUP

# Install NestJS CLI globally
RUN npm install -g @nestjs/cli

# Install PM2 for process management
RUN npm install -g pm2

# NestJS environment variables
ENV PORT={{PORT:-3000}}
ENV NODE_ENV=production

# Build NestJS application
RUN npm run build

# Create process manager ecosystem file
RUN echo '{\n\
  "apps": [{\n\
    "name": "{{PROJECT_NAME}}-api",\n\
    "script": "dist/main.js",\n\
    "instances": 2,\n\
    "exec_mode": "cluster",\n\
    "env": {\n\
      "NODE_ENV": "production",\n\
      "PORT": "{{PORT:-3000}}"\n\
    },\n\
    "error_file": "/var/log/pm2/error.log",\n\
    "out_file": "/var/log/pm2/out.log",\n\
    "log_date_format": "YYYY-MM-DD HH:mm:ss Z",\n\
    "merge_logs": true,\n\
    "max_memory_restart": "1G"\n\
  }]\n\
}' > ecosystem.config.json

# Create log directory
RUN mkdir -p /var/log/pm2 && chown -R node:node /var/log/pm2

# Post-build validation for NestJS
RUN test -f dist/main.js || { echo "Error: NestJS build failed - dist/main.js not found"; exit 1; }

# Health check for NestJS
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:{{PORT:-3000}}/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start NestJS with PM2
CMD ["pm2-runtime", "start", "ecosystem.config.json"]
