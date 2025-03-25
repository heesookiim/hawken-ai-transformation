import React from 'react';

export interface PainPointRelevance {
  painPointId: string;
  relevanceScore: number;
  explanation: string;
  expectedImprovement: string;
}

interface PainPointRelevanceProps {
  relevances: PainPointRelevance[];
}

export function PainPointRelevanceSection({ relevances }: PainPointRelevanceProps) {
  if (!relevances || relevances.length === 0) {
    return null;
  }
  
  // Sort by relevance score and take top 3
  const topRelevances = [...relevances]
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 3);
  
  return (
    <div className="mt-4">
      <h3 className="text-md font-medium mb-2">Addresses Industry Challenges:</h3>
      <div className="space-y-2">
        {topRelevances.map((relevance, i) => (
          <div key={i} className="border-l-4 border-green-500 pl-3 py-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-16 bg-gray-200 rounded">
                <div 
                  className="h-full rounded bg-green-500" 
                  style={{ width: `${relevance.relevanceScore * 10}%` }}
                />
              </div>
              <span className="text-sm">{relevance.relevanceScore}/10</span>
            </div>
            <p className="text-sm mt-1">{relevance.explanation}</p>
            <p className="text-sm font-medium text-green-700 mt-1">
              {relevance.expectedImprovement}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
} 