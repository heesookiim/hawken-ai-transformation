import { AIOpportunity } from '../types/api';

export const calculateImplementationEase = (opportunities: AIOpportunity[]): number => {
  if (!opportunities.length) return 0;
  const complexityScores = { 'Low': 100, 'Medium': 60, 'High': 20 };
  const total = opportunities.reduce((sum, opp) => sum + (complexityScores[opp.complexity as keyof typeof complexityScores] || 50), 0);
  return Math.round(total / opportunities.length);
};

export const calculateImpactPotential = (opportunities: AIOpportunity[]): number => {
  if (!opportunities.length) return 0;
  const impactScores = { 'High': 100, 'Medium': 60, 'Low': 20 };
  const total = opportunities.reduce((sum, opp) => sum + (impactScores[opp.impact as keyof typeof impactScores] || 50), 0);
  return Math.round(total / opportunities.length);
};

export const calculateTimeToValue = (opportunities: AIOpportunity[]): number => {
  if (!opportunities.length) return 0;
  const timeframeScores = { 'Short-term': 100, 'Medium-term': 60, 'Long-term': 20 };
  const total = opportunities.reduce((sum, opp) => sum + (timeframeScores[opp.timeframe as keyof typeof timeframeScores] || 50), 0);
  return Math.round(total / opportunities.length);
};

export const getProgressBarWidth = (opportunity: AIOpportunity): string => {
  const impactScores = { 'High': 100, 'Medium': 70, 'Low': 40 };
  return `${impactScores[opportunity.impact as keyof typeof impactScores] || 50}%`;
};

export const getScoreDisplay = (opportunity: AIOpportunity): string => {
  const impactScores = { 'High': 100, 'Medium': 70, 'Low': 40 };
  return `${impactScores[opportunity.impact as keyof typeof impactScores] || 50}%`;
}; 