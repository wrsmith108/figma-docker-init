# Next.js Framework Fragment
# Composable Dockerfile fragment for Next.js applications
# Insertion Point: FRAMEWORK_BUILD_STEPS

# Next.js environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build optimization for Next.js
ENV NEXT_SHARP_PATH=/app/node_modules/sharp

# Install sharp for image optimization
RUN npm install sharp || true

# Next.js build step with standalone output
RUN npm run build

# Post-build validation for Next.js
RUN test -d .next || { echo "Error: Next.js build failed - .next directory not found"; exit 1; }

# Copy Next.js standalone server files
RUN if [ -d .next/standalone ]; then \
    cp -r .next/standalone /app/standalone && \
    cp -r .next/static /app/standalone/.next/static && \
    cp -r public /app/standalone/public; \
    fi
