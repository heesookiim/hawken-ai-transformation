import React from 'react';
import { useState } from 'react';
import { themes } from '@/lib/themes';
import { TabProps } from '@/types/dashboard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { IndustryPainPoints } from '../IndustryPainPoints';

interface ExtendedTabProps extends TabProps {
  industry?: string;
  industryData?: any;
}

export function BusinessChallengesTab({ opportunities, isLoading, error, theme = 'classic', industry, industryData }: ExtendedTabProps) {
  const currentTheme = themes[theme];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: currentTheme.primary }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Failed to load challenge information.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // If no industry data, show a message
  if (!industryData || !industryData.possiblePainPoints || industryData.possiblePainPoints.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Industry Challenges</CardTitle>
          <CardDescription>No industry-specific challenges available for this company.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Complete the AI assessment to identify industry challenges that could benefit from AI solutions.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Display Industry Pain Points instead of Business Challenges */}
      {industryData?.possiblePainPoints && industryData.possiblePainPoints.length > 0 && (
        <IndustryPainPoints
          painPoints={industryData.possiblePainPoints}
          opportunities={opportunities}
          maxPoints={1000}
        />
      )}
    </div>
  );
} 