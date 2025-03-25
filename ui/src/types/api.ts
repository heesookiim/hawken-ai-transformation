export interface PossiblePainPoint {
  title?: string;
  description?: string;
  typicalSeverity?: number;
  commonManifestations?: string[];
  industryRelevance?: string;
}

export interface CompanyData {
  companyName: string;
  companyUrl: string;
  industry: string;
  businessContext: string;
  aiOpportunities: AIOpportunity[];
  recommendedApproach: string;
  nextSteps: string[];
  possiblePainPoints?: PossiblePainPoint[];
}

// Import the relevance types for consistency
import { PainPointRelevance, BusinessChallengeRelevance } from './aiOpportunity';

// Add the BusinessChallenge interface that was missing
export interface BusinessChallenge {
  name?: string;
  description?: string;
  category?: string;
  priority?: number;
}

export interface AIOpportunity {
  id: string;
  title: string;
  description: string;
  impact: string;
  complexity: string;
  timeframe: string;
  keyBenefits: string[];
  implementationSteps: string[];
  validationScore?: number;
  feasibilityScore?: number;
  combinedScore?: number;
  category?: string;
  opportunityScore?: number;
  technicalChallenges?: string[];
  resourceRequirements?: string[];
  riskFactors?: string[];
  mitigationStrategies?: string[];
  painPointRelevances?: PainPointRelevance[];
  businessChallengeRelevances?: BusinessChallengeRelevance[];
  roi?: string;
  estimatedCost?: string;
  estimatedTimeToImplementation?: string;
}

export interface IndustryInsights {
  industry: string;
  industryInsights: string[];
} 