# Vue Framework Fragment
# Composable Dockerfile fragment for Vue.js applications
# Insertion Point: FRAMEWORK_BUILD_STEPS

# Install Vue-specific build dependencies
RUN npm install --save-dev @vitejs/plugin-vue || true

# Vue environment variables
ENV VITE_APP_TITLE={{APP_TITLE}}
ENV VUE_APP_VERSION={{VERSION}}

# Build optimization for Vue
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Vue build step with production optimizations
RUN npm run build -- --mode production

# Post-build validation for Vue
RUN test -f {{BUILD_OUTPUT_DIR}}/index.html || { echo "Error: Vue build failed - index.html not found"; exit 1; }
