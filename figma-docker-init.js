#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_DIR = path.join(__dirname, 'templates');

// Color codes for terminal output
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function showHelp() {
  log(`
${colors.bold}${colors.blue}Figma Docker Init${colors.reset}
Quick-start Docker setup for Figma-exported React/Vite/TypeScript projects

${colors.bold}Usage:${colors.reset}
  figma-docker-init [template] [options]

${colors.bold}Templates:${colors.reset}
  basic      Basic Docker setup with minimal configuration
  ui-heavy   Optimized for UI-heavy applications with advanced caching

${colors.bold}Options:${colors.reset}
  -h, --help     Show this help message
  -v, --version  Show version number
  --list         List available templates

${colors.bold}Examples:${colors.reset}
  figma-docker-init basic
  figma-docker-init ui-heavy
  figma-docker-init --list
`);
}

function showVersion() {
  const packagePath = path.join(__dirname, 'package.json');
  if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    log(`figma-docker-init v${pkg.version}`, colors.blue);
  } else {
    log('figma-docker-init v1.0.0', colors.blue);
  }
}

function listTemplates() {
  log(`${colors.bold}Available Templates:${colors.reset}\n`);
  
  if (!fs.existsSync(TEMPLATES_DIR)) {
    log('No templates directory found!', colors.red);
    return;
  }

  const templates = fs.readdirSync(TEMPLATES_DIR).filter(item => {
    return fs.statSync(path.join(TEMPLATES_DIR, item)).isDirectory();
  });

  if (templates.length === 0) {
    log('No templates available', colors.yellow);
    return;
  }

  templates.forEach(template => {
    const templatePath = path.join(TEMPLATES_DIR, template);
    const dockerMdPath = path.join(templatePath, 'DOCKER.md');
    
    log(`${colors.green}${template}${colors.reset}`, colors.green);
    
    if (fs.existsSync(dockerMdPath)) {
      const content = fs.readFileSync(dockerMdPath, 'utf8');
      const descMatch = content.match(/^# (.+)$/m);
      if (descMatch) {
        log(`  ${descMatch[1]}`);
      }
    }
    
    const files = fs.readdirSync(templatePath);
    log(`  Files: ${files.join(', ')}\n`);
  });
}

function copyTemplate(templateName, targetDir = '.') {
  const templatePath = path.join(TEMPLATES_DIR, templateName);
  
  if (!fs.existsSync(templatePath)) {
    log(`Template "${templateName}" not found!`, colors.red);
    log('Available templates:', colors.yellow);
    listTemplates();
    process.exit(1);
  }

  log(`${colors.bold}Setting up Docker configuration using "${templateName}" template...${colors.reset}`);
  
  const files = fs.readdirSync(templatePath);
  let copiedFiles = [];
  let skippedFiles = [];

  files.forEach(file => {
    const sourcePath = path.join(templatePath, file);
    const targetPath = path.join(targetDir, file);
    
    if (fs.existsSync(targetPath)) {
      log(`  ${colors.yellow}Skipped${colors.reset} ${file} (already exists)`);
      skippedFiles.push(file);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
      log(`  ${colors.green}Created${colors.reset} ${file}`);
      copiedFiles.push(file);
    }
  });

  log(`\n${colors.bold}${colors.green}Setup Complete!${colors.reset}`);
  log(`${colors.bold}Files created:${colors.reset} ${copiedFiles.length}`);
  log(`${colors.bold}Files skipped:${colors.reset} ${skippedFiles.length}`);
  
  if (copiedFiles.length > 0) {
    log(`\n${colors.bold}Next Steps:${colors.reset}`);
    log(`1. Review and customize the generated Docker configuration files`);
    log(`2. Update environment variables in .env.example and rename to .env`);
    log(`3. Build and run your Docker container:`);
    log(`   ${colors.blue}docker-compose up --build${colors.reset}`);
    
    if (fs.existsSync(path.join(targetDir, 'DOCKER.md'))) {
      log(`4. Read DOCKER.md for detailed documentation and advanced usage`);
    }
  }

  if (skippedFiles.length > 0) {
    log(`\n${colors.yellow}Note: Some files were skipped because they already exist.${colors.reset}`);
    log(`${colors.yellow}Remove existing files if you want to regenerate them.${colors.reset}`);
  }
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    showHelp();
    return;
  }
  
  if (args.includes('-v') || args.includes('--version')) {
    showVersion();
    return;
  }
  
  if (args.includes('--list')) {
    listTemplates();
    return;
  }
  
  const templateName = args[0];
  
  if (!templateName) {
    log('Please specify a template name!', colors.red);
    showHelp();
    process.exit(1);
  }
  
  // Validate current directory has package.json (basic sanity check)
  if (!fs.existsSync('./package.json')) {
    log(`${colors.yellow}Warning: No package.json found in current directory.${colors.reset}`);
    log(`${colors.yellow}Make sure you're in the root of your project.${colors.reset}\n`);
  }
  
  copyTemplate(templateName);
}

// Error handling
process.on('uncaughtException', (error) => {
  log(`${colors.red}Error: ${error.message}${colors.reset}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`${colors.red}Unhandled Rejection: ${reason}${colors.reset}`);
  process.exit(1);
});

main();