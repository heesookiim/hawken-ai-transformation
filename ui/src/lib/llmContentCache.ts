import { CompanyData, BusinessChallenge } from '@/types/api';

interface ExecutiveSummaryContent {
  problemStatement: string;
  partnershipProposals: string[];
  timingPoints: string[];
  
  // New fields for enhanced executive summary
  businessContextSummary?: string;
  prioritizedChallenges?: Array<{
    title: string;
    description: string;
    severity: number;
    manifestations: string[];
    industryRelevance: string;
  }>;
  challengeSolutions?: Array<{
    challenge: string;
    solution: string;
    relevanceScore: number;
    expectedImpact: string;
  }>;
  industryTerminology?: string[];
}

export interface LLMGeneratedContent {
  companyContext: string;
  keyBusinessChallenges: string[];
  strategicOpportunities: string[];
  executiveSummaryContent: ExecutiveSummaryContent;
  generatedAt: number; // timestamp when content was generated
}

// Cache content with a 24-hour expiration
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; 

class LLMContentCacheService {
  private cache = new Map<string, LLMGeneratedContent>();
  
  // Get content from cache if available and not expired
  getContent(companyId: string): LLMGeneratedContent | null {
    const cachedContent = this.cache.get(companyId);
    
    if (!cachedContent) return null;
    
    // Check if cache is still valid (less than 24 hours old)
    const now = Date.now();
    if (now - cachedContent.generatedAt > CACHE_EXPIRY_MS) {
      console.log(`[PDF Cache] Cache expired for ${companyId}, will regenerate`);
      this.cache.delete(companyId);
      return null;
    }
    
    console.log(`[PDF Cache] Using cached content for ${companyId}`);
    return cachedContent;
  }
  
  // Store content in cache
  setContent(companyId: string, content: LLMGeneratedContent): void {
    console.log(`[PDF Cache] Caching content for ${companyId}`);
    this.cache.set(companyId, {
      ...content,
      generatedAt: Date.now()
    });
  }
  
  // Check if content exists in cache and is valid
  hasValidContent(companyId: string): boolean {
    return this.getContent(companyId) !== null;
  }
  
  // Clear cache for a specific company
  clearContent(companyId: string): void {
    console.log(`[PDF Cache] Clearing cache for ${companyId}`);
    this.cache.delete(companyId);
  }
}

// Export singleton instance
export const llmContentCache = new LLMContentCacheService(); 