import path from 'path';
import fs from 'fs';

// Log when this module is loaded to help with debugging
console.log('Cache module loaded');

/**
 * Get a normalized company ID from company name
 */
export function getCompanyId(companyName: string): string {
  return companyName.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Get the cache directory path for a company
 */
export function getCacheDirectory(companyId: string): string {
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
export function getCachePath(companyId: string, step: string): string {
  return path.join(getCacheDirectory(companyId), `${step}.json`);
} 