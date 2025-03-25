#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Regular expression to match import statements with relative paths without extensions
const importRegex = /import\s+(?:{[^}]+}|\*\s+as\s+[^;]+|[^;{}]+)\s+from\s+['"](\.[^'"]+)['"]/g;

async function processFile(filePath) {
  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    
    // Check if this is a TypeScript file and contains imports
    if (!filePath.endsWith('.ts') || !content.includes('import')) {
      return;
    }
    
    // Replace all relative imports without extensions to include .js
    const newContent = content.replace(importRegex, (match, importPath) => {
      // Skip if the import already has an extension
      if (path.extname(importPath)) {
        return match;
      }
      
      // Add .js extension to relative import paths
      return match.replace(`'${importPath}'`, `'${importPath}.js'`)
                 .replace(`"${importPath}"`, `"${importPath}.js"`);
    });
    
    // Only write to the file if changes were made
    if (content !== newContent) {
      console.log(`Fixed imports in ${filePath}`);
      await fs.promises.writeFile(filePath, newContent, 'utf8');
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

async function processDirectory(dirPath) {
  try {
    const entries = await fs.promises.readdir(dirPath);
    
    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry);
      const stats = await fs.promises.stat(entryPath);
      
      if (stats.isDirectory()) {
        // Skip node_modules and dist directories
        if (entry !== 'node_modules' && entry !== 'dist') {
          await processDirectory(entryPath);
        }
      } else if (stats.isFile()) {
        await processFile(entryPath);
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dirPath}:`, error);
  }
}

// Start processing from the src directory
processDirectory(path.join(__dirname, 'src'))
  .then(() => console.log('Finished adding .js extensions to imports'))
  .catch(error => console.error('Error:', error)); 