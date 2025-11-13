# Express Backend Fragment
# Composable Dockerfile fragment for Express.js backend
# Insertion Point: BACKEND_SETUP

# Install PM2 for process management
RUN npm install -g pm2

# Express environment variables
ENV PORT={{PORT:-3000}}
ENV NODE_ENV=production

# Create process manager ecosystem file
RUN echo '{\n\
  "apps": [{\n\
    "name": "{{PROJECT_NAME}}-api",\n\
    "script": "{{SERVER_ENTRY:-server.js}}",\n\
    "instances": "max",\n\
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

# Health check for Express
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:{{PORT:-3000}}/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start Express with PM2
CMD ["pm2-runtime", "start", "ecosystem.config.json"]
