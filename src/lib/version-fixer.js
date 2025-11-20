#!/usr/bin/env node

/**
 * Automated Version Fixer
 *
 * Automatically fixes common version issues:
 * - Angular version mismatches
 * - Node.js odd-numbered versions
 * - Dependency conflicts
 *
 * Uses child_process to run fix commands automatically
 */

import { spawn, execSync } from 'child_process';
import { runAllChecks } from './version-checker.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run a command and return promise
 */
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔧 Running: ${command} ${args.join(' ')}`);

    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Check if nvm is installed
 */
function isNvmInstalled() {
  try {
    execSync('command -v nvm', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Fix Node.js version to LTS
 */
async function fixNodeVersion() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔧 Fixing Node.js Version');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const currentVersion = process.version;
  const majorVersion = parseInt(currentVersion.split('.')[0].substring(1), 10);

  if (majorVersion % 2 === 0) {
    console.log(`✅ Node.js ${currentVersion} is already an LTS version`);
    return false; // No fix needed
  }

  console.log(`⚠️  Current: Node.js ${currentVersion} (odd-numbered, not LTS)`);
  console.log(`📦 Installing: Node.js v22.x (LTS)\n`);

  if (!isNvmInstalled()) {
    console.log('❌ nvm (Node Version Manager) not found');
    console.log('\n📖 Manual installation required:');
    console.log('   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash');
    console.log('   source ~/.zshrc  # or ~/.bash_profile');
    console.log('   nvm install 22');
    console.log('   nvm use 22\n');
    return false;
  }

  try {
    // Install Node.js v22 LTS
    await runCommand('nvm', ['install', '22']);
    await runCommand('nvm', ['use', '22']);
    await runCommand('nvm', ['alias', 'default', '22']);

    console.log('\n✅ Node.js v22 installed and set as default');
    console.log('⚠️  Please restart your terminal for changes to take effect');
    console.log('   Then run: npx vibe-to-docker fix-versions\n');

    return true;
  } catch (error) {
    console.error(`❌ Failed to install Node.js v22: ${error.message}`);
    return false;
  }
}

/**
 * Fix Angular version mismatches
 */
async function fixAngularVersions(angularResult) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔧 Fixing Angular Version Mismatch');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const { majorVersions } = angularResult;

  if (!majorVersions.build && !majorVersions.cli) {
    console.log('✅ No Angular version issues detected');
    return false;
  }

  // Determine target version (use build version if available, else core)
  const targetVersion = majorVersions.build || majorVersions.core;

  console.log(`📦 Current versions:`);
  console.log(`   @angular/core: ${angularResult.versions.core}`);
  if (angularResult.versions.build) {
    console.log(`   @angular/build: ${angularResult.versions.build}`);
  }
  if (angularResult.versions.cli) {
    console.log(`   @angular/cli: ${angularResult.versions.cli}`);
  }
  console.log(`\n🎯 Target version: Angular ${targetVersion}\n`);

  try {
    // Read current package.json
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

    // Update ALL Angular packages atomically (critical for v19+)
    console.log(`📝 Updating package.json with Angular ${targetVersion} packages...`);

    const angularPackages = [
      '@angular/animations',
      '@angular/common',
      '@angular/compiler',
      '@angular/core',
      '@angular/forms',
      '@angular/platform-browser',
      '@angular/platform-browser-dynamic',
      '@angular/router'
    ];

    const angularDevPackages = [
      '@angular/cli',
      '@angular/compiler-cli',
      '@angular-devkit/build-angular'
    ];

    // Update dependencies
    packageJson.dependencies = packageJson.dependencies || {};
    angularPackages.forEach(pkg => {
      if (packageJson.dependencies[pkg]) {
        packageJson.dependencies[pkg] = `^${targetVersion}.0.0`;
      }
    });

    // Update zone.js (Angular 19 requires ~0.15.0)
    if (targetVersion >= 19) {
      packageJson.dependencies['zone.js'] = '~0.15.0';
    }

    // Update devDependencies
    packageJson.devDependencies = packageJson.devDependencies || {};
    angularDevPackages.forEach(pkg => {
      if (packageJson.devDependencies[pkg]) {
        packageJson.devDependencies[pkg] = `^${targetVersion}.0.0`;
      }
    });

    // Update TypeScript (Angular 19 requires 5.6+)
    if (targetVersion >= 19 && packageJson.devDependencies['typescript']) {
      packageJson.devDependencies['typescript'] = '~5.6.2';
    }

    // Write updated package.json
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
    console.log('✅ package.json updated\n');

    // Clean install
    console.log('🧹 Cleaning node_modules and package-lock.json...');
    try {
      await fs.rm(path.join(projectRoot, 'node_modules'), { recursive: true, force: true });
      await fs.rm(path.join(projectRoot, 'package-lock.json'), { force: true });
      console.log('✅ Cleaned successfully\n');
    } catch (error) {
      console.log('⚠️  Clean up skipped (files may not exist)\n');
    }

    // Install with --legacy-peer-deps to handle peer dependency conflicts
    console.log('📦 Installing dependencies (this may take a few minutes)...');
    await runCommand('npm', ['install', '--legacy-peer-deps'], { cwd: projectRoot });

    console.log('\n✅ Angular updated successfully!');

    // Verify versions
    console.log('\n🔍 Verifying versions...');
    try {
      const output = execSync('npm list @angular/core @angular/build @angular/cli --depth=0', {
        encoding: 'utf-8'
      });
      console.log(output);
    } catch (error) {
      // npm list exits with 1 if there are issues, but still shows output
      console.log(error.stdout);
    }

    return true;
  } catch (error) {
    console.error(`\n❌ Failed to update Angular: ${error.message}`);
    console.log('\n📖 Manual fix command:');
    console.log(`   npx @angular/cli@latest update @angular/core@${targetVersion} @angular/cli@${targetVersion}`);
    return false;
  }
}

/**
 * Main auto-fix function
 */
export async function autoFixVersions(projectRoot = process.cwd()) {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║          VIBE-TO-DOCKER VERSION AUTO-FIX              ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log('🔍 Analyzing project for version issues...\n');

  // Run all checks
  const results = await runAllChecks(projectRoot);

  if (results.allWarnings.length === 0) {
    console.log('✅ No version issues detected. Your project is ready!\n');
    return { fixed: false, changes: [] };
  }

  console.log(`📊 Found ${results.allWarnings.length} issue(s) to fix:\n`);
  results.allWarnings.forEach((warning, index) => {
    const icon = warning.severity === 'error' ? '❌' : '⚠️';
    console.log(`${index + 1}. ${icon} ${warning.message}`);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const changes = [];

  // Fix Node.js version if needed
  const nodeWarnings = results.allWarnings.filter(w => w.type === 'node_version');
  if (nodeWarnings.length > 0) {
    const fixed = await fixNodeVersion();
    if (fixed) {
      changes.push('node_version');
    }
  }

  // Fix Angular versions if needed
  if (results.angular.isAngular && results.angular.warnings.length > 0) {
    const fixed = await fixAngularVersions(results.angular);
    if (fixed) {
      changes.push('angular_versions');
    }
  }

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (changes.length === 0) {
    console.log('⚠️  No automatic fixes were applied');
    console.log('   Some issues may require manual intervention\n');
  } else {
    console.log('✅ Applied the following fixes:');
    changes.forEach(change => {
      if (change === 'node_version') {
        console.log('   • Node.js version updated to v22 LTS');
      } else if (change === 'angular_versions') {
        console.log('   • Angular packages synchronized');
      }
    });
    console.log('');
  }

  console.log('🎯 Next steps:');
  if (changes.includes('node_version')) {
    console.log('   1. Restart your terminal');
    console.log('   2. Run: npx vibe-to-docker fix-versions (verify fix)');
  }
  console.log('   3. Run: npm start (test your application)');
  console.log('   4. Run: npx vibe-to-docker init --tool=bolt (if not done yet)\n');

  return { fixed: changes.length > 0, changes };
}

/**
 * CLI entry point
 */
async function main() {
  const projectRoot = process.argv[2] || process.cwd();

  try {
    await autoFixVersions(projectRoot);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
