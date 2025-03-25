// Simple script to ensure the cache directory exists
const fs = require('fs');
const path = require('path');

// Create cache directory
const cacheDir = path.join(process.cwd(), 'cache');
if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
    console.log(`Created cache directory at ${cacheDir}`);
} else {
    console.log(`Cache directory already exists at ${cacheDir}`);
}

// Create dist/utils directory if it doesn't exist
const distUtilsDir = path.join(process.cwd(), 'dist', 'utils');
if (!fs.existsSync(distUtilsDir)) {
    fs.mkdirSync(distUtilsDir, { recursive: true });
    console.log(`Created dist/utils directory at ${distUtilsDir}`);
} else {
    console.log(`dist/utils directory already exists at ${distUtilsDir}`);
}

// The cache module content
const cacheModuleContent = `
import path from 'path';
import fs from 'fs';

// Log when this module is loaded to help with debugging
console.log('Cache module loaded at', new Date().toISOString());

/**
 * Get a normalized company ID from company name
 */
export function getCompanyId(companyName) {
  return companyName.toLowerCase().replace(/\\s+/g, '-');
}

/**
 * Get the cache directory path for a company
 */
export function getCacheDirectory(companyId) {
  const cachePath = path.join(process.cwd(), 'cache', companyId);
  
  // Create cache directory if it doesn't exist
  if (!fs.existsSync(cachePath)) {
    fs.mkdirSync(cachePath, { recursive: true });
    console.log(\`Created cache directory for \${companyId}\`);
  }
  
  return cachePath;
}

/**
 * Get the full path to a specific cache file
 */
export function getCachePath(companyId, step) {
  return path.join(getCacheDirectory(companyId), \`\${step}.json\`);
}
`;

// Create all possible cache file variants to ensure compatibility
const cacheFileVariants = [
    { path: path.join(distUtilsDir, 'cache.js'), name: 'cache.js' },
    { path: path.join(distUtilsDir, 'cache.mjs'), name: 'cache.mjs' },
    { path: path.join(distUtilsDir, 'cache'), name: 'cache (no extension)' },
    // Create files in both src and dist to ensure availability
    { path: path.join(process.cwd(), 'src', 'utils', 'cache.js'), name: 'src/utils/cache.js' },
    { path: path.join(process.cwd(), 'src', 'utils', 'cache.mjs'), name: 'src/utils/cache.mjs' },
];

// Create the src/utils directory if needed
const srcUtilsDir = path.join(process.cwd(), 'src', 'utils');
if (!fs.existsSync(srcUtilsDir)) {
    fs.mkdirSync(srcUtilsDir, { recursive: true });
    console.log(`Created src/utils directory at ${srcUtilsDir}`);
}

// Create all cache file variants
cacheFileVariants.forEach(variant => {
    try {
        // Ensure parent directory exists
        const parentDir = path.dirname(variant.path);
        if (!fs.existsSync(parentDir)) {
            fs.mkdirSync(parentDir, { recursive: true });
            console.log(`Created directory ${parentDir}`);
        }
        
        // Write the cache module content
        fs.writeFileSync(variant.path, cacheModuleContent);
        console.log(`Created ${variant.name} at ${variant.path}`);
    } catch (error) {
        console.error(`Error creating ${variant.name}:`, error);
    }
});

// Generate an index.js file that re-exports from cache.js for CJS compatibility
const indexPath = path.join(distUtilsDir, 'index.js');
const indexContent = `
// Re-export from cache.js for CommonJS compatibility
export * from './cache.js';
`;

try {
    fs.writeFileSync(indexPath, indexContent);
    console.log(`Created utils/index.js at ${indexPath}`);
} catch (error) {
    console.error(`Error creating utils/index.js:`, error);
}

console.log('Finished ensuring cache directory and utils setup.');
console.log('Cache files created in multiple formats to ensure ESM compatibility.'); 