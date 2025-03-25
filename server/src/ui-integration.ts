import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Configure an Express app to serve the Next.js UI
 */
export function configureUIServing(app: express.Express) {
  // Determine environment
  const isProduction = process.env.NODE_ENV === 'production';
  console.log(`Configuring UI serving in ${isProduction ? 'production' : 'development'} mode`);

  // Calculate paths
  const projectRoot = path.resolve(__dirname, '../..');
  console.log('Project root:', projectRoot);

  // Try different potential paths for UI
  const possiblePaths = [
    // Standard local development paths
    path.join(projectRoot, 'ui'),
    // Heroku-specific paths
    path.join(projectRoot, '..', 'ui'),
    path.join(process.cwd(), 'ui'),
    // In case the structure is different
    path.join(process.cwd(), '..', 'ui'),
    // Special path for standalone Next.js builds
    path.join(process.cwd(), 'ui/.next/standalone')
  ];

  // Log all paths being checked
  console.log('Checking for UI in these locations:');
  possiblePaths.forEach((p, i) => console.log(`  [${i}] ${p} (exists: ${fs.existsSync(p)})`));

  // Find the first existing UI path
  let uiPath = null;
  for (const potentialPath of possiblePaths) {
    if (fs.existsSync(potentialPath)) {
      uiPath = potentialPath;
      console.log('Found UI directory at:', uiPath);
      break;
    }
  }

  if (!uiPath) {
    console.warn('Could not find UI directory in any of the expected locations');
    return;
  }

  // Set up paths for UI files
  const uiPublicPath = path.join(uiPath, 'public');
  const uiNextPath = path.join(uiPath, '.next');
  const uiStandalonePath = path.join(projectRoot, 'ui/.next/standalone');
  const uiStaticPath = path.join(projectRoot, 'ui/.next/static');

  // Check for standalone build
  const hasStandaloneBuild = fs.existsSync(uiStandalonePath);
  
  // Log the availability of key directories
  console.log('UI paths diagnostics:');
  console.log('  UI public directory exists:', fs.existsSync(uiPublicPath));
  console.log('  UI Next.js build exists:', fs.existsSync(uiNextPath));
  console.log('  UI Standalone build exists:', hasStandaloneBuild);
  if (hasStandaloneBuild) {
    console.log('  UI Static build exists:', fs.existsSync(uiStaticPath));
  }

  // Attempt to serve from standalone build first if it exists (better for Heroku)
  if (hasStandaloneBuild) {
    console.log('Using standalone Next.js build for serving UI');
    
    // Serve static files from the standalone build
    if (fs.existsSync(path.join(uiStandalonePath, 'public'))) {
      app.use(express.static(path.join(uiStandalonePath, 'public')));
    }
    
    // Serve Next.js static assets
    if (fs.existsSync(uiStaticPath)) {
      app.use('/_next/static', express.static(path.join(uiStaticPath)));
    }
    
    // Set up the dashboard route
    app.get('/dashboard', (req, res) => {
      res.sendFile(path.join(uiStandalonePath, 'server/pages/index.html'));
    });
    
    // Handle dashboard routes with parameters
    app.get('/dashboard/*', (req, res) => {
      const pagePath = req.path.replace(/^\/dashboard\/?/, '');
      const htmlPath = path.join(uiStandalonePath, 'server/pages', pagePath, 'index.html');
      
      if (fs.existsSync(htmlPath)) {
        return res.sendFile(htmlPath);
      }
      
      // If that fails, serve the index page to let client-side routing handle it
      const indexPath = path.join(uiStandalonePath, 'server/pages/index.html');
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      }
      
      // Last resort: return a message
      res.status(404).send('UI files not found. Please ensure the Next.js app is properly built.');
    });
    
    // Override the root route to redirect to dashboard
    app.get('/', (req, res) => {
      res.redirect('/dashboard');
    });
    
    return; // Exit early as we've set up the standalone configuration
  }

  // Fall back to standard Next.js serving if standalone build not found
  // Only attempt to serve UI files if they exist
  if (fs.existsSync(uiPublicPath)) {
    // Serve UI public files
    app.use('/public', express.static(uiPublicPath));
  }

  if (fs.existsSync(uiNextPath)) {
    // Serve Next.js assets
    app.use('/_next', express.static(path.join(uiNextPath, '_next')));
    
    // Set up the redirect from root to dashboard
    app.get('/', (req, res) => {
      res.redirect('/dashboard');
    });

    // Add a catch-all route handler for UI routes
    app.get('/dashboard*', (req, res) => {
      // First try to serve the specific page
      const pagePath = req.path.replace(/^\/dashboard\/?/, '');
      const htmlPath = path.join(uiNextPath, 'server', 'pages', pagePath, 'index.html');
      
      if (fs.existsSync(htmlPath)) {
        return res.sendFile(htmlPath);
      }
      
      // If that fails, serve the index page to let client-side routing handle it
      const indexPath = path.join(uiNextPath, 'server', 'pages', 'index.html');
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      }
      
      // Last resort: return a message
      res.status(404).send('UI files not found. Please ensure the Next.js app is properly built.');
    });
  }
} 