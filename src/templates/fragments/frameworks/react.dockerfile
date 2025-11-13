# React Framework Fragment
# Composable Dockerfile fragment for React applications
# Insertion Point: FRAMEWORK_BUILD_STEPS

# Install React-specific build dependencies
RUN npm install --save-dev @vitejs/plugin-react || true

# React environment variables
ENV VITE_APP_TITLE={{APP_TITLE}}
ENV REACT_APP_VERSION={{VERSION}}

# Build optimization for React
ENV NODE_OPTIONS="--max-old-space-size=4096"

# React build step with production optimizations
RUN npm run build -- --mode production

# Post-build validation for React
RUN test -f {{BUILD_OUTPUT_DIR}}/index.html || { echo "Error: React build failed - index.html not found"; exit 1; }
