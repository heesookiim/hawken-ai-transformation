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

  // Check for standalone build first - this will exist if the UI was built with Next.js standalone option
  let uiStandalonePath = path.join(uiPath, 'server'); // In root-copied standalone, server dir is directly here
  if (!fs.existsSync(uiStandalonePath)) {
    // Try nested paths for standalone output in different configurations
    const standalonePaths = [
      path.join(uiPath, 'server'),
      path.join(process.cwd(), 'server'),
      path.join(uiPath, '.next/standalone/server'),
      path.join(process.cwd(), 'ui/.next/standalone/server'),
      path.join(projectRoot, 'ui/.next/standalone/server')
    ];
    
    for (const standalonePath of standalonePaths) {
      if (fs.existsSync(standalonePath)) {
        uiStandalonePath = standalonePath;
        console.log('Found standalone server directory at:', uiStandalonePath);
        break;
      }
    }
  }
  
  // Check if server/pages directory exists in standalone build
  const hasStandaloneBuild = !!uiStandalonePath && fs.existsSync(uiStandalonePath);
  const pagesDir = hasStandaloneBuild ? path.join(uiStandalonePath, 'pages') : null;
  const hasPagesDir = pagesDir ? fs.existsSync(pagesDir) : false;
  
  console.log('Standalone server directory exists:', hasStandaloneBuild);
  console.log('Pages directory exists:', hasPagesDir);
  
  if (hasPagesDir) {
    console.log('Pages directory contents:', fs.readdirSync(pagesDir));
  }
  
  // Find Next.js static assets directory
  let uiStaticPath = null;
  const staticPaths = [
    path.join(process.cwd(), '.next/static'),
    path.join(process.cwd(), 'ui/.next/static'),
    path.join(uiPath, '.next/static'),
    path.join(projectRoot, 'ui/.next/static')
  ];
  
  for (const staticPath of staticPaths) {
    if (fs.existsSync(staticPath)) {
      uiStaticPath = staticPath;
      console.log('Found static files at:', uiStaticPath);
      break;
    }
  }
  
  // Set up paths for UI files based on what we found
  const uiPublicPath = path.join(uiPath, 'public');
  const uiNextPath = path.join(uiPath, '.next');
  
  // Check for Next.js output in main UI path
  const hasNextOutput = fs.existsSync(uiNextPath);

  // Log the availability of key directories
  console.log('UI paths diagnostics:');
  console.log('  UI public directory exists:', fs.existsSync(uiPublicPath));
  console.log('  UI Next.js build exists:', hasNextOutput);
  console.log('  UI Standalone build exists:', hasStandaloneBuild);
  console.log('  UI Static files exist:', !!uiStaticPath);

  // Serve static files - this is needed in all configurations
  if (uiStaticPath && fs.existsSync(uiStaticPath)) {
    app.use('/_next/static', express.static(uiStaticPath));
    console.log('Serving static assets from:', uiStaticPath);
  }
  
  if (fs.existsSync(uiPublicPath)) {
    app.use(express.static(uiPublicPath));
    console.log('Serving public files from:', uiPublicPath);
  }
  
  // Handle standalone build configuration
  if (hasStandaloneBuild && hasPagesDir) {
    console.log('Using standalone Next.js build for serving UI');
    
    // Set up the dashboard route
    app.get('/dashboard', (req, res) => {
      const indexPath = path.join(pagesDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        console.log('Serving dashboard from:', indexPath);
        return res.sendFile(indexPath);
      }
      
      // Check for app directory if pages doesn't have index.html
      const appDir = path.join(uiStandalonePath, 'app');
      const appIndexPath = fs.existsSync(appDir) ? path.join(appDir, 'index.html') : null;
      
      if (appIndexPath && fs.existsSync(appIndexPath)) {
        console.log('Serving dashboard from app directory:', appIndexPath);
        return res.sendFile(appIndexPath);
      }
      
      // If we can't find the file, return a debug page
      res.status(404).send(`
        <html>
          <head><title>UI Not Found</title></head>
          <body>
            <h1>Dashboard UI Not Found</h1>
            <p>The UI files could not be located. This is a configuration issue.</p>
            <p>Checked for standalone at: ${uiStandalonePath}</p>
            <p>Checked for pages at: ${pagesDir}</p>
            <p>Current environment: ${process.env.NODE_ENV}</p>
            <p>Current directory: ${process.cwd()}</p>
            <p>Directory contents: ${JSON.stringify(fs.readdirSync(process.cwd()))}</p>
          </body>
        </html>
      `);
    });
    
    // Handle dashboard routes with parameters 
    app.get('/dashboard/*', (req, res) => {
      const pagePath = req.path.replace(/^\/dashboard\/?/, '');
      console.log('Requested dashboard path:', pagePath);
      
      // Try standalone pages directory first
      const htmlPath = path.join(pagesDir, pagePath, 'index.html');
      if (fs.existsSync(htmlPath)) {
        console.log('Serving page from:', htmlPath);
        return res.sendFile(htmlPath);
      }
      
      // Try direct path (for dynamic routes)
      const directPath = path.join(pagesDir, pagePath + '.html');
      if (fs.existsSync(directPath)) {
        console.log('Serving dynamic page from:', directPath);
        return res.sendFile(directPath);
      }
      
      // If that fails, serve the index page to let client-side routing handle it
      const indexPath = path.join(pagesDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        console.log('Falling back to index page for client-side routing');
        return res.sendFile(indexPath);
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
            <p>Also tried: ${directPath}</p>
            <p>Server directory: ${uiStandalonePath}</p>
            <p>Pages directory exists: ${hasPagesDir}</p>
            ${hasPagesDir ? `<p>Pages directory contents: ${JSON.stringify(fs.readdirSync(pagesDir))}</p>` : ''}
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

  // If we get here, we couldn't find the standalone build - fall back to trying standard Next.js output
  console.log('No standalone build found, falling back to standard Next.js serving');
  
  if (hasNextOutput) {
    console.log('Using standard Next.js output');
    app.use('/_next', express.static(path.join(uiNextPath)));
    
    // Redirect root to dashboard
    app.get('/', (req, res) => {
      res.redirect('/dashboard');
    });
    
    // Check for server/pages output as used in newer Next.js versions
    const serverPagesDir = path.join(uiNextPath, 'server/pages');
    const hasServerPages = fs.existsSync(serverPagesDir);
    
    if (hasServerPages) {
      console.log('Found server/pages directory at:', serverPagesDir);
      
      // Handle dashboard routes
      app.get('/dashboard*', (req, res) => {
        const pagePath = req.path.replace(/^\/dashboard\/?/, '');
        
        // Try specific page path first
        const htmlPath = path.join(serverPagesDir, pagePath, 'index.html');
        if (fs.existsSync(htmlPath)) {
          return res.sendFile(htmlPath);
        }
        
        // Try index as fallback for client-side routing
        const indexPath = path.join(serverPagesDir, 'index.html');
        if (fs.existsSync(indexPath)) {
          return res.sendFile(indexPath);
        }
        
        // Last resort - debug page
        res.status(404).send(`
          <html>
            <head><title>Dashboard Not Found</title></head>
            <body>
              <h1>Dashboard Not Found</h1>
              <p>Could not find the dashboard page in standard Next.js output</p>
              <p>Checked: ${htmlPath}</p>
              <p>Also tried: ${indexPath}</p>
              <p>Server/pages exists: ${hasServerPages}</p>
              ${hasServerPages ? `<p>Directory contents: ${JSON.stringify(fs.readdirSync(serverPagesDir))}</p>` : ''}
            </body>
          </html>
        `);
      });
    } else {
      // Very old Next.js versions or incomplete build
      console.warn('No server/pages directory found, falling back to basic error page');
      
      app.get('/dashboard*', (req, res) => {
        res.status(404).send(`
          <html>
            <head><title>Dashboard Not Found (Old Next.js)</title></head>
            <body>
              <h1>Dashboard UI Not Found</h1>
              <p>This Next.js build appears to be in an older format or is incomplete.</p>
              <p>No server/pages directory found at: ${serverPagesDir}</p>
              <p>Next.js directory exists: ${hasNextOutput}</p>
              <p>Next.js directory contents: ${JSON.stringify(fs.readdirSync(uiNextPath))}</p>
            </body>
          </html>
        `);
      });
    }
  } else {
    // No Next.js output found at all
    console.warn('No Next.js build found at all');
    
    app.get('/dashboard*', (req, res) => {
      res.status(404).send(`
        <html>
          <head><title>Next.js Build Not Found</title></head>
          <body>
            <h1>Next.js Build Not Found</h1>
            <p>Could not find any Next.js build output in the expected locations.</p>
            <p>Current working directory: ${process.cwd()}</p>
            <p>Directory contents: ${JSON.stringify(fs.readdirSync(process.cwd()))}</p>
            <p>UI path: ${uiPath}</p>
            <p>UI path contents: ${JSON.stringify(fs.readdirSync(uiPath))}</p>
            <p>This is likely a build configuration issue. Please ensure the Next.js app is properly built with the standalone output option.</p>
          </body>
        </html>
      `);
    });
  }
} 