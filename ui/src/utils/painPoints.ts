// painPoints.ts - Shared utility for pain point processing
import { AIOpportunity, PossiblePainPoint } from '@/types/api';
import { PainPointRelevance } from '@/types/aiOpportunity';

/**
 * Interface for a pain point with all possible properties
 */
export interface IPainPoint extends PossiblePainPoint {
  id?: string;
  [key: string]: any;
}

/**
 * Basic opportunity interface with minimum required properties
 */
export interface IBasicOpportunity {
  id: string;
  title: string;
  painPointRelevances?: PainPointRelevance[];
}

/**
 * Interface for processed pain point output
 */
export interface ProcessedPainPoint {
  id: string;
  title: string;
  description: string;
  severity: number;
  manifestations: string[];
  industryRelevance: string;
  relevantStrategies?: IBasicOpportunity[];
  relevantStrategiesCount?: number;
  hasRelevantStrategies?: boolean;
}

/**
 * Finds strategies that are relevant to a specific pain point
 */
export const findRelevantStrategies = <T extends IBasicOpportunity>(painPointId: string, opportunities: T[] = []) => {
  return opportunities.filter(opp => 
    opp.painPointRelevances?.some((rel: PainPointRelevance) => 
      rel.painPointId === painPointId && rel.relevanceScore >= 7
    )
  );
};

/**
 * Processes pain points to ensure consistent format
 * Adds information about relevant strategies
 */
export const processPainPoints = <T extends IBasicOpportunity>(painPoints: IPainPoint[] = [], opportunities: T[] = []): ProcessedPainPoint[] => {
  if (!painPoints || !Array.isArray(painPoints) || painPoints.length === 0) {
    return [];
  }
  
  // Normalize pain points and add strategy information
  return painPoints.map(point => {
    const id = point.id || `pain-${Math.random().toString(36).substring(2, 9)}`;
    const relevantStrategies = findRelevantStrategies(id, opportunities);
    
    return {
      id,
      title: point.title || '',
      description: point.description || '',
      severity: typeof point.typicalSeverity === 'number' ? point.typicalSeverity : 5,
      manifestations: Array.isArray(point.commonManifestations) ? point.commonManifestations : [],
      industryRelevance: point.industryRelevance || '',
      relevantStrategies,
      relevantStrategiesCount: relevantStrategies.length,
      hasRelevantStrategies: relevantStrategies.length > 0
    };
  });
};

/**
 * Gets prioritized pain points based on strategies and severity
 * Returns the top N pain points by priority
 */
export const getPrioritizedPainPoints = <T extends IBasicOpportunity>(
  painPoints: IPainPoint[] = [], 
  opportunities: T[] = [], 
  maxPoints = 3
): ProcessedPainPoint[] => {
  // Process all pain points first
  const processedPoints = processPainPoints(painPoints, opportunities);
  
  // Sort by addressability (has strategies) first, then by severity, then by number of strategies
  const prioritized = [...processedPoints].sort((a, b) => {
    // First, sort by whether they have relevant strategies
    if (a.hasRelevantStrategies !== b.hasRelevantStrategies) {
      return a.hasRelevantStrategies ? -1 : 1; // Addressable ones first
    }
    
    // For points with same addressability status, sort by severity (high to low)
    if (a.severity !== b.severity) {
      return b.severity - a.severity;
    }
    
    // If both have relevant strategies and same severity, sort by number of strategies
    if (a.hasRelevantStrategies && b.hasRelevantStrategies && a.relevantStrategiesCount !== b.relevantStrategiesCount) {
      return b.relevantStrategiesCount! - a.relevantStrategiesCount!;
    }
    
    // Final tiebreaker: sort alphabetically by title
    return a.title.localeCompare(b.title);
  });
  
  // Return only the top N pain points
  return prioritized.slice(0, maxPoints);
}; 