// Simple script to ensure the cache directory exists
import fs from 'fs';
import path from 'path';

// Create cache directory in server root if it doesn't exist
const cacheDir = path.join(process.cwd(), 'cache');
if (!fs.existsSync(cacheDir)) {
  console.log('Creating cache directory...');
  fs.mkdirSync(cacheDir, { recursive: true });
}

// Create cache directory in dist if it doesn't exist
const distCacheDir = path.join(process.cwd(), 'dist', 'utils');
if (!fs.existsSync(distCacheDir)) {
  console.log('Creating dist/utils directory...');
  fs.mkdirSync(distCacheDir, { recursive: true });
}

// Ensure the cache.js file exists in dist/utils
const distCacheFile = path.join(distCacheDir, 'cache.js');
if (!fs.existsSync(distCacheFile)) {
  console.log('Cache file not found in dist, copying from src...');
  
  // Create a basic cache.js file with the essential functions
  const cacheContent = `
import path from 'path';
import fs from 'fs';

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

  fs.writeFileSync(distCacheFile, cacheContent);
  console.log('Cache file created successfully!');
}

console.log('Cache setup complete.'); 