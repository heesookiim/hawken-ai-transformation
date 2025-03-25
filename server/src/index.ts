import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { generateProposal, loadProposal, determineStrategyCategory } from './ai/analyzer.js';
import dotenv from 'dotenv';
import { calculateOpportunityScore, calculateCombinedScore } from './utils/scoring.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getCompanyId } from './utils/cache.js';
import { loadLLMContent, generateLLMContent } from './ai/llmContent.js';
import { configureUIServing } from './ui-integration.js';

// API Endpoints Summary:
// - /api/generate: Unified endpoint for both proposal generation and LLM content generation
//   * For proposal generation: provide companyUrl and companyName
//   * For LLM content generation: provide prompt
// - /api/analysis/:companyId/generate: Company-specific LLM content generation with business context
// - /api/analyze: Alias for proposal generation (backward compatibility)

// Configuration
const VERBOSE_LOGGING = false;  // Set to true for detailed logs

// Load environment variables
dotenv.config();

// Access PUBLIC_PATH with a safe fallback
const publicPath = process.env.PUBLIC_PATH || path.join(process.cwd(), 'public');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static files from test-results directory
app.use('/test-results', express.static(path.join(__dirname, '../test-results')));

// Serve static files from cache directory
app.use('/cache', express.static(path.join(process.cwd(), 'cache')));

// Serve static files from the public directory
app.use('/dashboard', express.static('/Users/heesookim/playground/AI_Transformation_Plan_Generator_shadcn/ui/public'));

// Add error handling for static file serving
app.use('/cache', (err: any, req: any, res: any, next: any) => {
  if (err.code === 'ENOENT') {
    res.status(404).json({ error: 'File not found' });
  } else {
    console.error('Error serving static file:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a root route handler
app.get('/', (req, res) => {
  res.json({ message: 'AI Transformation Plan Generator API is running' });
});

// Helper function to get path to cache directory
const getCacheDirectory = (companyId: string) => {
  return path.join(process.cwd(), 'cache', companyId);
};

// Helper function to delete directory recursively
const deleteDirectoryRecursive = (directoryPath: string) => {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file) => {
      const curPath = path.join(directoryPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // Recursive call for directories
        deleteDirectoryRecursive(curPath);
      } else {
        // Delete file
        fs.unlinkSync(curPath);
      }
    });
    
    // Delete the empty directory
    fs.rmdirSync(directoryPath);
    return true;
  }
  return false;
};

// Initialize the Google Generative AI client for content generation
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
const contentGenerationModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Unified API endpoint for both proposal generation and LLM content generation
app.post('/api/generate', async (req, res) => {
  try {
    console.log("DEBUG: /api/generate received request body:", JSON.stringify(req.body, null, 2));
    
    // Check which type of request this is based on the body parameters
    if ('prompt' in req.body) {
      // This is an LLM content generation request
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required for LLM content generation' });
      }

      console.log(`Generating LLM content for prompt: ${prompt.substring(0, 50)}...`);

      const result = await contentGenerationModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048
        }
      });

      const response = result.response;
      const textResponse = response.text();
      
      console.log(`LLM content generation completed, response length: ${textResponse.length}`);
      
      return res.json({ content: textResponse });
    } 
    else if ('companyUrl' in req.body && 'companyName' in req.body) {
      // This is a proposal generation request
      const { companyUrl, companyName } = req.body;
      
      if (!companyUrl || !companyName) {
        return res.status(400).json({ error: 'Company URL and name are required for proposal generation' });
      }

      console.log(`Generating proposal for: ${companyName} (${companyUrl})`);

      // Create test-results directory if it doesn't exist
      const resultsDir = path.join(__dirname, '../test-results');
      if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
      }

      // Generate the analysis using Google AI (with caching now)
      const analysis = await generateProposal(companyUrl, companyName);

      // Save the results to test-results for backward compatibility
      const filename = `${companyName.toLowerCase().replace(/\s+/g, '-')}-analysis.json`;
      fs.writeFileSync(path.join(resultsDir, filename), JSON.stringify(analysis, null, 2));

      console.log(`Proposal generation completed for: ${companyName}`);
      return res.json(analysis);
    }
    else {
      // Invalid request
      return res.status(400).json({
        error: 'Invalid request body',
        debug: {
          receivedKeys: Object.keys(req.body),
          fullBody: req.body
        }
      });
    }
  } catch (error) {
    console.error('Error in /api/generate:', error);
    res.status(500).json({
      error: 'Request failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API endpoint for company-specific LLM content generation
// This endpoint specifically uses company context from cache for personalized responses
app.post('/api/analysis/:companyId/generate', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log(`Generating LLM content for company ${companyId} with prompt: ${prompt.substring(0, 50)}...`);

    // Load company context from cache if available
    const cacheDir = getCacheDirectory(companyId);
    let companyContext = '';
    
    try {
      if (fs.existsSync(path.join(cacheDir, 'context_analysis.json'))) {
        const contextData = JSON.parse(fs.readFileSync(path.join(cacheDir, 'context_analysis.json'), 'utf8'));
        companyContext = `Company Context: ${contextData.businessContext || ''}\n\n`;
        console.log(`Loaded context for ${companyId}: ${companyContext.substring(0, 100)}...`);
      }
    } catch (err) {
      console.warn(`Could not load company context for ${companyId}, proceeding without context`);
    }

    // Combine company context with prompt if available
    const fullPrompt = companyContext ? `${companyContext}${prompt}` : prompt;

    const result = await contentGenerationModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048
      }
    });

    const response = result.response;
    const textResponse = response.text();
    
    console.log(`LLM content generation completed for company ${companyId}, response length: ${textResponse.length}`);
    
    return res.json({ content: textResponse });
  } catch (error) {
    console.error(`Error generating LLM content for company:`, error);
    res.status(500).json({ 
      error: 'Failed to generate LLM content',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// New endpoint to check cache status for a company
app.get('/api/cache-status/:company', (req, res) => {
  try {
    const { company } = req.params;
    const companyId = getCompanyId(company);
    const cacheDir = getCacheDirectory(companyId);
    
    if (!fs.existsSync(cacheDir)) {
      return res.status(404).json({ 
        exists: false,
        message: 'No cache found for this company' 
      });
    }
    
    // Read all files in the cache directory
    const files = fs.readdirSync(cacheDir);
    const fileStats = files.map(file => {
      const filePath = path.join(cacheDir, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        size: stats.size,
        created: stats.birthtime
      };
    });
    
    res.json({
      exists: true,
      companyId,
      files: fileStats,
      cachePath: `/cache/${companyId}/`
    });
  } catch (error) {
    console.error('Error checking cache status:', error);
    res.status(500).json({ 
      error: 'Failed to check cache status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get analysis data for a specific company
app.get('/api/analysis/:company', (req, res) => {
  try {
    const { company } = req.params;
    const companyId = getCompanyId(company);
    
    // First try to load from cache
    const cachedProposal = loadProposal(company, '');
    
    // If not in cache, try the test-results directory
    let data;
    if (cachedProposal) {
      if (VERBOSE_LOGGING) {
        console.log('Using cached proposal data');
      }
      data = cachedProposal;
    } else {
      const resultsDir = path.join(__dirname, '../test-results');
      const filePath = path.join(resultsDir, `${company}-analysis.json`);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Analysis not found for the specified company' });
      }
      
      data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    
    if (VERBOSE_LOGGING) {
      console.log('Data keys:', Object.keys(data));
    }

    // Transform the data to match what the UI expects
    const transformedData: Record<string, any> = {
      [`${company}-context.json`]: {
        description: data.businessContext || `AI transformation plan for ${company}.`,
      },
      [`${company}-final-report.json`]: {
        // Using 0-1 range for the UI Dashboard progress bars
        averageValidationScore: 0.85,
        averageFeasibilityScore: 0.80,
        averageCombinedScore: 0.825,
        expectedImprovement: 0.8,
      },
    };
    
    // Map aiOpportunities (which contains our strategies) to the expected format
    if (data.aiOpportunities && Array.isArray(data.aiOpportunities)) {
      transformedData[`${company}-final-strategies-optimized.json`] = data.aiOpportunities.map((strategy: any) => {
        // For scores, keep original values (likely 0-100 range) but cap at 100 for the ui-test CircularProgress
        const validationScore = Math.min(strategy.validationScore || 80, 100);
        const feasibilityScore = Math.min(strategy.feasibilityScore || 80, 100);
        
        // Determine the category using the analyzer function
        const category = determineStrategyCategory(strategy);
        
        // Use our shared utility functions for calculating scores
        const enhancedStrategy = {
          ...strategy,
          validationScore,
          feasibilityScore,
          category
        };
        
        const opportunityScore = Math.round(calculateOpportunityScore(enhancedStrategy));
        const combinedScore = Math.round(calculateCombinedScore(enhancedStrategy));
        
        return {
          id: strategy.id || `strategy_${Math.random().toString(36).substr(2, 9)}`,
          name: strategy.title || "Untitled Strategy",
          description: strategy.description || "",
          impact: strategy.impact || "Medium",
          complexity: strategy.complexity || "Medium",
          timeframe: strategy.timeframe || "Medium-term",
          keyBenefits: strategy.keyBenefits || [],
          implementationSteps: (strategy.implementationSteps || []).slice(0, 5),
          validationScore: validationScore,
          feasibilityScore: feasibilityScore,
          combinedScore: combinedScore,
          opportunityScore: opportunityScore,
          technicalChallenges: strategy.technicalChallenges || [],
          resourceRequirements: strategy.resourceRequirements || [],
          painPointRelevances: strategy.painPointRelevances || [],
          category: category
        };
      });
    } else {
      // Fallback to empty array if no strategies found
      transformedData[`${company}-final-strategies-optimized.json`] = [];
    }
    
    // Handle industry data
    transformedData[`${company}-industry.json`] = {
      industry: data.industry || "Technology",
      insights: [] // Default empty array
    };
    
    // Check if there are industry insights in the data
    if (data.industryInsights && Array.isArray(data.industryInsights)) {
      transformedData[`${company}-industry.json`].insights = data.industryInsights;
    }
    
    // Add possible pain points if available
    if (data.possiblePainPoints && Array.isArray(data.possiblePainPoints)) {
      transformedData[`${company}-industry.json`].possiblePainPoints = data.possiblePainPoints;
    } else {
      transformedData[`${company}-industry.json`].possiblePainPoints = [];
    }
    
    // Check if there are challenges data available
    let businessChallenges = [];
    
    if (data.businessChallenges && Array.isArray(data.businessChallenges)) {
      // Use businessChallenges format
      businessChallenges = data.businessChallenges;
    } else {
      // Create a simple challenge from the recommended approach if available
      if (data.recommendedApproach) {
        businessChallenges = [{
          name: "Recommended Approach",
          description: data.recommendedApproach,
          category: "Recommendations",
          priority: 3
        }];
      }
    }
    
    // Set format for clients
    transformedData[`${company}-businessChallenges.json`] = businessChallenges;
    
    if (VERBOSE_LOGGING) {
      console.log('Transformed data keys:', Object.keys(transformedData));
    }
    res.status(200).json(transformedData);
  } catch (error) {
    console.error('Error retrieving analysis:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// New endpoint to get a specific cached file
app.get('/api/cache/:company/:file', (req, res) => {
  try {
    const { company, file } = req.params;
    const companyId = getCompanyId(company);
    const cacheDir = getCacheDirectory(companyId);
    const filePath = path.join(cacheDir, `${file}.json`);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        error: 'File not found in cache',
        path: filePath
      });
    }
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json(data);
  } catch (error) {
    console.error('Error retrieving cached file:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve cached file',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper function to calculate average score
function calculateAverage(items: any[], scoreProp: string): number {
  if (!items || items.length === 0) return 0;
  const sum = items.reduce((acc: number, item: any) => acc + (item[scoreProp] || 0), 0);
  return sum / items.length;
}

// API endpoint for generating company analysis (alias for proposal generation)
// This is kept for backward compatibility with existing client code
app.post('/api/analyze', async (req, res) => {
  try {
    const { companyUrl, companyName } = req.body;
    
    if (!companyUrl || !companyName) {
      return res.status(400).json({ 
        error: 'Missing required parameters: companyUrl and companyName are required'
      });
    }
    
    console.log(`Starting analysis for ${companyName} (${companyUrl})`);
    
    // Call your analysis function
    const result = await generateProposal(companyUrl, companyName);
    
    res.json(result);
  } catch (error) {
    console.error('Error in analysis:', error);
    res.status(500).json({ 
      error: 'Analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API endpoint to clear company cache
app.delete('/api/clear-cache/:company', (req, res) => {
  try {
    const { company } = req.params;
    const { newCompanyName } = req.body; // Optional: new company name if renaming
    
    // Always clear cache for the company in the URL param
    const companyId = getCompanyId(company);
    const cacheDir = getCacheDirectory(companyId);
    
    console.log(`Attempting to clear cache for: ${company} (${companyId})`);
    
    let originalCacheDeleted = false;
    if (fs.existsSync(cacheDir)) {
      originalCacheDeleted = deleteDirectoryRecursive(cacheDir);
      console.log(`Cache for ${company} ${originalCacheDeleted ? 'cleared successfully' : 'failed to clear'}`);
    } else {
      console.log(`No cache found for: ${company}`);
    }
    
    // If also renaming, clear cache for the new company name too
    let newCacheDeleted = false;
    if (newCompanyName && newCompanyName !== company) {
      const newCompanyId = getCompanyId(newCompanyName);
      const newCacheDir = getCacheDirectory(newCompanyId);
      
      console.log(`Also attempting to clear cache for new name: ${newCompanyName} (${newCompanyId})`);
      
      if (fs.existsSync(newCacheDir)) {
        newCacheDeleted = deleteDirectoryRecursive(newCacheDir);
        console.log(`Cache for ${newCompanyName} ${newCacheDeleted ? 'cleared successfully' : 'failed to clear'}`);
      } else {
        console.log(`No cache found for: ${newCompanyName}`);
      }
    }
    
    // Consider the operation successful if either cache was deleted or none existed
    const success = originalCacheDeleted || !fs.existsSync(cacheDir) || 
                   (newCompanyName && (newCacheDeleted || !fs.existsSync(getCacheDirectory(getCompanyId(newCompanyName)))));
    
    if (success) {
      return res.json({
        success: true,
        message: `Cache cleared successfully`
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to clear cache directory'
      });
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to clear cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// New endpoint to retrieve pre-generated LLM content for a company
app.get('/api/llm-content/:company', async (req, res) => {
  try {
    const { company } = req.params;
    const companyId = getCompanyId(company);
    
    console.log(`[LLM Debug] Fetching pre-generated content for company: ${company} (${companyId})`);
    
    // Try to load pre-generated content
    const llmContent = loadLLMContent(companyId);
    
    if (llmContent) {
      console.log(`[LLM Debug] Found cached LLM content in ${companyId}`, {
        hasCompanyContext: !!llmContent.companyContext,
        companyContextLength: llmContent.companyContext?.length || 0,
        companyContextPreview: llmContent.companyContext?.substring(0, 50),
        hasBusinessContextSummary: !!llmContent.executiveSummaryContent?.businessContextSummary,
        businessContextSummaryLength: llmContent.executiveSummaryContent?.businessContextSummary?.length || 0,
        businessContextSummaryPreview: llmContent.executiveSummaryContent?.businessContextSummary?.substring(0, 50)
      });
      
      return res.json({
        success: true,
        content: llmContent,
        source: 'cache'
      });
    }
    
    console.log(`[LLM Debug] No cached content found for ${company}, loading proposal data`);
    
    // If no pre-generated content exists, try to load proposal data
    // First check in test-results directory (more likely to have the exact data)
    let proposalData = null;
    const resultsDir = path.join(__dirname, '../test-results');
    const filePath = path.join(resultsDir, `${company.toLowerCase().replace(/\s+/g, '-')}-analysis.json`);
    
    if (fs.existsSync(filePath)) {
      try {
        proposalData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        console.log(`[LLM Debug] Found proposal for ${company} in test-results directory`, {
          hasBusinessContext: !!proposalData.businessContext,
          businessContextLength: proposalData.businessContext?.length || 0,
          businessContextPreview: proposalData.businessContext?.substring(0, 50)
        });
      } catch (e) {
        console.error(`[LLM Debug] Error parsing test-results file for ${company}:`, e);
      }
    }
    
    // If not found in test-results, check cache with empty URL parameter
    if (!proposalData) {
      proposalData = loadProposal(company, '');
      if (proposalData) {
        console.log(`[LLM Debug] Found proposal for ${company} in cache`, {
          hasBusinessContext: !!proposalData.businessContext,
          businessContextLength: proposalData.businessContext?.length || 0,
          businessContextPreview: proposalData.businessContext?.substring(0, 50)
        });
      } else {
        console.log(`[LLM Debug] No proposal data found for ${company} in either location`);
      }
    }
    
    if (!proposalData) {
      return res.status(404).json({
        success: false,
        message: 'No content or proposal found for this company'
      });
    }
    
    // Generate LLM content on-demand, passing the full proposal data
    // This avoids unnecessary LLM API calls by using existing data
    console.log(`[LLM Debug] Generating LLM content on-demand for ${company}`);
    const generatedContent = await generateLLMContent(
      proposalData.companyName,
      proposalData.companyUrl,
      proposalData.businessContext,
      proposalData.industry,
      proposalData // Pass the full proposal data to use existing content
    );
    
    console.log(`[LLM Debug] Generated content for ${company}`, {
      hasCompanyContext: !!generatedContent.companyContext,
      companyContextLength: generatedContent.companyContext?.length || 0,
      companyContextPreview: generatedContent.companyContext?.substring(0, 50),
      hasBusinessContextSummary: !!generatedContent.executiveSummaryContent?.businessContextSummary,
      businessContextSummaryLength: generatedContent.executiveSummaryContent?.businessContextSummary?.length || 0, 
      businessContextSummaryPreview: generatedContent.executiveSummaryContent?.businessContextSummary?.substring(0, 50)
    });
    
    return res.json({
      success: true,
      content: generatedContent,
      source: 'generated'
    });
  } catch (error) {
    console.error('[LLM Debug] Error retrieving LLM content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve LLM content',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// After all API routes but before app.listen()

// Setup for serving Next.js static files
const isProduction = process.env.NODE_ENV === 'production';
const UI_BUILD_PATH = isProduction 
  ? path.join(process.cwd(), '../ui/.next')
  : path.join(__dirname, '../../ui/.next');
const UI_PUBLIC_PATH = isProduction
  ? path.join(process.cwd(), '../ui/public')
  : path.join(__dirname, '../../ui/public');

// Check if Next.js build exists and log status
if (isProduction) {
  if (fs.existsSync(UI_BUILD_PATH)) {
    console.log('Found Next.js build at:', UI_BUILD_PATH);
  } else {
    console.warn('Next.js build not found at:', UI_BUILD_PATH);
  }
}

// Serve Next.js static files
app.use('/_next', express.static(path.join(UI_BUILD_PATH, '_next')));
app.use('/static', express.static(UI_PUBLIC_PATH));

// Root handler for the UI - should come after all API routes
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>AI Transformation Plan Generator</title>
        <meta http-equiv="refresh" content="0;url=/dashboard" />
      </head>
      <body>
        <p>Redirecting to dashboard...</p>
      </body>
    </html>
  `);
});

// Debug catch-all handler to show where request is going
app.get('*', (req, res, next) => {
  // Skip API routes, existing routes, and dashboard routes (handled by UI integration)
  if (req.path.startsWith('/api') || 
      req.path.startsWith('/cache') || 
      req.path.startsWith('/test-results') ||
      req.path.startsWith('/dashboard') ||
      req.path === '/' ||
      req.path.startsWith('/_next') ||
      req.path.startsWith('/public')) {
    return next();
  }
  
  // Return helpful debugging info for any non-API routes
  return res.json({
    message: 'Route not found',
    requestedPath: req.path,
    availableRoutes: [
      '/api/generate',
      '/api/analysis/:companyId/generate', 
      '/api/analyze',
      '/api/cache-status/:company',
      '/api/analysis/:company',
      '/api/cache/:company/:file',
      '/api/llm-content/:company',
      '/dashboard - UI interface'
    ]
  });
});

// Configure UI serving with robust path detection
configureUIServing(app);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log('Google AI API Key available:', !!process.env.GOOGLE_AI_API_KEY);
}); 