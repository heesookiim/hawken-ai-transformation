import path from 'path';
import fs from 'fs';
/**
 * Get a normalized company ID from company name
 */
export function getCompanyId(companyName) {
    return companyName.toLowerCase().replace(/\s+/g, '-');
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
    return path.join(getCacheDirectory(companyId), `${step}.json`);
}
