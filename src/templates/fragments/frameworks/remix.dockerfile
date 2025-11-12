# Remix Framework Fragment
# Composable Dockerfile fragment for Remix applications
# Insertion Point: FRAMEWORK_BUILD_STEPS

# Remix environment variables
ENV NODE_ENV=production
ENV REMIX_DEV_SERVER_WS_PORT=8002

# Build optimization for Remix
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Remix build step
RUN npm run build

# Post-build validation for Remix
RUN test -d build || { echo "Error: Remix build failed - build directory not found"; exit 1; }

# Copy Remix server files
RUN if [ -f "build/index.js" ]; then \
    echo "Remix server build successful"; \
    fi
