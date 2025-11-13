/**
 * Phase 2 Integration Example
 *
 * Demonstrates how to use TemplateComposer and EnvManager
 * with Phase 1 DetectorChain results
 */

import { TemplateComposer } from '../src/lib/template-composer.js';
import { EnvManager } from '../src/lib/env-manager.js';
import LovableDetector from '../src/detectors/lovable-detector.js';

/**
 * Example: Generate Docker files for a Lovable project
 */
async function generateDockerFilesForLovableProject(projectRoot) {
  console.log('Phase 2 Integration Example');
  console.log('===========================\n');

  // Step 1: Use Phase 1 detector to identify the project
  console.log('Step 1: Detect project type...');
  const detector = new LovableDetector(projectRoot);
  const detectionResult = await detector.detect();

  console.log(`Detected: ${detectionResult.tool || 'unknown'}`);
  console.log(`Confidence: ${(detectionResult.confidence * 100).toFixed(1)}%`);
  console.log(`Framework: ${detectionResult.metadata.framework}\n`);

  // Step 2: Use TemplateComposer to generate Dockerfile
  console.log('Step 2: Generate Dockerfile...');
  const composer = new TemplateComposer();

  const dockerfile = await composer.generateDockerfile({
    tool: detectionResult.tool || 'lovable',
    framework: detectionResult.metadata.framework,
    metadata: {
      nodeVersion: '20',
      port: '8080',
      buildCommand: 'npm run build',
      startCommand: 'npm start',
      installCommand: 'npm ci'
    }
  });

  console.log('Dockerfile generated successfully');
  console.log(`Lines: ${dockerfile.split('\n').length}\n`);

  // Step 3: Generate .dockerignore
  console.log('Step 3: Generate .dockerignore...');
  const dockerignore = await composer.generateDockerignore({
    tool: detectionResult.tool || 'lovable',
    additionalPatterns: [
      '*.log',
      '.env.local'
    ]
  });

  console.log('.dockerignore generated successfully');
  console.log(`Patterns: ${dockerignore.split('\n').filter(l => l.trim() && !l.startsWith('#')).length}\n`);

  // Step 4: Detect and manage environment variables
  console.log('Step 4: Detect environment variables...');
  const envManager = new EnvManager(projectRoot);

  await envManager.detectVariables({
    directories: ['src'],
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  });

  const stats = envManager.getStats();
  console.log(`Total variables: ${stats.total}`);
  console.log(`Build-time: ${stats.buildTime}`);
  console.log(`Runtime: ${stats.runtime}`);
  console.log(`Secrets: ${stats.secrets}\n`);

  // Step 5: Generate .env.example
  console.log('Step 5: Generate .env.example...');
  const envExample = envManager.generateEnvExample({
    includeComments: true,
    groupByType: true
  });

  console.log('.env.example generated successfully');
  console.log(`Variables: ${envExample.split('\n').filter(l => l.includes('=')).length}\n`);

  // Step 6: Validate environment variables
  console.log('Step 6: Validate environment variables...');
  const warnings = envManager.validateVariables();

  console.log(`Warnings: ${warnings.length}`);
  if (warnings.length > 0) {
    console.log('\nSecurity warnings:');
    warnings.forEach(w => {
      console.log(`  - [${w.severity}] ${w.message}`);
    });
  }

  console.log('\n===========================');
  console.log('Integration complete!');
  console.log('\nGenerated files ready for use:');
  console.log('- Dockerfile');
  console.log('- .dockerignore');
  console.log('- .env.example');

  return {
    detectionResult,
    dockerfile,
    dockerignore,
    envExample,
    stats,
    warnings
  };
}

// Example usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const projectRoot = process.argv[2] || process.cwd();

  try {
    await generateDockerFilesForLovableProject(projectRoot);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

export { generateDockerFilesForLovableProject };
