import { useState, useEffect, useMemo } from 'react';
import { CompanyData } from '@/types/api';
import { apiService } from '@/lib/api';
import { getPrioritizedPainPoints, processPainPoints, IPainPoint, ProcessedPainPoint } from '@/utils/painPoints';

// Update the IndustryInsights interface to include possiblePainPoints
interface IndustryInsights {
  industry: string;
  industryInsights: any[];
  possiblePainPoints?: Array<{
    title?: string;
    description?: string;
    typicalSeverity?: number;
    [key: string]: any;
  }>;
}

interface PrioritizedChallenge {
  title?: string;
  description?: string;
  severity?: number | string;
  manifestations?: string[];
  industryRelevance?: string;
  [key: string]: any;
}

// UPDATED: Restructured for better grouping in the PDF
interface SolutionDetail {
  solution: string;
  relevanceScore: number;
  expectedImpact: string;
}

interface ChallengeSolution {
  challenge: string;
  solutions: SolutionDetail[];
}

interface PDFDataResult {
  // Company and industry info
  companyContext: string;
  conciseBusinessSummary: string;
  
  // Challenges and pain points
  keyBusinessChallenges: string[];
  prioritizedChallenges: ProcessedPainPoint[];
  
  // Solutions and strategies
  strategicOpportunities: string[];
  challengeSolutions: ChallengeSolution[];
  
  // Additional content
  problemStatement: string;
  partnershipProposals: string[];
  timingPoints: string[];
  
  // Status flags
  isLoading: boolean;
  error: Error | null;
}

/**
 * Custom function to get all addressable pain points plus additional ones up to a max if needed
 * This is different from the UI which only shows the top 3
 */
function getAllAddressablePainPoints(
  painPoints: IPainPoint[], 
  opportunities: any[]
): ProcessedPainPoint[] {
  // First, process all pain points to ensure consistent format
  const processedPoints = processPainPoints(painPoints, opportunities);
  
  // For PDF, we want ALL addressable pain points regardless of count
  // An addressable pain point has at least one strategy with relevance >= 7
  const addressablePoints = processedPoints.filter(point => 
    opportunities.some(opp => 
      opp.painPointRelevances?.some((rel: { painPointId: string; relevanceScore: number }) => 
        rel.painPointId === point.id && rel.relevanceScore >= 7
      )
    )
  );
  
  console.log(`[PDF Data] Found ${addressablePoints.length} addressable pain points`);
  
  // Return all addressable points, sorted by severity
  return addressablePoints.sort((a, b) => b.severity - a.severity);
}

/**
 * Consolidated hook for all PDF data needs - eliminates redundant fetching
 * and centralizes all data processing logic in one place
 */
export const usePDFData = (
  companyData: CompanyData,
  businessChallenges: any[] | string[],
  industryInsights?: IndustryInsights,
  options: { useCache?: boolean } = { useCache: true }
): PDFDataResult => {
  const [serverData, setServerData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Single fetch for all pre-generated content
  useEffect(() => {
    const fetchPDFData = async () => {
      console.log(`[PDF Data] Fetching centralized data for ${companyData.companyName}`);
      setIsLoading(true);
      
      try {
        // Only fetch if we don't already have the data
        if (!serverData) {
          const content = await apiService.getPreGeneratedLLMContent(companyData.companyName);
          console.log('[PDF Data] Retrieved all PDF data successfully:', {
            hasBusinessContextSummary: !!content?.executiveSummaryContent?.businessContextSummary,
            businessContextSummaryLength: content?.executiveSummaryContent?.businessContextSummary?.length || 0,
          });
          
          setServerData(content);
        }
        setError(null);
      } catch (err) {
        console.error('[PDF Data] Error fetching PDF data:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };
    
    if (options.useCache !== false) {
      fetchPDFData();
    } else {
      // If cache is disabled, just mark as not loading
      setIsLoading(false);
    }
  }, [companyData.companyName, options.useCache, serverData]);

  // Extract the executiveSummaryContent from serverData
  const executiveSummaryContent = serverData?.executiveSummaryContent || {};
  
  // Extract company context from various sources with fallbacks
  const companyContext = 
    executiveSummaryContent.companyContext || 
    serverData?.companyContext || 
    companyData.businessContext || 
    `${companyData.companyName} operates in the ${companyData.industry} industry.`;
  
  // Extract business context summary with fallbacks
  const businessContextSummary = 
    executiveSummaryContent.businessContextSummary || 
    companyContext || 
    `${companyData.companyName} operates in the ${companyData.industry} industry, providing solutions to address industry challenges.`;

  // Use the entire business context summary
  const conciseBusinessSummary = businessContextSummary;
  
  // Process business challenges
  const keyBusinessChallenges = Array.isArray(businessChallenges) ? 
    businessChallenges.map(challenge => {
      if (typeof challenge === 'string') return challenge;
      return challenge.description || challenge.name || '';
    }) : [];
  
  // UPDATED: Process pain points for PDF - showing ALL addressable pain points 
  // This is different from the UI which only shows the top 3
  const prioritizedChallenges = useMemo(() => {
    console.log('[PDF Data] Processing pain points for PDF - showing ALL addressable pain points');
    
    // 1. First check if we have industry insights pain points (primary source in UI)
    if (industryInsights?.possiblePainPoints && 
        Array.isArray(industryInsights.possiblePainPoints) && 
        industryInsights.possiblePainPoints.length > 0) {
      
      console.log('[PDF Data] Using industryInsights.possiblePainPoints as source');
      
      // Convert to IPainPoint format - exactly like the UI component does
      const painPointsToProcess = industryInsights.possiblePainPoints.map((point): IPainPoint => ({
        id: point.id || `pain-${Math.random().toString(36).substring(2, 9)}`,
        title: point.title || '',
        description: point.description || '',
        typicalSeverity: typeof point.typicalSeverity === 'number' ? point.typicalSeverity : 5,
        commonManifestations: Array.isArray(point.commonManifestations) 
          ? point.commonManifestations 
          : [],
        industryRelevance: point.industryRelevance || ''
      }));
      
      // Use our custom function to get ALL addressable pain points
      return getAllAddressablePainPoints(painPointsToProcess, companyData.aiOpportunities || []);
    }
    
    // 2. Fallback to other sources if needed, but use the same processing approach
    else {
      console.log('[PDF Data] No industryInsights.possiblePainPoints available, using fallbacks');
      
      // Get pain points from other sources
      const fallbackPainPoints: IPainPoint[] = [];
      
      // Try companyData.possiblePainPoints
      if (companyData.possiblePainPoints && 
          Array.isArray(companyData.possiblePainPoints) && 
          companyData.possiblePainPoints.length > 0) {
        
        companyData.possiblePainPoints.forEach(pp => {
          if (typeof pp.title === 'string' && pp.title.trim()) {
            fallbackPainPoints.push({
              id: `company-pp-${Math.random().toString(36).substring(2, 9)}`,
              title: pp.title,
              description: typeof pp.description === 'string' ? pp.description : '',
              typicalSeverity: typeof pp.typicalSeverity === 'number' ? pp.typicalSeverity : 5,
              commonManifestations: [],
              industryRelevance: ''
            });
          }
        });
      }
      
      // If still no pain points, try business challenges
      if (fallbackPainPoints.length === 0 && keyBusinessChallenges.length > 0) {
        keyBusinessChallenges.forEach((challenge, index) => {
          if (typeof challenge === 'string' && challenge.trim()) {
            fallbackPainPoints.push({
              id: `challenge-${index}`,
              title: challenge,
              description: challenge,
              typicalSeverity: 5,
              commonManifestations: [],
              industryRelevance: ''
            });
          }
        });
      }
      
      // Use our custom function to get ALL addressable pain points
      return getAllAddressablePainPoints(fallbackPainPoints, companyData.aiOpportunities || []);
    }
  }, [industryInsights, companyData, keyBusinessChallenges]);
  
  // UPDATED: Get challenge solutions exactly like the UI does, but group by challenge
  // This provides a more readable structure in the PDF
  const challengeSolutions = useMemo(() => {
    console.log('[PDF Data] Finding relevant strategies for pain points using UI approach');

    // If we have pre-generated server data, use it
    if (executiveSummaryContent.challengeSolutions?.length > 0) {
      // Convert legacy format to new grouped format if needed
      if (executiveSummaryContent.challengeSolutions[0] && 
          !('solutions' in executiveSummaryContent.challengeSolutions[0])) {
        
        // Create a map to group solutions by challenge
        const challengeMap = new Map<string, SolutionDetail[]>();
        
        executiveSummaryContent.challengeSolutions.forEach((item: any) => {
          if (!challengeMap.has(item.challenge)) {
            challengeMap.set(item.challenge, []);
          }
          
          challengeMap.get(item.challenge)!.push({
            solution: item.solution,
            relevanceScore: item.relevanceScore,
            expectedImpact: item.expectedImpact
          });
        });
        
        // Convert map to array of ChallengeSolution objects
        return Array.from(challengeMap.entries()).map(([challenge, solutions]) => ({
          challenge,
          solutions
        }));
      }
      
      return executiveSummaryContent.challengeSolutions;
    }
    
    // Group solutions by challenge to avoid repetition
    const challengeMap = new Map<string, SolutionDetail[]>();
    
    // Process each prioritized challenge
    prioritizedChallenges.forEach(challenge => {
      // Find relevant strategies (exactly like UI)
      const relevantStrategies = companyData.aiOpportunities.filter(opp => 
        opp.painPointRelevances?.some(rel => 
          rel.painPointId === challenge.id && rel.relevanceScore >= 7
        )
      );
      
      // Initialize the solutions array for this challenge if needed
      if (!challengeMap.has(challenge.title)) {
        challengeMap.set(challenge.title, []);
      }
      
      // If we found relevant strategies, add them to this challenge's solutions
      if (relevantStrategies.length > 0) {
        // Take up to 3 most relevant strategies per challenge (like UI)
        relevantStrategies.slice(0, 3).forEach(strategy => {
          // Find the specific relevance information for this pain point
          const relevance = strategy.painPointRelevances?.find(
            rel => rel.painPointId === challenge.id
          );
          
          if (relevance) {
            challengeMap.get(challenge.title)!.push({
              solution: strategy.title,
              relevanceScore: relevance.relevanceScore,
              expectedImpact: relevance.expectedImprovement || strategy.impact || 'Significant improvement'
            });
          } else {
            // Fallback if relevance details aren't available
            challengeMap.get(challenge.title)!.push({
              solution: strategy.title,
              relevanceScore: 7, // Default minimum relevance score
              expectedImpact: strategy.impact || 'Significant improvement'
            });
          }
        });
      } else {
        // Fallback if no relevant strategies found - use simple text matching as before
        const fallbackOpp = companyData.aiOpportunities.find(o => 
          o.title.toLowerCase().includes(challenge.title.toLowerCase().split(' ')[0])
        );
        
        if (fallbackOpp) {
          challengeMap.get(challenge.title)!.push({
            solution: fallbackOpp.title,
            relevanceScore: fallbackOpp.combinedScore || 7,
            expectedImpact: fallbackOpp.impact || 'Potential improvement'
          });
        }
      }
    });
    
    // Convert map to array of ChallengeSolution objects with grouped solutions
    return Array.from(challengeMap.entries())
      .filter(([_, solutions]) => solutions.length > 0) // Only include challenges with solutions
      .map(([challenge, solutions]) => ({
        challenge,
        solutions
      }));
  }, [prioritizedChallenges, companyData.aiOpportunities, executiveSummaryContent.challengeSolutions]);
  
  // Get other content with fallbacks
  const problemStatement = 
    executiveSummaryContent.problemStatement || 
    `${companyData.companyName}'s ${companyData.industry} team faces significant challenges that require substantial manual effort that could be better spent advancing strategic initiatives directly.`;
  
  const partnershipProposals = 
    (executiveSummaryContent.partnershipProposals?.length > 0) ? 
      executiveSummaryContent.partnershipProposals : [
        `Develop an AI-powered system that monitors and analyzes ${companyData.industry} data`,
        `Reclaim significant staff time through automation`,
        `Enable monitoring of additional metrics and KPIs`,
        `Help shift the team to a more proactive stance`,
        `Strengthen stakeholder relationships through comprehensive coverage`
      ];
  
  const timingPoints = 
    (executiveSummaryContent.timingPoints?.length > 0) ?
      executiveSummaryContent.timingPoints : [
        `${companyData.industry} competitors are increasingly adopting AI solutions`,
        `Staff currently turn down strategic opportunities due to time constraints`,
        `Implementing this solution now enables influencing upcoming business cycles`,
        `Early adoption provides competitive advantage in the ${companyData.industry} market`
      ];

  // Extract strategic opportunities
  const strategicOpportunities = 
    executiveSummaryContent.strategicOpportunities || 
    companyData.aiOpportunities.map(opp => opp.title) || 
    [];

  // Return all data and status
  return {
    companyContext,
    conciseBusinessSummary,
    keyBusinessChallenges,
    prioritizedChallenges,
    strategicOpportunities,
    challengeSolutions,
    problemStatement,
    partnershipProposals,
    timingPoints,
    isLoading,
    error
  };
}; 