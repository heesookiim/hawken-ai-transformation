import { ScrapedData } from '../../scraper.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv with the correct path
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Add a check for the API key
const apiKey = process.env.GOOGLE_AI_API_KEY;
if (!apiKey) {
  throw new Error('GOOGLE_AI_API_KEY is not set in environment variables');
}

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
const VERBOSE_LOGGING = false;  // Set to true for detailed logs, including LLM outputs

// Helper function to clean JSON response
function cleanJsonResponse(text: string): string {
  // Remove markdown code blocks if present
  text = text.replace(/```json\n/g, '').replace(/```\n/g, '').replace(/```/g, '');
  // Remove any leading/trailing whitespace
  text = text.trim();
  return text;
}

export async function analyzeContext(
  scrapedData: ScrapedData,
  companyName: string,
  description?: string
) {
  console.log('Analyzing company context');
  
  // Prepare input for AI
  const combinedData = `
    Company Name: ${companyName}
    Company Description: ${description || 'N/A'}
    Website Title: ${scrapedData.title}
    Meta Description: ${scrapedData.metaDescription}
    About Text: ${scrapedData.aboutText}
    Products: ${scrapedData.products.join(', ')}
    Services: ${scrapedData.services.join(', ')}
    Team Info: ${scrapedData.teamInfo.join(', ')}
  `;

  // Define the prompt for business context analysis
  const contextPrompt = `
    You are an AI business analyst specialized in technology transformation. 
    Analyze the following company information and provide:
    1. A comprehensive business context analysis (what the company does, their target market, their business model)
    2. Domain knowledge (their industry, specific terms or concepts relevant to their business)
    
    Company Information:
    ${combinedData}
    
    Return only a valid JSON object with these exact fields, no markdown formatting or other text:
    {
      "businessContext": "detailed analysis of the company's business context",
      "domainKnowledge": "domain-specific knowledge relevant to their industry"
    }
  `;

  try {
    // Call the AI model with modified config
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: contextPrompt }] }],
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192
      }
    });

    const response = result.response;
    const textResponse = response.text();
    
    try {
      // Clean the response before parsing
      const cleanedResponse = cleanJsonResponse(textResponse);
      if (VERBOSE_LOGGING) {
        console.log('Cleaned response:', cleanedResponse);
      }
      
      const jsonResponse = JSON.parse(cleanedResponse);
      return {
        businessContext: jsonResponse.businessContext,
        domainKnowledge: jsonResponse.domainKnowledge
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.error('Raw response:', textResponse);
      throw new Error('Failed to analyze company context');
    }
  } catch (error) {
    console.error('Error generating content:', error);
    if (error instanceof Error) {
      throw new Error('Failed to analyze company context: ' + error.message);
    } else {
      throw new Error('Failed to analyze company context: Unknown error');
    }
  }
} 