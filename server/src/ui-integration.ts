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
  console.log('Current working directory:', process.cwd());

  // Try different potential paths for UI
  const possiblePaths = [
    // Heroku-specific paths (check these first in production)
    path.join(process.cwd(), 'ui'),
    path.join(process.cwd(), 'ui/.next/standalone'),
    // Standard local development paths
    path.join(projectRoot, 'ui'),
    // Alternative paths
    path.join(projectRoot, '..', 'ui'),
    path.join(process.cwd(), '..', 'ui'),
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
    // Log environment information to help diagnose the issue
    console.log('Environment variables:', {
      NODE_ENV: process.env.NODE_ENV,
      PWD: process.env.PWD
    });
    console.log('Directory contents at current working directory:');
    try {
      const dirContents = fs.readdirSync(process.cwd());
      console.log(dirContents);
    } catch (err) {
      console.error('Failed to read directory contents:', err);
    }
    return;
  }

  // Set up paths for UI files
  const uiPublicPath = path.join(uiPath, 'public');
  const uiNextPath = path.join(uiPath, '.next');
  
  // In production on Heroku, the standalone output might be in a different location
  const standalonePaths = [
    path.join(uiPath, '.next/standalone'),
    path.join(process.cwd(), 'ui/.next/standalone'),
    path.join(projectRoot, 'ui/.next/standalone')
  ];
  
  let uiStandalonePath = null;
  for (const standalonePath of standalonePaths) {
    if (fs.existsSync(standalonePath)) {
      uiStandalonePath = standalonePath;
      console.log('Found standalone build at:', uiStandalonePath);
      break;
    }
  }
  
  // Similarly, check multiple locations for static files
  const staticPaths = [
    path.join(uiPath, '.next/static'),
    path.join(process.cwd(), 'ui/.next/static'),
    path.join(projectRoot, 'ui/.next/static')
  ];
  
  let uiStaticPath = null;
  for (const staticPath of staticPaths) {
    if (fs.existsSync(staticPath)) {
      uiStaticPath = staticPath;
      console.log('Found static files at:', uiStaticPath);
      break;
    }
  }

  // Check for standalone build
  const hasStandaloneBuild = !!uiStandalonePath;
  
  // Log the availability of key directories
  console.log('UI paths diagnostics:');
  console.log('  UI public directory exists:', fs.existsSync(uiPublicPath));
  console.log('  UI Next.js build exists:', fs.existsSync(uiNextPath));
  console.log('  UI Standalone build exists:', hasStandaloneBuild);
  if (hasStandaloneBuild && uiStaticPath) {
    console.log('  UI Static build exists:', fs.existsSync(uiStaticPath));
  }

  // Attempt to serve from standalone build first if it exists (better for Heroku)
  if (hasStandaloneBuild && uiStandalonePath) {
    console.log('Using standalone Next.js build for serving UI');
    
    // Serve static files from the standalone build
    if (fs.existsSync(path.join(uiStandalonePath, 'public'))) {
      app.use(express.static(path.join(uiStandalonePath, 'public')));
      console.log('Serving public files from standalone build');
    }
    
    // Serve Next.js static assets
    if (uiStaticPath && fs.existsSync(uiStaticPath)) {
      app.use('/_next/static', express.static(uiStaticPath));
      console.log('Serving static assets from:', uiStaticPath);
    }
    
    // Check if pages directory exists in standalone build
    const pagesDir = path.join(uiStandalonePath, 'server/pages');
    if (fs.existsSync(pagesDir)) {
      console.log('Found pages directory for standalone build at:', pagesDir);
      
      // List the contents of the pages directory to help with debugging
      try {
        console.log('Pages directory contents:');
        const pagesDirContents = fs.readdirSync(pagesDir);
        console.log(pagesDirContents);
      } catch (err) {
        console.error('Failed to read pages directory contents:', err);
      }
    } else {
      console.warn('Pages directory not found at:', pagesDir);
    }
    
    // Set up the dashboard route
    app.get('/dashboard', (req, res) => {
      const indexPath = path.join(uiStandalonePath, 'server/pages/index.html');
      if (fs.existsSync(indexPath)) {
        console.log('Serving dashboard from:', indexPath);
        return res.sendFile(indexPath);
      }
      
      // Fallback to app directory if pages doesn't exist
      const appIndexPath = path.join(uiStandalonePath, 'server/app/index.html');
      if (fs.existsSync(appIndexPath)) {
        console.log('Serving dashboard from app directory:', appIndexPath);
        return res.sendFile(appIndexPath);
      }
      
      // Last resort - look for the file in the Next.js output
      if (fs.existsSync(uiNextPath)) {
        const nextIndexPath = path.join(uiNextPath, 'server/pages/index.html');
        if (fs.existsSync(nextIndexPath)) {
          console.log('Serving dashboard from Next.js output:', nextIndexPath);
          return res.sendFile(nextIndexPath);
        }
      }
      
      // If we can't find the file, return a debug page
      res.status(404).send(`
        <html>
          <head><title>UI Not Found</title></head>
          <body>
            <h1>Dashboard UI Not Found</h1>
            <p>The UI files could not be located. This is a configuration issue.</p>
            <p>Checked for UI at: ${uiStandalonePath}</p>
            <p>Current environment: ${process.env.NODE_ENV}</p>
          </body>
        </html>
      `);
    });
    
    // Handle dashboard routes with parameters
    app.get('/dashboard/*', (req, res) => {
      const pagePath = req.path.replace(/^\/dashboard\/?/, '');
      console.log('Requested dashboard path:', pagePath);
      
      // Try standalone pages directory first
      const htmlPath = path.join(uiStandalonePath, 'server/pages', pagePath, 'index.html');
      if (fs.existsSync(htmlPath)) {
        console.log('Serving page from:', htmlPath);
        return res.sendFile(htmlPath);
      }
      
      // Try app directory if available
      const appHtmlPath = path.join(uiStandalonePath, 'server/app', pagePath, 'index.html');
      if (fs.existsSync(appHtmlPath)) {
        console.log('Serving page from app directory:', appHtmlPath);
        return res.sendFile(appHtmlPath);
      }
      
      // If that fails, serve the index page to let client-side routing handle it
      const indexPath = path.join(uiStandalonePath, 'server/pages/index.html');
      if (fs.existsSync(indexPath)) {
        console.log('Falling back to index page for client-side routing');
        return res.sendFile(indexPath);
      }
      
      // Try app directory index
      const appIndexPath = path.join(uiStandalonePath, 'server/app/index.html');
      if (fs.existsSync(appIndexPath)) {
        console.log('Falling back to app directory index for client-side routing');
        return res.sendFile(appIndexPath);
      }
      
      // Last resort: return a message
      res.status(404).send(`
        <html>
          <head><title>UI Page Not Found</title></head>
          <body>
            <h1>Dashboard Page Not Found</h1>
            <p>The requested page could not be found. This could be a configuration issue.</p>
            <p>Requested path: ${pagePath}</p>
            <p>Looked for file at: ${htmlPath}</p>
          </body>
        </html>
      `);
    });
    
    // Override the root route to redirect to dashboard
    app.get('/', (req, res) => {
      res.redirect('/dashboard');
    });
    
    return; // Exit early as we've set up the standalone configuration
  }

  // Fall back to standard Next.js serving if standalone build not found
  console.log('Falling back to standard Next.js serving');
  
  // Only attempt to serve UI files if they exist
  if (fs.existsSync(uiPublicPath)) {
    // Serve UI public files
    app.use('/public', express.static(uiPublicPath));
    console.log('Serving public files from:', uiPublicPath);
  }

  if (fs.existsSync(uiNextPath)) {
    // Serve Next.js assets
    app.use('/_next', express.static(path.join(uiNextPath)));
    console.log('Serving Next.js assets from:', uiNextPath);
    
    // Set up the redirect from root to dashboard
    app.get('/', (req, res) => {
      res.redirect('/dashboard');
    });

    // Add a catch-all route handler for UI routes
    app.get('/dashboard*', (req, res) => {
      console.log('Handling dashboard request in standard mode');
      
      // First try to serve the specific page
      const pagePath = req.path.replace(/^\/dashboard\/?/, '');
      const htmlPath = path.join(uiNextPath, 'server', 'pages', pagePath, 'index.html');
      
      if (fs.existsSync(htmlPath)) {
        console.log('Serving page from:', htmlPath);
        return res.sendFile(htmlPath);
      }
      
      // If that fails, serve the index page to let client-side routing handle it
      const indexPath = path.join(uiNextPath, 'server', 'pages', 'index.html');
      if (fs.existsSync(indexPath)) {
        console.log('Falling back to index page for client-side routing');
        return res.sendFile(indexPath);
      }
      
      // Check app directory as a last resort
      const appIndexPath = path.join(uiNextPath, 'server', 'app/index.html');
      if (fs.existsSync(appIndexPath)) {
        console.log('Serving from app directory:', appIndexPath);
        return res.sendFile(appIndexPath);
      }
      
      // Last resort: return a message with debugging information
      res.status(404).send(`
        <html>
          <head><title>UI Files Not Found</title></head>
          <body>
            <h1>UI Files Not Found</h1>
            <p>The UI files could not be located. This is a configuration issue.</p>
            <p>Checked for Next.js build at: ${uiNextPath}</p>
            <p>Looked for file at: ${htmlPath}</p>
            <p>Tried index fallback at: ${indexPath}</p>
          </body>
        </html>
      `);
    });
  } else {
    console.warn('Next.js build directory not found at:', uiNextPath);
    
    // Set up a route to display configuration information if the build doesn't exist
    app.get('/dashboard*', (req, res) => {
      res.status(404).send(`
        <html>
          <head><title>Next.js Build Not Found</title></head>
          <body>
            <h1>Next.js Build Not Found</h1>
            <p>The Next.js build directory could not be found. Please ensure the Next.js app is properly built.</p>
            <p>Looked for Next.js build at: ${uiNextPath}</p>
            <p>Current working directory: ${process.cwd()}</p>
            <p>Project root: ${projectRoot}</p>
            <p>Environment: ${process.env.NODE_ENV}</p>
          </body>
        </html>
      `);
    });
  }
} 