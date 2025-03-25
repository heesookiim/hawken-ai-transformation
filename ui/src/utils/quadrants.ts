import { themes } from '@/lib/themes';
import type { AIOpportunity } from '@/types/api';

export function getQuadrantForStrategy(strategy: AIOpportunity): string {
  const impact = strategy.impact || 'Medium';
  const complexity = strategy.complexity || 'Medium';
  
  // Map impact to numeric scores for determining quadrants
  const impactScore = impact === 'High' ? 75 : impact === 'Medium' ? 50 : 25;
  const complexityScore = complexity === 'High' ? 75 : complexity === 'Medium' ? 50 : 25;
  
  // Use the 50 mark as the dividing line for quadrants
  if (impactScore >= 50 && complexityScore < 50) {
    return 'quick-wins';
  } else if (impactScore >= 50 && complexityScore >= 50) {
    return 'major-projects';
  } else if (impactScore < 50 && complexityScore < 50) {
    return 'low-priority';
  } else {
    return 'avoid';
  }
}

export function getQuadrantProperties(quadrant: string, currentTheme: 'nature' | 'classic' | 'ocean' = 'classic') {
  const theme = themes[currentTheme];

  switch (quadrant) {
    case 'quick-wins':
      return {
        name: 'Quick Wins',
        description: 'High Impact, Low Complexity',
        color: theme.primary,
        solidColor: `${theme.primary}20`,
      };
    case 'major-projects':
      return {
        name: 'Major Projects',
        description: 'High Impact, High Complexity',
        color: theme.secondary,
        solidColor: `${theme.secondary}20`,
      };
    case 'low-priority':
      return {
        name: 'Low Priority',
        description: 'Low Impact, Low Complexity',
        color: theme.tertiary,
        solidColor: `${theme.tertiary}20`,
      };
    case 'avoid':
      return {
        name: 'Avoid',
        description: 'Low Impact, High Complexity',
        color: theme.quaternary,
        solidColor: `${theme.quaternary}20`,
      };
    default:
      return {
        name: 'Unknown',
        description: '',
        color: theme.gray,
        solidColor: `${theme.gray}20`,
      };
  }
} 