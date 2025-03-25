export interface PainPointRelevance {
  painPointId: string;
  relevanceScore: number;
  explanation: string;
  expectedImprovement: string;
}

export interface BusinessChallengeRelevance {
  challengeId: string;
  relevanceScore: number;
  explanation: string;
  expectedImprovement: string;
}

export interface AIOpportunity {
  id: string;
  title: string;
  description: string;
  impact: string;
  complexity: string;
  timeframe: string;
  keyBenefits?: string[];
  implementationSteps?: string[];
  resourceRequirements?: string[];
  riskFactors?: string[];
  mitigationStrategies?: string[];
  technicalChallenges?: string[];
  validationScore?: number;
  feasibilityScore?: number;
  combinedScore?: number;
  opportunityScore?: number;
  category?: string;
  roi?: string;
  estimatedCost?: string;
  estimatedTimeToImplementation?: string;
  painPointRelevances?: PainPointRelevance[];
  businessChallengeRelevances?: BusinessChallengeRelevance[];
} 