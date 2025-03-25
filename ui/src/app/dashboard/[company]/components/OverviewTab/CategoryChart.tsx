// Define colors for different categories with better harmony and contrast
import { themes } from '@/lib/themes';

export const getCategoryColors = (theme: 'nature' | 'classic' | 'ocean' = 'classic') => {
  const currentTheme = themes[theme];
  
  return {
    'visual understanding': currentTheme.categoryVisual,
    'content generation': currentTheme.categoryContent,
    'text analysis': currentTheme.categoryTextAnalysis,
    'knowledge management': currentTheme.categoryKnowledge,
    'conversation': currentTheme.categoryConversation,
    'automation': currentTheme.categoryAutomation,
    'workflow automation': currentTheme.categoryAutomation,
    'other': currentTheme.categoryOther
  };
}; 