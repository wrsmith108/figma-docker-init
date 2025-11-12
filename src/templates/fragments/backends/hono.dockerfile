# Hono Backend Fragment
# Composable Dockerfile fragment for Hono backend
# Insertion Point: BACKEND_SETUP

# Hono environment variables
ENV PORT={{PORT:-3000}}
ENV NODE_ENV=production

# Hono can run on multiple runtimes - Node.js, Bun, Deno
# Using Node.js runtime by default
RUN npm install --production || true

# Create startup script for Hono
RUN echo '#!/bin/sh\n\
node {{SERVER_ENTRY:-server.js}}' > /app/start.sh && \
    chmod +x /app/start.sh

# Health check for Hono
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:{{PORT:-3000}}/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start Hono server
CMD ["/app/start.sh"]
