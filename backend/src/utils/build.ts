/**
 * This script performs pre-build tasks for the TypeScript application.
 * It's intended to be run before the TypeScript compiler.
 */

import fs from 'fs';
import path from 'path';

// Ensures the dist directory exists
const ensureDistDir = (): void => {
  const distPath = path.join(__dirname, '../../dist');
  if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath, { recursive: true });
    console.log('Created dist directory');
  }
};

// Copy any non-TypeScript files to the dist directory if needed
const copyNonTypeScriptFiles = (): void => {
  // Example: Copy .env.example to dist if it exists
  const envExamplePath = path.join(__dirname, '../../.env.example');
  const destEnvPath = path.join(__dirname, '../../dist/.env.example');
  
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, destEnvPath);
    console.log('Copied .env.example to dist');
  }
  
  // Add other files to copy as needed
};

const main = (): void => {
  console.log('Running pre-build tasks...');
  ensureDistDir();
  copyNonTypeScriptFiles();
  console.log('Pre-build tasks completed');
};

// Execute the script
main();