// Simple script to ensure the cache directory exists
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Check if dist/utils/cache.js exists, create it if not
const cacheJsPath = path.join(distUtilsDir, 'cache.js');
if (!fs.existsSync(cacheJsPath)) {
    const cacheJsContent = `import path from 'path';
import fs from 'fs';

// Log when this module is loaded to help with debugging
console.log('Cache module loaded');

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
    
    fs.writeFileSync(cacheJsPath, cacheJsContent);
    console.log(`Created cache.js at ${cacheJsPath}`);
} else {
    console.log(`cache.js already exists at ${cacheJsPath}`);
}

console.log('Finished ensuring cache directory and utils setup.'); 