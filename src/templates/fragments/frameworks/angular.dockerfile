# Angular Framework Fragment
# Composable Dockerfile fragment for Angular applications
# Insertion Point: FRAMEWORK_BUILD_STEPS

# Install Angular CLI globally
RUN npm install -g @angular/cli@latest

# Angular environment variables
ENV NG_CLI_ANALYTICS=false
ENV NODE_ENV=production

# Build optimization for Angular
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Angular build step with production optimizations
RUN ng build --configuration production --output-path={{BUILD_OUTPUT_DIR}}

# Post-build validation for Angular
RUN test -f {{BUILD_OUTPUT_DIR}}/index.html || { echo "Error: Angular build failed - index.html not found"; exit 1; }
