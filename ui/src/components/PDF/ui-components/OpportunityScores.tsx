import React from 'react';
import { View } from '@react-pdf/renderer';
import { ScoreBar } from './ScoreBar';

interface OpportunityScoresProps {
  opportunity: any;
}

export const OpportunityScores = ({ opportunity }: OpportunityScoresProps) => {
  return (
    <View>
      {opportunity.validationScore && (
        <ScoreBar label="Validation Score" value={opportunity.validationScore} />
      )}
      {opportunity.feasibilityScore && (
        <ScoreBar label="Feasibility Score" value={opportunity.feasibilityScore} />
      )}
      {opportunity.combinedScore && (
        <ScoreBar label="Combined Score" value={opportunity.combinedScore} />
      )}
      {opportunity.opportunityScore && (
        <ScoreBar label="Opportunity Score" value={opportunity.opportunityScore} />
      )}
    </View>
  );
}; 