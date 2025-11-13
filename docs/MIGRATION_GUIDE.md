# Migration Guide: Global to Per-Project Installation

## Overview

Version 2.0.0 introduces a new per-project installation architecture where Docker configurations are stored in a `.vibe-docker/` directory within each project. This guide helps you migrate from the global installation pattern to the new per-project structure.

## What Changed?

### Before (v1.x)
```
your-project/
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── .dockerignore
├── .env.example
└── DOCKER.md
```

### After (v2.0.0+)
```
your-project/
├── .vibe-docker/          # New centralized directory
│   ├── config.json
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── nginx.conf
│   ├── .dockerignore
│   ├── .env.example
│   └── DOCKER.md
├── package.json
└── [your project files]
```

## Benefits of Per-Project Installation

1. **Better Organization**: All Docker-related files in one place
2. **Multi-Project Support**: Different projects can have different configurations
3. **Version Control**: Easy to track changes to Docker configuration
4. **Portability**: Simple to share and clone projects with Docker setup
5. **No Conflicts**: No file name collisions with project files

## Migration Steps

### Step 1: Backup Existing Configuration

Before migrating, backup your current Docker configuration:

```bash
# Create backup directory
mkdir -p docker-backup

# Backup existing files
cp Dockerfile docker-backup/
cp docker-compose.yml docker-backup/
cp nginx.conf docker-backup/ 2>/dev/null || true
cp .dockerignore docker-backup/ 2>/dev/null || true
cp .env.example docker-backup/ 2>/dev/null || true
cp DOCKER.md docker-backup/ 2>/dev/null || true
```

### Step 2: Remove Old Configuration Files

```bash
# Remove old Docker files from project root
rm -f Dockerfile
rm -f docker-compose.yml
rm -f nginx.conf
rm -f .dockerignore
rm -f .env.example
rm -f DOCKER.md
```

### Step 3: Install New Configuration

Run the tool with your preferred template:

```bash
# For basic template
vibe-to-docker basic

# For UI-heavy template
vibe-to-docker ui-heavy
```

This will create the new `.vibe-docker/` directory structure.

### Step 4: Migrate Custom Configuration

If you had customized your Docker configuration, migrate those changes:

```bash
# Compare your backup with new files
diff docker-backup/Dockerfile .vibe-docker/Dockerfile
diff docker-backup/docker-compose.yml .vibe-docker/docker-compose.yml
diff docker-backup/nginx.conf .vibe-docker/nginx.conf
```

Apply your custom changes to the new files in `.vibe-docker/`.

### Step 5: Update Environment Variables

If you had a `.env` file (not `.env.example`):

```bash
# Copy your environment variables to the new location
cp .env .vibe-docker/.env

# Or manually update .vibe-docker/.env.example and rename it
cd .vibe-docker
mv .env.example .env
# Edit .env with your values
```

### Step 6: Update Scripts and CI/CD

Update any scripts or CI/CD pipelines that reference Docker files:

**Before:**
```bash
docker-compose up --build
docker build -f Dockerfile .
```

**After:**
```bash
docker-compose -f .vibe-docker/docker-compose.yml up --build
docker build -f .vibe-docker/Dockerfile .
```

Or use the new npm scripts (automatically added to `package.json`):
```bash
npm run docker:build
npm run docker:up
npm run docker:down
```

### Step 7: Update .gitignore

Update your `.gitignore` to include the new structure:

```gitignore
# Docker configuration (if you want to ignore environment files)
.vibe-docker/.env
.vibe-docker/*.log

# Keep the configuration in version control
!.vibe-docker/config.json
!.vibe-docker/Dockerfile
!.vibe-docker/docker-compose.yml
!.vibe-docker/nginx.conf
!.vibe-docker/.dockerignore
!.vibe-docker/.env.example
```

### Step 8: Test the Migration

Test your migrated configuration:

```bash
# Build and run containers
npm run docker:build
npm run docker:up

# Or manually
cd .vibe-docker
docker-compose up --build

# Verify your application runs correctly
curl http://localhost:3000  # Or your configured port
```

### Step 9: Clean Up Backup

Once everything works correctly:

```bash
# Remove backup directory
rm -rf docker-backup
```

## Automated Migration Script

For convenience, here's an automated migration script:

```bash
#!/bin/bash
# migrate-to-v2.sh

set -e

echo "🔄 Migrating vibe-to-docker to v2.0.0..."

# Check if old files exist
if [ ! -f "Dockerfile" ] && [ ! -f "docker-compose.yml" ]; then
  echo "❌ No existing Docker configuration found"
  exit 1
fi

# Backup
echo "📦 Creating backup..."
mkdir -p docker-backup
cp Dockerfile docker-backup/ 2>/dev/null || true
cp docker-compose.yml docker-backup/ 2>/dev/null || true
cp nginx.conf docker-backup/ 2>/dev/null || true
cp .dockerignore docker-backup/ 2>/dev/null || true
cp .env.example docker-backup/ 2>/dev/null || true
cp .env docker-backup/ 2>/dev/null || true
cp DOCKER.md docker-backup/ 2>/dev/null || true

# Detect template type
TEMPLATE="basic"
if grep -q "gzip" Dockerfile 2>/dev/null || grep -q "gzip" docker-compose.yml 2>/dev/null; then
  TEMPLATE="ui-heavy"
fi

echo "📋 Detected template: $TEMPLATE"

# Remove old files
echo "🗑️  Removing old configuration..."
rm -f Dockerfile docker-compose.yml nginx.conf .dockerignore .env.example DOCKER.md

# Install new configuration
echo "📥 Installing new configuration..."
vibe-to-docker $TEMPLATE

# Migrate .env if it exists
if [ -f "docker-backup/.env" ]; then
  echo "🔐 Migrating environment variables..."
  cp docker-backup/.env .vibe-docker/.env
fi

# Test build
echo "🧪 Testing new configuration..."
cd .vibe-docker
docker-compose config > /dev/null

echo "✅ Migration complete!"
echo "📖 Review changes in .vibe-docker/ directory"
echo "🗑️  Remove docker-backup/ when satisfied"
```

Save this script and run it:

```bash
chmod +x migrate-to-v2.sh
./migrate-to-v2.sh
```

## Troubleshooting

### Issue: Docker commands not working

**Problem**: Commands like `docker-compose up` fail after migration.

**Solution**: Use the new file paths:
```bash
docker-compose -f .vibe-docker/docker-compose.yml up
```

Or use npm scripts:
```bash
npm run docker:up
```

### Issue: Environment variables not loaded

**Problem**: Application can't read environment variables.

**Solution**:
1. Ensure `.env` file is in `.vibe-docker/` directory
2. Update `docker-compose.yml` to reference correct env file path
3. Verify `env_file` directive points to correct location

### Issue: Build context errors

**Problem**: Docker build can't find project files.

**Solution**: Update Dockerfile context in `docker-compose.yml`:
```yaml
services:
  app:
    build:
      context: ..  # Build from project root
      dockerfile: .vibe-docker/Dockerfile
```

### Issue: Port conflicts

**Problem**: Ports already in use after migration.

**Solution**: Check `.vibe-docker/config.json` for assigned ports:
```json
{
  "ports": {
    "dev": 3000,
    "prod": 8080,
    "nginx": 8888
  }
}
```

Update `docker-compose.yml` if needed.

### Issue: Custom modifications lost

**Problem**: Your customizations didn't carry over.

**Solution**: Compare backup with new files:
```bash
diff docker-backup/Dockerfile .vibe-docker/Dockerfile
```

Manually apply your customizations to new files.

## Rollback Instructions

If you need to rollback to v1.x:

```bash
# Restore backup
cp docker-backup/* .

# Remove new directory
rm -rf .vibe-docker

# Downgrade package
npm install -g vibe-to-docker@1.1.0
```

## Getting Help

If you encounter issues during migration:

1. Check the [troubleshooting guide](./TROUBLESHOOTING.md)
2. Review [API documentation](./API.md)
3. Open an issue on [GitHub](https://github.com/wrsmith108/vibe-to-docker/issues)
4. Include your backup files and error messages

## Next Steps

After successful migration:

1. ✅ Test your application thoroughly
2. ✅ Update documentation for your team
3. ✅ Commit changes to version control
4. ✅ Update CI/CD pipelines
5. ✅ Remove backup directory

## Version Compatibility

- **v2.0.0+**: Uses `.vibe-docker/` directory structure
- **v1.x**: Uses root-level configuration files
- **Migration**: Supported from v1.0.0 to v2.0.0+

## See Also

- [API Documentation](./API.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [Architecture Overview](./ARCHITECTURE.md)
