import axios from 'axios';
import { AIOpportunity } from '@/types/aiOpportunity';
import { CompanyData, IndustryInsights } from '@/types/api';

// Dynamic API URL that works in both environments
export const getApiBaseUrl = () => {
  // In browser context
  if (typeof window !== 'undefined') {
    // For production deployment on Vercel, use the configured Heroku URL
    if (process.env.NODE_ENV === 'production') {
      const herokuUrl = process.env.NEXT_PUBLIC_HEROKU_API_URL;
      
      // Make sure the URL is valid
      if (herokuUrl && (herokuUrl.startsWith('http://') || herokuUrl.startsWith('https://'))) {
        // Remove trailing slash if present to prevent double-slash issues
        return herokuUrl.endsWith('/') ? herokuUrl.slice(0, -1) : herokuUrl;
      } else {
        console.warn('Invalid Heroku URL format - should be https://your-app.herokuapp.com');
        // Use hardcoded fallback without trailing slash
        return 'https://hawken-ai-transformation-27d8ee0ab1a5.herokuapp.com';
      }
    }
  }
  
  // In development or SSR in production, use the configured URL or default to localhost
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  // Also remove any trailing slash from this URL
  return apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
};

const API_URL = getApiBaseUrl();

// For debugging
if (typeof window !== 'undefined') {
  console.log(`API calls will be made to: ${API_URL}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Available env vars: NEXT_PUBLIC_API_URL=${process.env.NEXT_PUBLIC_API_URL}, NEXT_PUBLIC_HEROKU_API_URL=${process.env.NEXT_PUBLIC_HEROKU_API_URL}`);
}

export type { CompanyData, IndustryInsights };

export interface BusinessChallenge {
  name?: string;
  description?: string;
  category?: string;
  priority?: number;
}

export interface CacheStatus {
  exists: boolean;
  companyId?: string;
  files?: {
    name: string;
    size: number;
    created: string;
  }[];
  cachePath?: string;
  message?: string;
}

// API service functions
export const apiService = {
  // Check if a company has cached data
  async checkCacheStatus(companyName: string): Promise<CacheStatus> {
    try {
      const response = await axios.get(`${API_URL}/api/cache-status/${companyName}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // This is expected when the cache doesn't exist
        return { exists: false, message: 'No cache found for this company' };
      }
      console.error('Error checking cache status:', error);
      return { exists: false, message: 'Failed to check cache status' };
    }
  },

  // Clear cache for a company before regeneration
  async clearCache(companyName: string, newCompanyName?: string): Promise<boolean> {
    try {
      const response = await axios.delete(`${API_URL}/api/clear-cache/${companyName}`, {
        data: newCompanyName ? { newCompanyName } : {}
      });
      return response.data.success;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  },

  // Generate a new analysis for a company
  async generateAnalysis(companyUrl: string, companyName: string): Promise<any> {
    try {
      const response = await axios.post(`${API_URL}/api/analyze`, {
        companyUrl,
        companyName
      });
      return response.data;
    } catch (error) {
      console.error('Error generating analysis:', error);
      throw error;
    }
  },

  // Generate content using LLM with proper company context
  async generateLLMContent(prompt: string, companyName?: string, options: { timeout?: number } = {}): Promise<{ content: string }> {
    try {
      console.log('[PDF] Generating LLM content via apiService');
      
      // Create request configuration with timeout
      const config: any = {
        timeout: options.timeout || 5000, // Default 5 second timeout
      };
      
      // Determine the right endpoint based on whether we have company context
      let endpoint = `${API_URL}/api/generate`;
      
      // If company name is provided, use a company-specific endpoint
      if (companyName) {
        const normalizedName = companyName.toLowerCase().replace(/\s+/g, '-');
        endpoint = `${API_URL}/api/analysis/${normalizedName}/generate`;
      }
      
      // Make the API call with proper error handling
      const response = await axios.post(endpoint, { prompt }, config);
      
      return { content: response.data.content || '' };
    } catch (error) {
      console.error('[PDF] Error generating LLM content:', error);
      
      // Provide informative error messages based on error type
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('LLM generation request timed out');
        } else if (error.response?.status === 400) {
          throw new Error('Invalid prompt or request format');
        } else if (error.response?.status === 404) {
          throw new Error('LLM generation endpoint not found');
        } else if (error.response?.status === 500) {
          throw new Error('LLM service encountered an error');
        }
      }
      
      // Generic fallback error
      throw new Error('Failed to generate content');
    }
  },

  // Get analysis data for a specific company
  async getAnalysis(companyName: string): Promise<any> {
    try {
      const response = await axios.get(`${API_URL}/api/analysis/${companyName}`);
      return response.data;
    } catch (error) {
      console.error('Error retrieving analysis:', error);
      throw new Error('Failed to retrieve analysis');
    }
  },

  // Get final proposal data from cache
  async getFinalProposal(companyName: string): Promise<CompanyData> {
    try {
      const companyId = companyName.toLowerCase().replace(/\s+/g, '-');
      const response = await axios.get(`${API_URL}/cache/${companyId}/final_proposal.json`);
      return response.data;
    } catch (error: any) {
      console.error('Error retrieving final proposal:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`No analysis found for ${companyName}. Please generate an analysis first.`);
        } else if (error.code === 'ECONNABORTED' || error.message.includes('Network Error')) {
          throw new Error(`Network error while accessing the data for ${companyName}. Please check your connection and try again.`);
        }
      }
      
      throw new Error(`Failed to retrieve analysis for ${companyName}. Please try again.`);
    }
  },

  // Get industry insights from cache
  async getIndustryInsights(companyName: string): Promise<IndustryInsights> {
    try {
      const companyId = companyName.toLowerCase().replace(/\s+/g, '-');
      const response = await axios.get(`${API_URL}/cache/${companyId}/industry_insights.json`);
      return response.data;
    } catch (error: any) {
      console.error('Error retrieving industry insights:', error);
      
      // Check for specific error types
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          console.warn(`Industry insights not found for ${companyName}`);
        } else if (error.code === 'ECONNABORTED' || error.message.includes('Network Error')) {
          console.warn(`Network error while fetching industry insights for ${companyName}`);
        }
      }
      
      // Return empty data for any error case
      return { industry: '', industryInsights: [] };
    }
  },

  // Get business challenges from cache
  async getBusinessChallenges(companyName: string): Promise<BusinessChallenge[] | string[]> {
    try {
      const companyId = companyName.toLowerCase().replace(/\s+/g, '-');
      const response = await axios.get(`${API_URL}/cache/${companyId}/businessChallenges.json`);
      return response.data;
    } catch (error: any) {
      console.error('Error retrieving business challenges:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          console.warn(`Business challenges not found for ${companyName}`);
        } else if (error.code === 'ECONNABORTED' || error.message.includes('Network Error')) {
          console.warn(`Network error while fetching business challenges for ${companyName}`);
        }
      }
      
      return []; // Return empty array if file not found or on error
    }
  },

  // New function to get pre-generated LLM content for a company
  async getPreGeneratedLLMContent(companyName: string): Promise<any> {
    try {
      console.log(`[PDF] Fetching pre-generated LLM content for ${companyName}`);
      
      const normalizedName = companyName.toLowerCase().replace(/\s+/g, '-');
      const response = await axios.get(`${API_URL}/api/llm-content/${normalizedName}`);
      
      if (response.data.success) {
        console.log(`[PDF] Successfully fetched pre-generated LLM content (source: ${response.data.source})`);
        return response.data.content;
      } else {
        throw new Error('Pre-generated content not available');
      }
    } catch (error) {
      console.error('[PDF] Error fetching pre-generated LLM content:', error);
      throw new Error('Failed to fetch pre-generated LLM content');
    }
  }
}; 