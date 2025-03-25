import React, { useState, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { getPrioritizedPainPoints, processPainPoints, IPainPoint, ProcessedPainPoint } from '@/utils/painPoints';

// Custom badge component since we might not have the shadcn badge component
const Badge = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

// Keep the existing interfaces for backward compatibility
interface PainPoint {
  id: string;
  title: string;
  description: string;
  typicalSeverity: number;
  commonManifestations: string[];
  industryRelevance: string;
}

interface PainPointRelevance {
  painPointId: string;
  relevanceScore: number;
  explanation: string;
  expectedImprovement: string;
}

interface Opportunity {
  id: string;
  title: string;
  description: string;
  impact: string;
  complexity: string;
  timeframe: string;
  painPointRelevances?: PainPointRelevance[];
  [key: string]: any;
}

interface PainPointsProps {
  painPoints: PainPoint[] | IPainPoint[];
  opportunities: Opportunity[];
  maxPoints?: number; // Optional prop to control the number of pain points shown
}

const SeverityIndicator = ({ severity }: { severity: number }) => {
  const getSeverityColor = (value: number) => {
    if (value >= 8) return "bg-red-500";
    if (value >= 6) return "bg-orange-500";
    if (value >= 4) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="flex items-center gap-2">
      <div className="text-sm font-medium">Typical Severity:</div>
      <div className="w-20 h-2 bg-gray-200 rounded">
        <div 
          className={`h-full rounded ${getSeverityColor(severity)}`} 
          style={{ width: `${severity * 10}%` }}
        />
      </div>
      <div className="text-sm font-medium">{severity}/10</div>
    </div>
  );
};

export function IndustryPainPoints({ painPoints, opportunities, maxPoints = 3 }: PainPointsProps) {
  const [expandedPoints, setExpandedPoints] = useState<Record<string, boolean>>({});
  
  // Use our shared utility function to get prioritized pain points
  const prioritizedPainPoints = useMemo(() => {
    // Convert to IPainPoint format if not already
    const painPointsToProcess = painPoints.map((point): IPainPoint => ({
      id: point.id || `pain-${Math.random().toString(36).substring(2, 9)}`,
      title: point.title || '',
      description: point.description || '',
      typicalSeverity: typeof point.typicalSeverity === 'number' ? point.typicalSeverity : 5,
      commonManifestations: Array.isArray((point as PainPoint).commonManifestations) 
        ? (point as PainPoint).commonManifestations 
        : [],
      industryRelevance: (point as PainPoint).industryRelevance || ''
    }));

    // Use the shared utility to get prioritized pain points
    return getPrioritizedPainPoints(painPointsToProcess, opportunities, maxPoints);
  }, [painPoints, opportunities, maxPoints]);
  
  // Find relevant strategies using our shared utility
  const findRelevantStrategies = (painPointId: string) => {
    return opportunities.filter(opp => 
      opp.painPointRelevances?.some(rel => 
        rel.painPointId === painPointId && rel.relevanceScore >= 7
      )
    );
  };
  
  const toggleExpand = (id: string) => {
    setExpandedPoints(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  if (!painPoints || painPoints.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Common Industry Pain Points</CardTitle>
          <CardDescription>
            No industry pain points information is available for this company.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Common Industry Pain Points
          {painPoints.length > maxPoints && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              (Top {maxPoints} shown)
            </span>
          )}
        </CardTitle>
        <CardDescription>
        Based on industry analysis, companies with similar profiles often face these challenges. Our AI strategy recommendations are designed to address these potential pain points
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {prioritizedPainPoints.map((point) => {
          const relevantStrategies = findRelevantStrategies(point.id);
          const hasRelevantStrategies = relevantStrategies.length > 0;
          
          return (
            <div key={point.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{point.title}</h3>
                    {hasRelevantStrategies && (
                      <Badge className="bg-green-50 text-green-700 border border-green-200">
                        Addressable
                      </Badge>
                    )}
                  </div>
                  <SeverityIndicator severity={point.severity} />
                  <p className="text-sm text-gray-600 mt-1">{point.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpand(point.id)}
                  className="ml-2 hover:bg-gray-100 transition-colors"
                >
                  {expandedPoints[point.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </Button>
              </div>
              
              {expandedPoints[point.id] && (
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Common Manifestations:</h4>
                    <ul className="list-disc pl-5 text-sm">
                      {point.manifestations && point.manifestations.length > 0 ? (
                        point.manifestations.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))
                      ) : (
                        <li>No specific manifestations recorded</li>
                      )}
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Industry Relevance:</h4>
                    <p className="text-sm text-gray-600">{point.industryRelevance || 'Not specified'}</p>
                  </div>
                  
                  {hasRelevantStrategies && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-1">
                        <AlertCircle size={14} className="text-green-600" />
                        Top AI Strategies that Address This:
                      </h4>
                      <ul className="list-disc pl-5 text-sm">
                        {relevantStrategies.slice(0, 3).map((strategy) => {
                          const relevance = strategy.painPointRelevances?.find(
                            rel => rel.painPointId === point.id
                          );
                          
                          return (
                            <li key={strategy.id} className="mb-1">
                              <span className="font-medium">{strategy.title}</span>
                              {relevance && (
                                <div className="text-xs text-gray-600 mt-0.5">
                                  {relevance.explanation}
                                  <div className="mt-0.5">
                                    <span className="text-green-600 font-medium">
                                      Expected improvement: {relevance.expectedImprovement}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        
        {/* Show a message if there are more pain points */}
        {painPoints.length > maxPoints && (
          <div className="text-center text-sm text-gray-600 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.dispatchEvent(new CustomEvent('setActiveTab', { detail: 'businessChallenges' }))}
              className="font-medium"
            >
              View All Pain Points ({painPoints.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 