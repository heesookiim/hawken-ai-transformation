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
  const isHeroku = !!process.env.DYNO; // Heroku sets this env var
  console.log(`Configuring UI serving in ${isProduction ? 'production' : 'development'} mode, Heroku environment: ${isHeroku}`);

  // Calculate paths
  const projectRoot = path.resolve(__dirname, '../..');
  console.log('Project root:', projectRoot);
  console.log('Current working directory:', process.cwd());
  
  // Log more information about the file structure
  console.log('Current directory content:', fs.readdirSync(process.cwd()));
  console.log('Parent directory exists:', fs.existsSync(path.join(process.cwd(), '..')));
  if (fs.existsSync(path.join(process.cwd(), '..'))) {
    console.log('Parent directory content:', fs.readdirSync(path.join(process.cwd(), '..')));
  }
  console.log('UI directory exists:', fs.existsSync(path.join(process.cwd(), 'ui')));
  if (fs.existsSync(path.join(process.cwd(), 'ui'))) {
    console.log('UI directory content:', fs.readdirSync(path.join(process.cwd(), 'ui')));
    
    if (fs.existsSync(path.join(process.cwd(), 'ui/.next'))) {
      console.log('UI/.next directory content:', fs.readdirSync(path.join(process.cwd(), 'ui/.next')));
    }
  }

  // Try different potential paths for UI, prioritizing Heroku-specific paths in production
  const possiblePaths = [
    // Heroku paths with standalone output directly in app root (from our new copy command)
    process.cwd(),
    // Heroku-specific paths
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
      
      // Log content of the UI path to debug
      try {
        console.log('UI path content:', fs.readdirSync(uiPath));
      } catch (err) {
        console.error('Error reading UI path content:', err);
      }
      
      break;
    }
  }

  if (!uiPath) {
    console.warn('Could not find UI directory in any of the expected locations');
    // Log environment information to help diagnose the issue
    console.log('Environment variables:', {
      NODE_ENV: process.env.NODE_ENV,
      PWD: process.env.PWD,
      HOME: process.env.HOME,
      DYNO: process.env.DYNO
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

  // Now look for .next directory in multiple places
  const nextPaths = [
    path.join(uiPath, '.next'),  // Standard location inside UI path
    path.join(process.cwd(), '.next'),  // Root level .next (copied by our script)
    path.join(process.cwd(), 'ui/.next'),  // Alternate path
  ];

  let nextPath = null;
  console.log('Looking for Next.js build in these locations:');
  nextPaths.forEach((p, i) => console.log(`  [${i}] ${p} (exists: ${fs.existsSync(p)})`));

  for (const potentialNextPath of nextPaths) {
    if (fs.existsSync(potentialNextPath)) {
      nextPath = potentialNextPath;
      console.log('Found Next.js build at:', nextPath);
      try {
        console.log('Next.js build contents:', fs.readdirSync(nextPath));
      } catch (err) {
        console.error('Error reading Next.js build contents:', err);
      }
      break;
    }
  }

  // Check for standalone build locations (multiple possible paths)
  let standalonePath = null;
  const standalonePaths = [
    path.join(process.cwd(), 'server'),  // Directly in server folder (copied by our script)
    path.join(nextPath, 'standalone/server'),  // Inside .next/standalone/server
    path.join(nextPath, 'server'),  // Inside .next/server 
    path.join(uiPath, '.next/standalone/server'),  // In ui/.next/standalone/server
    path.join(process.cwd(), 'ui/.next/standalone/server'),  // Alternate path
  ].filter(Boolean); // Filter out null paths if nextPath was null
  
  console.log('Looking for standalone server in these locations:');
  standalonePaths.forEach((p, i) => console.log(`  [${i}] ${p} (exists: ${fs.existsSync(p)})`));
  
  for (const potentialStandalonePath of standalonePaths) {
    if (fs.existsSync(potentialStandalonePath)) {
      standalonePath = potentialStandalonePath;
      console.log('Found standalone server at:', standalonePath);
      break;
    }
  }
  
  // Now look for static files
  let staticPath = null;
  const staticPaths = [
    path.join(process.cwd(), '.next/static'),  // Root level .next/static (copied by our script)
    path.join(nextPath, 'static'),  // Inside nextPath/static
    path.join(uiPath, '.next/static'),  // Standard location
    path.join(process.cwd(), 'ui/.next/static'),  // Alternate path
  ].filter(Boolean);
  
  console.log('Looking for static files in these locations:');
  staticPaths.forEach((p, i) => console.log(`  [${i}] ${p} (exists: ${fs.existsSync(p)})`));
  
  for (const potentialStaticPath of staticPaths) {
    if (fs.existsSync(potentialStaticPath)) {
      staticPath = potentialStaticPath;
      console.log('Found static files at:', staticPath);
      break;
    }
  }
  
  // Set up paths for UI files based on what we found
  const uiPublicPath = path.join(uiPath, 'public');
  
  // Log the availability of key directories
  console.log('UI paths diagnostics:');
  console.log('  UI public directory exists:', fs.existsSync(uiPublicPath));
  console.log('  UI Next.js build exists:', !!nextPath);
  console.log('  UI Standalone server exists:', !!standalonePath);
  console.log('  UI Static files exist:', !!staticPath);
  
  // Serve static files - this is needed in all configurations
  if (staticPath) {
    app.use('/_next/static', express.static(staticPath));
    console.log('Serving static assets from:', staticPath);
  }
  
  if (fs.existsSync(uiPublicPath)) {
    app.use(express.static(uiPublicPath));
    console.log('Serving public files from:', uiPublicPath);
  }
  
  // Find pages directory for serving HTML files
  let pagesPath = null;
  const pagesPaths = [
    // Try different potential locations for the pages directory
    standalonePath ? path.join(standalonePath, 'pages') : null,
    nextPath ? path.join(nextPath, 'server/pages') : null,
    path.join(process.cwd(), 'server/pages'),  // Custom location from our script
  ].filter(Boolean);
  
  console.log('Looking for HTML pages in these locations:');
  pagesPaths.forEach((p, i) => console.log(`  [${i}] ${p} (exists: ${fs.existsSync(p)})`));
  
  for (const potentialPagesPath of pagesPaths) {
    if (fs.existsSync(potentialPagesPath)) {
      pagesPath = potentialPagesPath;
      console.log('Found HTML pages at:', pagesPath);
      try {
        console.log('Pages directory contents:', fs.readdirSync(pagesPath));
      } catch (err) {
        console.error('Error reading pages directory:', err);
      }
      break;
    }
  }
  
  // Also check for app directory (for app router)
  let appPath = null;
  const appPaths = [
    standalonePath ? path.join(standalonePath, 'app') : null,
    nextPath ? path.join(nextPath, 'server/app') : null,
  ].filter(Boolean);
  
  for (const potentialAppPath of appPaths) {
    if (fs.existsSync(potentialAppPath)) {
      appPath = potentialAppPath;
      console.log('Found app directory at:', appPath);
      break;
    }
  }
  
  // Handle dashboard routes
  if (pagesPath || appPath) {
    console.log('Setting up routes with found paths');
    
    // Override the root route to redirect to dashboard
    app.get('/', (req, res) => {
      res.redirect('/dashboard');
    });
    
    // Set up the dashboard route
    app.get('/dashboard', (req, res) => {
      // Try pages directory first
      if (pagesPath) {
        const indexPath = path.join(pagesPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          console.log('Serving dashboard from pages:', indexPath);
          return res.sendFile(indexPath);
        }
      }
      
      // Try app directory second
      if (appPath) {
        const appIndexPath = path.join(appPath, 'index.html');
        if (fs.existsSync(appIndexPath)) {
          console.log('Serving dashboard from app directory:', appIndexPath);
          return res.sendFile(appIndexPath);
        }
      }
      
      // If we can't find the file, return a debug page
      res.status(404).send(`
        <html>
          <head><title>UI Not Found</title></head>
          <body>
            <h1>Dashboard UI Not Found</h1>
            <p>The UI files could not be located. This is a configuration issue.</p>
            <p>UI path: ${uiPath}</p>
            <p>Next.js build: ${nextPath}</p>
            <p>Pages directory: ${pagesPath}</p>
            <p>App directory: ${appPath}</p>
            <p>Current environment: ${process.env.NODE_ENV}</p>
            <p>Current directory: ${process.cwd()}</p>
            <p>Directory contents: ${JSON.stringify(fs.readdirSync(process.cwd()))}</p>
            ${nextPath ? `<p>.next contents: ${JSON.stringify(fs.readdirSync(nextPath))}</p>` : ''}
            ${standalonePath ? `<p>Standalone server contents: ${JSON.stringify(fs.readdirSync(standalonePath))}</p>` : ''}
          </body>
        </html>
      `);
    });
    
    // Handle dashboard routes with parameters 
    app.get('/dashboard/*', (req, res) => {
      const pagePath = req.path.replace(/^\/dashboard\/?/, '');
      console.log('Requested dashboard path:', pagePath);
      
      // Try pages directory first
      if (pagesPath) {
        // Try path/index.html first
        const htmlPathWithIndex = path.join(pagesPath, pagePath, 'index.html');
        if (fs.existsSync(htmlPathWithIndex)) {
          console.log('Serving page from pages directory (with index):', htmlPathWithIndex);
          return res.sendFile(htmlPathWithIndex);
        }
        
        // Try path.html
        const htmlPathDirect = path.join(pagesPath, pagePath + '.html');
        if (fs.existsSync(htmlPathDirect)) {
          console.log('Serving dynamic page from pages directory (direct):', htmlPathDirect);
          return res.sendFile(htmlPathDirect);
        }
      }
      
      // Try app directory
      if (appPath) {
        // App directory structure - try with index.html
        const appHtmlPath = path.join(appPath, pagePath, 'index.html');
        if (fs.existsSync(appHtmlPath)) {
          console.log('Serving page from app directory:', appHtmlPath);
          return res.sendFile(appHtmlPath);
        }
      }
      
      // If all specific routes fail, fall back to index for client-side routing
      if (pagesPath) {
        const indexPath = path.join(pagesPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          console.log('Falling back to index page for client-side routing');
          return res.sendFile(indexPath);
        }
      }
      
      if (appPath) {
        const appIndexPath = path.join(appPath, 'index.html');
        if (fs.existsSync(appIndexPath)) {
          console.log('Falling back to app index for client-side routing');
          return res.sendFile(appIndexPath);
        }
      }
      
      // Last resort: return a message
      res.status(404).send(`
        <html>
          <head><title>UI Page Not Found</title></head>
          <body>
            <h1>Dashboard Page Not Found</h1>
            <p>The requested page could not be found. This could be a configuration issue.</p>
            <p>Requested path: ${pagePath}</p>
            <p>UI path: ${uiPath}</p>
            <p>Next.js build: ${nextPath}</p>
            <p>Pages directory: ${pagesPath}</p>
            <p>App directory: ${appPath}</p>
            <p>Checked files:</p>
            <ul>
              ${pagesPath ? `<li>${path.join(pagesPath, pagePath, 'index.html')} (exists: ${fs.existsSync(path.join(pagesPath, pagePath, 'index.html'))})</li>` : ''}
              ${pagesPath ? `<li>${path.join(pagesPath, pagePath + '.html')} (exists: ${fs.existsSync(path.join(pagesPath, pagePath + '.html'))})</li>` : ''}
              ${appPath ? `<li>${path.join(appPath, pagePath, 'index.html')} (exists: ${fs.existsSync(path.join(appPath, pagePath, 'index.html'))})</li>` : ''}
            </ul>
            ${pagesPath ? `<p>Pages directory contents: ${JSON.stringify(fs.readdirSync(pagesPath))}</p>` : ''}
            ${appPath ? `<p>App directory contents: ${JSON.stringify(fs.readdirSync(appPath))}</p>` : ''}
          </body>
        </html>
      `);
    });
    
    return; // Exit early as we've set up the routes
  }
  
  // No pages or app directory was found
  console.warn('No pages or app directory found, setting up fallback UI routes');
  
  // Set up fallback routes
  app.get('/', (req, res) => {
    res.redirect('/dashboard');
  });
  
  app.get('/dashboard*', (req, res) => {
    res.status(404).send(`
      <html>
        <head><title>Next.js Build Not Found</title></head>
        <body>
          <h1>Next.js Build Not Found</h1>
          <p>Could not find any Next.js HTML files in the expected locations.</p>
          <p>UI path: ${uiPath}</p>
          <p>Next.js build: ${nextPath}</p>
          <p>Static files: ${staticPath}</p>
          <p>Current working directory: ${process.cwd()}</p>
          <p>Directory contents: ${JSON.stringify(fs.readdirSync(process.cwd()))}</p>
          ${nextPath ? `<p>Next.js contents: ${JSON.stringify(fs.readdirSync(nextPath))}</p>` : ''}
          <p>This is likely a build configuration issue. Please ensure the Next.js app is properly built with the standalone output option.</p>
          <p>Environment variables: ${JSON.stringify({ NODE_ENV: process.env.NODE_ENV, PWD: process.env.PWD })}</p>
        </body>
      </html>
    `);
  });
} 