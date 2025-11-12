# Svelte/SvelteKit Framework Fragment
# Composable Dockerfile fragment for Svelte and SvelteKit applications
# Insertion Point: FRAMEWORK_BUILD_STEPS

# Install Svelte-specific build dependencies
RUN npm install --save-dev @sveltejs/vite-plugin-svelte || true

# Svelte environment variables
ENV VITE_APP_TITLE={{APP_TITLE}}
ENV PUBLIC_VERSION={{VERSION}}

# Build optimization for Svelte
ENV NODE_OPTIONS="--max-old-space-size=4096"

# SvelteKit or Svelte build step
RUN npm run build

# Post-build validation for Svelte
RUN if [ -d "build" ]; then \
    test -f build/index.html || { echo "Error: Svelte build failed"; exit 1; }; \
    elif [ -d "{{BUILD_OUTPUT_DIR}}" ]; then \
    test -f {{BUILD_OUTPUT_DIR}}/index.html || { echo "Error: Svelte build failed"; exit 1; }; \
    fi
