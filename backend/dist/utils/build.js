"use strict";
/**
 * This script performs pre-build tasks for the TypeScript application.
 * It's intended to be run before the TypeScript compiler.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Ensures the dist directory exists
const ensureDistDir = () => {
    const distPath = path_1.default.join(__dirname, '../../dist');
    if (!fs_1.default.existsSync(distPath)) {
        fs_1.default.mkdirSync(distPath, { recursive: true });
        console.log('Created dist directory');
    }
};
// Copy any non-TypeScript files to the dist directory if needed
const copyNonTypeScriptFiles = () => {
    // Example: Copy .env.example to dist if it exists
    const envExamplePath = path_1.default.join(__dirname, '../../.env.example');
    const destEnvPath = path_1.default.join(__dirname, '../../dist/.env.example');
    if (fs_1.default.existsSync(envExamplePath)) {
        fs_1.default.copyFileSync(envExamplePath, destEnvPath);
        console.log('Copied .env.example to dist');
    }
    // Add other files to copy as needed
};
const main = () => {
    console.log('Running pre-build tasks...');
    ensureDistDir();
    copyNonTypeScriptFiles();
    console.log('Pre-build tasks completed');
};
// Execute the script
main();
