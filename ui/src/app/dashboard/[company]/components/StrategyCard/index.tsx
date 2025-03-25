import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { PainPointRelevanceSection } from './PainPointRelevance';
import type { PainPointRelevance } from './PainPointRelevance';
import { getCategoryColors } from '../OverviewTab/CategoryChart';

// Update the Strategy interface to include painPointRelevances
interface Strategy {
  id: string;
  title: string;
  description: string;
  impact: string;
  complexity: string;
  timeframe: string;
  validationScore?: number;
  feasibilityScore?: number;
  combinedScore?: number;
  category?: string;
  keyBenefits?: string[];
  implementationSteps?: string[];
  technicalChallenges?: string[];
  resourceRequirements?: string[];
  painPointRelevances?: PainPointRelevance[];
}

interface StrategyCardProps {
  strategy: Strategy;
  expanded?: boolean;
  toggleExpand?: (id: string) => void;
  theme?: string;
}

// Custom badge component if we don't have the shadcn badge
const CustomBadge = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

export function StrategyCard({ strategy, expanded = false, toggleExpand, theme }: StrategyCardProps) {
  // Remove the Badge component reference and just use CustomBadge
  const BadgeComponent = CustomBadge;
  
  // Helper function to get the right color for impact
  const getImpactColor = (impact: string) => {
    switch(impact.toLowerCase()) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };
  
  // Helper function to get the right color for complexity
  const getComplexityColor = (complexity: string) => {
    switch(complexity.toLowerCase()) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };
  
  // Helper function to get the right color for timeframe
  const getTimeframeColor = (timeframe: string) => {
    switch(timeframe.toLowerCase()) {
      case 'short-term': return 'bg-green-50 text-green-700 border-green-200';
      case 'medium-term': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'long-term': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };
  
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">{strategy.title}</CardTitle>
          {toggleExpand && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleExpand(strategy.id)}
              className="ml-2 h-8 w-8 p-0"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <BadgeComponent className={`border ${getImpactColor(strategy.impact)}`}>
            {strategy.impact} Impact
          </BadgeComponent>
          <BadgeComponent className={`border ${getComplexityColor(strategy.complexity)}`}>
            {strategy.complexity} Complexity
          </BadgeComponent>
          <BadgeComponent className={`border ${getTimeframeColor(strategy.timeframe)}`}>
            {strategy.timeframe}
          </BadgeComponent>
          {strategy.category && (
            <BadgeComponent className="bg-purple-50 text-purple-700 border border-purple-200">
              {strategy.category}
            </BadgeComponent>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">{strategy.description}</p>
        
        {expanded && (
          <div className="mt-4 space-y-4">
            {strategy.keyBenefits && strategy.keyBenefits.length > 0 && (
              <div>
                <h3 className="text-md font-medium mb-2">Key Benefits:</h3>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {strategy.keyBenefits.map((benefit, i) => (
                    <li key={i}>{benefit}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {strategy.implementationSteps && strategy.implementationSteps.length > 0 && (
              <div>
                <h3 className="text-md font-medium mb-2">Implementation Steps:</h3>
                <ol className="list-decimal pl-5 text-sm space-y-1">
                  {strategy.implementationSteps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
            
            {/* Add Pain Point Relevance Section */}
            {strategy.painPointRelevances && strategy.painPointRelevances.length > 0 && (
              <PainPointRelevanceSection relevances={strategy.painPointRelevances} />
            )}
            
            {strategy.technicalChallenges && strategy.technicalChallenges.length > 0 && (
              <div>
                <h3 className="text-md font-medium mb-2">Technical Challenges:</h3>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {strategy.technicalChallenges.map((challenge, i) => (
                    <li key={i}>{challenge}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
      {expanded && strategy.validationScore && strategy.feasibilityScore && (
        <CardFooter className="border-t pt-4 pb-2">
          <div className="flex justify-between w-full text-sm">
            <div>
              <span className="font-medium">Validation:</span> {strategy.validationScore}%
            </div>
            <div>
              <span className="font-medium">Feasibility:</span> {strategy.feasibilityScore}%
            </div>
            {strategy.combinedScore && (
              <div>
                <span className="font-medium">Combined:</span> {strategy.combinedScore}%
              </div>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
} 