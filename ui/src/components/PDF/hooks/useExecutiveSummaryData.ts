import { useGeneratedSummaryContent } from './useGeneratedSummaryContent';
import { CompanyData, BusinessChallenge, AIOpportunity } from '@/types/api';
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

interface ChallengeSolution {
  challenge: string;
  solution: string;
  relevanceScore: number;
  expectedImpact: string;
}

interface ExecutiveSummaryDataResult {
  conciseBusinessSummary: string;
  prioritizedChallenges: ProcessedPainPoint[];
  challengeSolutions: ChallengeSolution[];
  problemStatement: string;
  partnershipProposals: string[];
  timingPoints: string[];
}

/**
 * Custom hook to handle all data processing for ExecutiveSummary component
 */
export const useExecutiveSummaryData = (
  companyData: CompanyData,
  businessChallenges: BusinessChallenge[] | string[],
  pdfOptions: { useCache?: boolean } = { useCache: true },
  preloadedData: any,
  industryInsights?: IndustryInsights
): ExecutiveSummaryDataResult => {
  console.log('[PDF Debug] useExecutiveSummaryData hook initiated');
  
  // Extract the directServerContent from preloadedData
  const directServerContent = preloadedData?.directServerContent;
  
  console.log('[PDF Debug] Using preloaded data in useExecutiveSummaryData:', {
    hasPreloadedData: !!preloadedData,
    hasDirectServerContent: !!directServerContent,
    hasBusinessContextSummary: !!directServerContent?.executiveSummaryContent?.businessContextSummary,
    businessContextSummaryLength: directServerContent?.executiveSummaryContent?.businessContextSummary?.length || 0
  });
  
  // Get data from the generated summary content hook
  const { 
    companyContext, 
    keyBusinessChallenges, 
    strategicOpportunities,
    executiveSummaryContent,
    isLoading,
    error 
  } = useGeneratedSummaryContent(companyData, businessChallenges, { 
    useCache: pdfOptions?.useCache !== undefined ? pdfOptions.useCache : true 
  });
  
  console.log('[PDF Debug] useExecutiveSummaryData received data from useGeneratedSummaryContent:', {
    hasCompanyContext: !!companyContext,
    companyContextLength: companyContext?.length || 0,
    companyContextPreview: companyContext?.substring(0, 50),
    hasExecutiveSummaryContent: !!executiveSummaryContent,
    hasBusinessContextSummary: !!executiveSummaryContent.businessContextSummary,
    businessContextSummaryLength: executiveSummaryContent.businessContextSummary?.length || 0,
    businessContextSummaryPreview: executiveSummaryContent.businessContextSummary?.substring(0, 50)
  });

  // Extract server-provided business context directly from companyData if available
  const serverProvidedBusinessContext = companyData.businessContext || '';
  
  // Get business context summary from various sources
  const businessContextSummary = 
    // First priority: direct server content (bypassing hook state issues)
    directServerContent?.executiveSummaryContent?.businessContextSummary ||
    // Second priority: executiveSummaryContent from the hook 
    executiveSummaryContent.businessContextSummary || 
    // Third priority: company context
    companyContext || 
    // Last resort fallback
    `${companyData.companyName} operates in the ${companyData.industry} industry, providing solutions to address industry challenges.`;

  // Use the entire business context summary
  const conciseBusinessSummary = businessContextSummary;
  
  // Get detailed pain point explanations
  const getPainPointExplanations = () => {
    console.log('[PDF Debug] Starting getPainPointExplanations');
    
    // Use the shared utility to ensure consistent processing with the UI
    const painPointsToProcess: IPainPoint[] = [];
    
    // First check industryInsights.possiblePainPoints (same source as UI)
    if (industryInsights?.possiblePainPoints && Array.isArray(industryInsights.possiblePainPoints) && industryInsights.possiblePainPoints.length > 0) {
      console.log('[PDF Debug] Using industryInsights.possiblePainPoints, count:', industryInsights.possiblePainPoints.length);
      // Ensure all pain points have valid types
      painPointsToProcess.push(...industryInsights.possiblePainPoints.map(pp => ({
        id: `pp-${Math.random().toString(36).substring(2, 9)}`,
        title: typeof pp.title === 'string' ? pp.title : '',
        description: typeof pp.description === 'string' ? pp.description : '',
        typicalSeverity: typeof pp.typicalSeverity === 'number' ? pp.typicalSeverity : 5
      })));
    }
    // Fallback to companyData.possiblePainPoints
    else if (companyData.possiblePainPoints && Array.isArray(companyData.possiblePainPoints) && companyData.possiblePainPoints.length > 0) {
      console.log('[PDF Debug] Falling back to companyData.possiblePainPoints, count:', companyData.possiblePainPoints.length);
      // Ensure all pain points have valid types
      painPointsToProcess.push(...companyData.possiblePainPoints.map(pp => ({
        id: `pp-${Math.random().toString(36).substring(2, 9)}`,
        title: typeof pp.title === 'string' ? pp.title : '',
        description: typeof pp.description === 'string' ? pp.description : '',
        typicalSeverity: typeof pp.typicalSeverity === 'number' ? pp.typicalSeverity : 5
      })));
    }
    // Fall back to the keyBusinessChallenges if no detailed pain points
    else {
      console.log('[PDF Debug] No detailed pain points found, using keyBusinessChallenges as fallback, count:', keyBusinessChallenges.length);
      // Convert business challenges to pain point format
      keyBusinessChallenges.forEach((challenge, index) => {
        if (typeof challenge === 'string') {
          painPointsToProcess.push({
            id: `challenge-${index}`,
            title: challenge,
            description: challenge,
            typicalSeverity: 5
          });
        }
      });
    }
    
    console.log('[PDF Debug] Total painPointsToProcess:', painPointsToProcess.length);
    
    if (painPointsToProcess.length === 0) {
      console.warn('[PDF Debug] WARNING: No pain points to process!');
      return [];
    }
    
    // Use the shared utility to get the prioritized pain points
    const prioritizedPainPoints = getPrioritizedPainPoints(
      painPointsToProcess,
      companyData.aiOpportunities,
      3 // Show top 3 pain points, same as UI default
    );
    
    console.log('[PDF Debug] Prioritized pain points count:', prioritizedPainPoints.length);
    
    if (prioritizedPainPoints.length === 0) {
      console.warn('[PDF Debug] WARNING: No prioritized pain points returned!');
      return [];
    }
    
    // Convert to the format expected by the PDF component and ensure all properties are strings
    const result = prioritizedPainPoints.map(point => ({
      title: typeof point.title === 'string' ? point.title : '',
      description: typeof point.description === 'string' ? point.description : '',
      severity: typeof point.severity === 'number' ? point.severity : 5
    }));
    
    console.log('[PDF Debug] Final pain point explanations:', result);
    return result;
  };
  
  const painPointExplanations = getPainPointExplanations();
  
  // Normalize prioritized challenges
  const normalizePrioritizedChallenges = (challenges: PrioritizedChallenge[]) => {
    if (!challenges || !Array.isArray(challenges)) {
      console.log('[PDF Debug] challenges is not an array, returning empty array');
      return [];
    }
    
    if (challenges.length === 0) {
      console.log('[PDF Debug] challenges array is empty');
      return [];
    }
    
    try {
      // Convert to our standard IPainPoint format
      const painPointsToProcess: IPainPoint[] = challenges.map(challenge => {
        // Ensure all fields have the correct types
        const title = typeof challenge.title === 'string' ? challenge.title : '';
        const description = typeof challenge.description === 'string' ? challenge.description : '';
        
        // Parse severity to number if it's a string, or use default 5
        let severity = 5;
        if (typeof challenge.severity === 'number') {
          severity = challenge.severity;
        } else if (typeof challenge.severity === 'string') {
          const parsed = parseInt(challenge.severity, 10);
          if (!isNaN(parsed)) {
            severity = parsed;
          }
        }
        
        return {
          id: challenge.id || `challenge-${Math.random().toString(36).substring(2, 9)}`,
          title: title,
          description: description,
          typicalSeverity: severity,
          manifestations: Array.isArray(challenge.manifestations) ? challenge.manifestations : [],
          industryRelevance: typeof challenge.industryRelevance === 'string' ? challenge.industryRelevance : ''
        };
      });
      
      // Process using our shared utility
      const processed = processPainPoints(painPointsToProcess, []);
      
      // Return in the format expected by the PDF and ensure all properties are of correct type
      const result = processed.map(pp => ({
        ...pp,
        title: typeof pp.title === 'string' ? pp.title : '',
        description: typeof pp.description === 'string' ? pp.description : '',
        severity: typeof pp.severity === 'number' ? pp.severity : 5,
        manifestations: Array.isArray(pp.manifestations) ? pp.manifestations : [],
        industryRelevance: typeof pp.industryRelevance === 'string' ? pp.industryRelevance : ''
      })).sort((a, b) => b.severity - a.severity);
      
      return result;
    } catch (error) {
      console.error('[PDF Debug] Error in normalizePrioritizedChallenges:', error);
      return [];
    }
  };

  // Get prioritized challenges from various sources
  let rawPrioritizedChallenges = [];
  
  // Source 1: direct server content
  if (directServerContent?.executiveSummaryContent?.prioritizedChallenges && 
      Array.isArray(directServerContent.executiveSummaryContent.prioritizedChallenges) && 
      directServerContent.executiveSummaryContent.prioritizedChallenges.length > 0) {
    rawPrioritizedChallenges = directServerContent.executiveSummaryContent.prioritizedChallenges;
  } 
  // Source 2: executiveSummaryContent from the hook
  else if (executiveSummaryContent.prioritizedChallenges && 
           Array.isArray(executiveSummaryContent.prioritizedChallenges) && 
           executiveSummaryContent.prioritizedChallenges.length > 0) {
    rawPrioritizedChallenges = executiveSummaryContent.prioritizedChallenges;
  }
  // Source 3: pain point explanations as fallback
  else if (Array.isArray(painPointExplanations) && painPointExplanations.length > 0) {
    try {
      rawPrioritizedChallenges = painPointExplanations.map((p: { title: string, description: string, severity: number }) => ({
        title: typeof p.title === 'string' ? p.title : '',
        description: typeof p.description === 'string' ? p.description : '',
        severity: typeof p.severity === 'number' ? p.severity : 5,
        manifestations: [`Common issue in ${companyData.industry} companies`],
        industryRelevance: `Affects 70% of ${companyData.industry} organizations`
      }));
    } catch (error) {
      console.error('[PDF Debug] Error creating fallback prioritized challenges:', error);
      rawPrioritizedChallenges = [];
    }
  }
  
  // Ensure we have an array
  if (!Array.isArray(rawPrioritizedChallenges)) {
    rawPrioritizedChallenges = [];
  }
        
  // Normalize the challenges
  const prioritizedChallenges = normalizePrioritizedChallenges(rawPrioritizedChallenges);

  // Get challenge solutions
  const challengeSolutions = executiveSummaryContent.challengeSolutions?.length > 0 ?
    executiveSummaryContent.challengeSolutions :
    prioritizedChallenges.map(challenge => {
      const relevantOpp = companyData.aiOpportunities.find(o => 
        o.title.toLowerCase().includes(challenge.title.toLowerCase().split(' ')[0])
      );
      return {
        challenge: challenge.title,
        solution: relevantOpp?.title || 'AI-powered automation solution',
        relevanceScore: relevantOpp?.combinedScore || 7,
        expectedImpact: relevantOpp?.impact || 'Significant operational improvement'
      };
    });
  
  // Get fallback content if LLM-generated content is not available
  const problemStatement = executiveSummaryContent.problemStatement || 
    `${companyData.companyName}'s ${companyData.industry} team faces significant challenges that require substantial manual effort that could be better spent advancing strategic initiatives directly.`;
  
  const partnershipProposals = executiveSummaryContent.partnershipProposals?.length > 0 ? 
    executiveSummaryContent.partnershipProposals : [
      `Develop an AI-powered system that monitors and analyzes ${companyData.industry} data`,
      `Reclaim significant staff time through automation`,
      `Enable monitoring of additional metrics and KPIs`,
      `Help shift the team to a more proactive stance`,
      `Strengthen stakeholder relationships through comprehensive coverage`
    ];
  
  const timingPoints = executiveSummaryContent.timingPoints?.length > 0 ?
    executiveSummaryContent.timingPoints : [
      `${companyData.industry} competitors are increasingly adopting AI solutions`,
      `Staff currently turn down strategic opportunities due to time constraints`,
      `Implementing this solution now enables influencing upcoming business cycles`,
      `Early adoption provides competitive advantage in the ${companyData.industry} market`
    ];

  // Return all processed data
  return {
    conciseBusinessSummary,
    prioritizedChallenges,
    challengeSolutions,
    problemStatement,
    partnershipProposals,
    timingPoints
  };
}; 