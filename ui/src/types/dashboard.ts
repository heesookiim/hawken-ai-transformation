import { AIOpportunity } from '@/types/api';

export interface DashboardProps {
  // Using Record<string, never> for an empty props object that is more ESLint-friendly
}

export interface CategoryConfigItem {
  id: string;
  name: string;
  color: string;
  icon: string;
  filter: (opportunity: AIOpportunity) => boolean;
}

export interface CategoryDistributionItem {
  name: string;
  value: number;
  fill: string;
}

export interface TabProps {
  opportunities: AIOpportunity[];
  isLoading: boolean;
  error?: string;
  theme?: 'nature' | 'classic' | 'ocean';
}

export interface MetricsCardProps {
  title: string;
  description: string;
  score: number;
  icon: string;
  color: string;
  getAssessment: (score: number) => string;
}

export interface StrategyCardProps {
  strategy: AIOpportunity;
  expanded: boolean;
  onToggle: () => void;
  onSelect?: (strategy: AIOpportunity) => void;
} 