import { useState } from 'react';
import { TabProps } from '@/types/dashboard';
import { MetricsCards } from './MetricsCards';
import { SkeletonCard } from '@/components/Skeletons';
import {
  calculateImplementationEase,
  calculateImpactPotential,
  calculateTimeToValue
} from '@/utils/calculations';
import { getQuadrantForStrategy, getQuadrantProperties } from '@/utils/quadrants';
import { themes } from '@/lib/themes';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { IndustryPainPoints } from '../IndustryPainPoints';
import { getCategoryColors } from './CategoryChart';

// Category configuration
const categoryConfig = {
  KNOWLEDGE_MANAGEMENT: {
    id: 'knowledge-management',
    name: 'Knowledge Management',
    icon: 'ri-search-line',
    filter: (opportunity: any) => 
      opportunity.category?.toLowerCase().includes('knowledge') ||
      opportunity.title.toLowerCase().includes('knowledge') ||
      opportunity.title.toLowerCase().includes('search')
  },
  CONTENT_GENERATION: {
    id: 'content-generation',
    name: 'Content Generation',
    icon: 'ri-file-text-line',
    filter: (opportunity: any) => 
      opportunity.category?.toLowerCase().includes('content') ||
      opportunity.title.toLowerCase().includes('content') ||
      opportunity.title.toLowerCase().includes('generation')
  },
  TEXT_ANALYSIS: {
    id: 'text-analysis',
    name: 'Text Analysis',
    icon: 'ri-bar-chart-line',
    filter: (opportunity: any) => 
      opportunity.category?.toLowerCase().includes('data') ||
      opportunity.category?.toLowerCase().includes('analysis') ||
      opportunity.title.toLowerCase().includes('analysis')
  },
  WORKFLOW_AUTOMATION: {
    id: 'workflow-automation',
    name: 'Workflow Automation',
    icon: 'ri-settings-line',
    filter: (opportunity: any) => 
      opportunity.category?.toLowerCase().includes('automation') ||
      opportunity.title.toLowerCase().includes('automation') ||
      opportunity.title.toLowerCase().includes('workflow')
  },
  VISUAL_UNDERSTANDING: {
    id: 'visual-understanding',
    name: 'Visual Understanding',
    icon: 'ri-image-line',
    filter: (opportunity: any) => 
      opportunity.category?.toLowerCase().includes('visual') ||
      opportunity.title.toLowerCase().includes('visual') ||
      opportunity.title.toLowerCase().includes('image') ||
      opportunity.title.toLowerCase().includes('vision')
  },
  OTHER: {
    id: 'other',
    name: 'Other',
    icon: 'ri-apps-line',
    filter: () => true
  }
};

// Helper function to get category for an opportunity
const getCategoryForOpportunity = (opportunity: any) => {
  return Object.values(categoryConfig).find(category => category.filter(opportunity)) || categoryConfig.OTHER;
};

// Helper function to calculate category distribution
const calculateCategoryDistribution = (opportunities: any[], currentTheme: keyof typeof themes) => {
  // First, assign each opportunity to its most specific category
  const assignedCategories: Record<string, string> = {};
  
  // Process categories in order of specificity (from most specific to the catch-all 'OTHER')
  // We exclude OTHER from this initial assignment and use it as a fallback
  const orderedCategories = Object.values(categoryConfig).filter(cat => cat.id !== 'other');
  
  // Assign each opportunity to exactly one category
  opportunities.forEach(opp => {
    // Find the first matching category for this opportunity
    const matchingCategory = orderedCategories.find(category => category.filter(opp));
    // If found, assign this opportunity to that category, otherwise it will go to 'other'
    if (matchingCategory) {
      assignedCategories[opp.id] = matchingCategory.id;
    } else {
      assignedCategories[opp.id] = 'other';
    }
  });
  
  // Debug: Log each strategy and its assigned category
  console.log('--- Strategy Category Assignments ---');
  opportunities.forEach(opp => {
    const categoryId = assignedCategories[opp.id];
    const categoryName = Object.values(categoryConfig).find(c => c.id === categoryId)?.name || 'Unknown';
    console.log(`Strategy: "${opp.title}" (${opp.id}) -> Category: ${categoryName}`);
  });
  
  // Count opportunities by their assigned categories
  const categoryCounts = Object.values(categoryConfig).reduce((acc, category) => {
    acc[category.id] = Object.entries(assignedCategories)
      .filter(([_, categoryId]) => categoryId === category.id)
      .length;
    return acc;
  }, {} as Record<string, number>);
  
  // Debug: Log the final category counts
  console.log('--- Category Counts ---');
  Object.entries(categoryCounts).forEach(([id, count]) => {
    const categoryName = Object.values(categoryConfig).find(c => c.id === id)?.name || 'Unknown';
    console.log(`${categoryName}: ${count}`);
  });
  
  const categoryColors = getCategoryColors(currentTheme);
  
  // Define the type for the keys in categoryColors
  type CategoryColorKey = keyof ReturnType<typeof getCategoryColors>;
  
  return Object.entries(categoryCounts).map(([id]) => {
    const category = Object.values(categoryConfig).find(c => c.id === id)!;
    // Convert category name to lowercase for color mapping
    const categoryKey = category.name.toLowerCase();
    
    // Use the exact category key for the color if available, otherwise use 'other'
    const colorKey = Object.keys(categoryColors).includes(categoryKey) 
      ? categoryKey as CategoryColorKey 
      : 'other' as CategoryColorKey;
    
    return {
      name: category.name,
      value: categoryCounts[id],
      fill: categoryColors[colorKey]
    };
  }); // Show all categories, even those with zero strategies
};

export function OverviewTab({ opportunities, isLoading, error, theme = 'classic', industry, industryData }: TabProps & { industry?: string, industryData?: any }) {
  const [focusedQuadrant, setFocusedQuadrant] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const currentTheme = theme;

  const toggleExpand = (key: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4">
          {[1, 2].map((i) => (
            <SkeletonCard key={`summary-${i}`} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <h3 className="text-xl font-semibold mb-2">Error Loading Overview</h3>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  if (!opportunities || opportunities.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-xl font-semibold mb-2">No Data Available</h3>
        <p className="text-gray-600">No AI opportunities have been analyzed yet.</p>
      </div>
    );
  }

  // Get top opportunity
  const topOpportunity = opportunities.sort((a, b) => 
    (b.impact || 'Medium').localeCompare(a.impact || 'Medium')
  )[0];

  // Count opportunities by impact
  const highImpactCount = opportunities.filter(o => o.impact === 'High').length;
  const mediumImpactCount = opportunities.filter(o => o.impact === 'Medium').length;
  const lowImpactCount = opportunities.filter(o => o.impact === 'Low').length;

  const metrics = [
    {
      title: 'Implementation Ease',
      description: 'Based on complexity ratings',
      score: calculateImplementationEase(opportunities),
      icon: 'ri-tools-line',
      color: 'bg-blue-500',
      getAssessment: (score: number) => {
        if (score >= 80) return 'Mostly Low Complexity';
        if (score >= 60) return 'Mixed Complexity';
        return 'High Complexity';
      }
    },
    {
      title: 'Impact Potential',
      description: 'Based on impact ratings',
      score: calculateImpactPotential(opportunities),
      icon: 'ri-line-chart-line',
      color: 'bg-green-500',
      getAssessment: (score: number) => {
        if (score >= 80) return 'High Impact Potential';
        if (score >= 60) return 'Medium Impact Potential';
        return 'Limited Impact';
      }
    },
    {
      title: 'Time to Value',
      description: 'Based on timeframe ratings',
      score: calculateTimeToValue(opportunities),
      icon: 'ri-time-line',
      color: 'bg-purple-500',
      getAssessment: (score: number) => {
        if (score >= 80) return 'Quick Wins';
        if (score >= 60) return 'Medium-term Value';
        return 'Long-term Value';
      }
    }
  ];

  // Prepare data for the prioritization matrix
  const matrixData = opportunities.map(strategy => {
    const impactScore = strategy.impact === 'High' ? 75 : 
                       strategy.impact === 'Medium' ? 50 : 25;
    const complexityScore = strategy.complexity === 'High' ? 25 : 
                           strategy.complexity === 'Medium' ? 50 : 75;
    const bubbleSize = strategy.timeframe === 'Short-term' ? 2000 : 
                      strategy.timeframe === 'Medium-term' ? 1300 : 800;
    
    return {
      ...strategy,
      impactScore,
      complexityScore,
      z: bubbleSize,
    };
  });

  // Toggle focus on a specific quadrant
  const toggleQuadrantFocus = (quadrant: string) => {
    setFocusedQuadrant(prev => prev === quadrant ? null : quadrant);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* AI Opportunities Card */}
        <div className={`${themes[currentTheme].cardBg} rounded-lg shadow-sm p-6`}>
          {/* Header with count and total */}
          <div className="flex items-start justify-between mb-4 flex-nowrap">
            <div className="flex flex-col mr-4">
              <span className="text-5xl font-bold text-gray-900">{highImpactCount}</span>
              <p className="text-sm text-gray-600 mt-3">High Impact Opportunities</p>
            </div>
            <div className="rounded-full px-3 py-1 whitespace-nowrap" style={{ 
              backgroundColor: `${themes[currentTheme].primary}15`,
              color: themes[currentTheme].primary
            }}>
              <span className="text-sm font-medium">Impact</span>
            </div>
          </div>

          {/* Enhanced bar chart */}
          <div className="my-6 h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'High', value: highImpactCount, fill: themes[currentTheme].primary },
                  { name: 'Medium', value: mediumImpactCount, fill: themes[currentTheme].primary },
                  { name: 'Low', value: lowImpactCount, fill: themes[currentTheme].primary }
                ]}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                barSize={36}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }} 
                  tickLine={false} 
                  axisLine={{ stroke: '#e5e7eb' }}
                  dy={10}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={{ stroke: '#e5e7eb' }}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.toString()}
                  label={{ 
                    value: 'Count', 
                    angle: -90, 
                    position: 'insideLeft', 
                    offset: -5,
                    style: { fontSize: 12, fill: '#6b7280' } 
                  }}
                />
                <Tooltip
                  formatter={(value) => [`${value} opportunities`, 'Count']}
                  cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={800}
                  fill={themes[currentTheme].primary}
                >
                  {[
                    { name: 'High', value: highImpactCount },
                    { name: 'Medium', value: mediumImpactCount },
                    { name: 'Low', value: lowImpactCount }
                  ].map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={themes[currentTheme].primary}
                      fillOpacity={entry.name === 'High' ? 1 : entry.name === 'Medium' ? 0.7 : 0.4}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Complexity Card */}
        <div className={`${themes[currentTheme].cardBg} rounded-lg shadow-sm p-6`}>
          {/* Header with count and total */}
          <div className="flex items-start justify-between mb-4 flex-nowrap">
            <div className="flex flex-col mr-4">
              <span className="text-5xl font-bold text-gray-900">{opportunities.filter(o => o.complexity === 'Low').length}</span>
              <p className="text-sm text-gray-600 mt-3">Low Complexity Opportunities</p>
            </div>
            <div className="rounded-full px-3 py-1 whitespace-nowrap" style={{ 
              backgroundColor: `${themes[currentTheme].secondary}15`,
              color: themes[currentTheme].secondary
            }}>
              <span className="text-sm font-medium">Complexity</span>
            </div>
          </div>

          {/* Enhanced bar chart */}
          <div className="my-6 h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'Low', value: opportunities.filter(o => o.complexity === 'Low').length, fill: '#10B981' },
                  { name: 'Medium', value: opportunities.filter(o => o.complexity === 'Medium').length, fill: '#F59E0B' },
                  { name: 'High', value: opportunities.filter(o => o.complexity === 'High').length, fill: '#EF4444' }
                ]}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                barSize={36}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }} 
                  tickLine={false} 
                  axisLine={{ stroke: '#e5e7eb' }}
                  dy={10}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={{ stroke: '#e5e7eb' }}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.toString()}
                  label={{ 
                    value: 'Count', 
                    angle: -90, 
                    position: 'insideLeft', 
                    offset: -5,
                    style: { fontSize: 12, fill: '#6b7280' } 
                  }}
                />
                <Tooltip
                  formatter={(value) => [`${value} opportunities`, 'Count']}
                  cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={800}
                  fill={themes[currentTheme].secondary}
                >
                  {[
                    { name: 'Low', value: opportunities.filter(o => o.complexity === 'Low').length },
                    { name: 'Medium', value: opportunities.filter(o => o.complexity === 'Medium').length },
                    { name: 'High', value: opportunities.filter(o => o.complexity === 'High').length }
                  ].map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={themes[currentTheme].secondary}
                      fillOpacity={entry.name === 'Low' ? 1 : entry.name === 'Medium' ? 0.7 : 0.4}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Quick Win Opportunities Card */}
        <div className={`${themes[currentTheme].cardBg} rounded-lg shadow-sm p-6`}>
          {/* Header with count and total */}
          <div className="flex items-start justify-between mb-4 flex-nowrap">
            <div className="flex flex-col mr-4">
              <span className="text-5xl font-bold text-gray-900">
                {opportunities.filter(o => o.impact === 'High' && o.complexity === 'Low').length}
              </span>
              <p className="text-sm text-gray-600 mt-3">High Impact, Low Complexity</p>
            </div>
            <div className="rounded-full px-3 py-1 whitespace-nowrap" style={{ 
              backgroundColor: `${themes[currentTheme].tertiary}15`,
              color: themes[currentTheme].tertiary
            }}>
              <span className="text-sm font-medium">Quick Wins</span>
            </div>
          </div>

          {/* Enhanced bar chart */}
          <div className="my-6 h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { 
                    name: 'Quick Wins', 
                    value: opportunities.filter(o => o.impact === 'High' && o.complexity === 'Low').length,
                    fill: themes[currentTheme].tertiary
                  },
                  { 
                    name: 'Major Projects', 
                    value: opportunities.filter(o => o.impact === 'High' && o.complexity === 'High').length,
                    fill: themes[currentTheme].primary
                  },
                  { 
                    name: 'Fill-ins', 
                    value: opportunities.filter(o => o.impact === 'Low' && o.complexity === 'Low').length,
                    fill: themes[currentTheme].secondary
                  },
                  { 
                    name: 'Avoid', 
                    value: opportunities.filter(o => o.impact === 'Low' && o.complexity === 'High').length,
                    fill: themes[currentTheme].quaternary
                  }
                ]}
                margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
                barSize={20}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.2} />
                <XAxis 
                  type="number" 
                  tickLine={false} 
                  axisLine={{ stroke: '#e5e7eb' }}
                  tick={{ fontSize: 12 }}
                  label={{ 
                    value: 'Count', 
                    position: 'insideBottom', 
                    offset: -15,
                    style: { fontSize: 12, fill: '#6b7280' } 
                  }}
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fontSize: 11 }} 
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false} 
                  width={90} 
                />
                <Tooltip
                  formatter={(value) => [`${value} strategies`, 'Count']}
                  cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[0, 4, 4, 0]}
                  isAnimationActive={true}
                  animationDuration={800}
                  fill={themes[currentTheme].tertiary}
                >
                  {[
                    { name: 'Quick Wins', fill: themes[currentTheme].tertiary },
                    { name: 'Major Projects', fill: themes[currentTheme].tertiary, fillOpacity: 0.8 },
                    { name: 'Fill-ins', fill: themes[currentTheme].tertiary, fillOpacity: 0.6 },
                    { name: 'Avoid', fill: themes[currentTheme].tertiary, fillOpacity: 0.4 }
                  ].map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={entry.fill}
                      fillOpacity={entry.fillOpacity || 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Timeframe Card */}
        <div className={`${themes[currentTheme].cardBg} rounded-lg shadow-sm p-6`}>
          {/* Header with count and total */}
          <div className="flex items-start justify-between mb-4 flex-nowrap">
            <div className="flex flex-col mr-4">
              <span className="text-5xl font-bold text-gray-900">
                {opportunities.filter(o => o.timeframe === 'Short-term').length}
              </span>
              <p className="text-sm text-gray-600 mt-3">Short-term Opportunities</p>
            </div>
            <div className="rounded-full px-3 py-1 whitespace-nowrap" style={{ 
              backgroundColor: `${themes[currentTheme].quaternary}15`,
              color: themes[currentTheme].quaternary
            }}>
              <span className="text-sm font-medium">Timeframe</span>
            </div>
          </div>

          {/* Enhanced bar chart */}
          <div className="my-6 h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'Short', value: opportunities.filter(o => o.timeframe === 'Short-term').length, fill: '#10B981' },
                  { name: 'Medium', value: opportunities.filter(o => o.timeframe === 'Medium-term').length, fill: '#F59E0B' },
                  { name: 'Long', value: opportunities.filter(o => o.timeframe === 'Long-term').length, fill: '#EF4444' }
                ]}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                barSize={36}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }} 
                  tickLine={false} 
                  axisLine={{ stroke: '#e5e7eb' }}
                  dy={10}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={{ stroke: '#e5e7eb' }}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.toString()}
                  label={{ 
                    value: 'Count', 
                    angle: -90, 
                    position: 'insideLeft', 
                    offset: -5,
                    style: { fontSize: 12, fill: '#6b7280' } 
                  }}
                />
                <Tooltip
                  formatter={(value) => [`${value} opportunities`, 'Count']}
                  cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={800}
                  fill={themes[currentTheme].quaternary}
                >
                  {[
                    { name: 'Short', value: opportunities.filter(o => o.timeframe === 'Short-term').length },
                    { name: 'Medium', value: opportunities.filter(o => o.timeframe === 'Medium-term').length },
                    { name: 'Long', value: opportunities.filter(o => o.timeframe === 'Long-term').length }
                  ].map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={themes[currentTheme].quaternary}
                      fillOpacity={entry.name === 'Short' ? 1 : entry.name === 'Medium' ? 0.7 : 0.4}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Industry Pain Points */}
      {industryData?.possiblePainPoints && industryData.possiblePainPoints.length > 0 && (
        <IndustryPainPoints
          painPoints={industryData.possiblePainPoints}
          opportunities={opportunities}
          maxPoints={3}
        />
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-12 gap-6">
        {/* Strategy Matrix */}
        <div className="col-span-12 md:col-span-8">
          <div className={`${themes[currentTheme].cardBg} rounded-lg shadow-sm p-6 h-full`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">Strategy Prioritization Matrix</h3>
              <div className="flex items-center gap-4">
                <div className="text-xs text-gray-500 flex items-center">
                  <span className="mr-2">Bubble size:</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    <span>Long-term</span>
                  </div>
                  <div className="mx-2">→</div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-gray-400" />
                    <span>Short-term</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quadrant Legend */}
            <div className="mb-4 grid grid-cols-2 gap-x-8 gap-y-4 max-w-3xl mx-auto">
              {/* Major Projects and Quick Wins row */}
              <div className="space-y-4">
                {['major-projects', 'avoid'].map(quadrant => {
                  const props = getQuadrantProperties(quadrant, currentTheme);
                  return (
                    <div key={quadrant} className="flex items-center gap-2">
                      <div style={{ width: 16, height: 16, backgroundColor: props.solidColor, border: `1px solid ${props.color}`, borderRadius: '3px' }}></div>
                      <div className="text-sm">
                        <span style={{ color: props.color, fontWeight: 'bold' }}>{props.name}</span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {quadrant === 'major-projects' 
                            ? 'High Impact, High Complexity'
                            : 'Low Impact, High Complexity'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Avoid and Low Priority row */}
              <div className="space-y-4">
                {['quick-wins', 'low-priority'].map(quadrant => {
                  const props = getQuadrantProperties(quadrant, currentTheme);
                  return (
                    <div key={quadrant} className="flex items-center gap-2">
                      <div style={{ width: 16, height: 16, backgroundColor: props.solidColor, border: `1px solid ${props.color}`, borderRadius: '3px' }}></div>
                      <div className="text-sm">
                        <span style={{ color: props.color, fontWeight: 'bold' }}>{props.name}</span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {quadrant === 'quick-wins' 
                            ? 'High Impact, Low Complexity'
                            : 'Low Impact, Low Complexity'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strategy Prioritization Matrix */}
            <div className="relative h-[400px] border border-gray-200 rounded-lg">
              <div className="absolute inset-0" style={{ padding: "40px", overflow: "visible" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 25, right: 25, bottom: 40, left: 40 }}>
                    {/* Quadrant background colors */}
                    <ReferenceArea 
                      x1={0} x2={50} y1={50} y2={100} 
                      fill={getQuadrantProperties('major-projects', currentTheme).solidColor} 
                    />
                    <ReferenceArea 
                      x1={50} x2={100} y1={50} y2={100} 
                      fill={getQuadrantProperties('quick-wins', currentTheme).solidColor} 
                    />
                    <ReferenceArea 
                      x1={0} x2={50} y1={0} y2={50} 
                      fill={getQuadrantProperties('avoid', currentTheme).solidColor} 
                    />
                    <ReferenceArea 
                      x1={50} x2={100} y1={0} y2={50} 
                      fill={getQuadrantProperties('low-priority', currentTheme).solidColor} 
                    />

                    {/* Grid and axes */}
                    <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                    <XAxis 
                      type="number" 
                      dataKey="complexityScore" 
                      name="Complexity" 
                      domain={[0, 100]}
                      label={{ value: 'Complexity (Higher is Easier)', position: 'bottom', offset: 30, fill: '#666', fontSize: 12 }}
                      ticks={[0, 25, 50, 75, 100]}
                      tickFormatter={(value) => value === 25 ? 'High' : value === 50 ? 'Medium' : value === 75 ? 'Low' : ''}
                      tick={{ fill: '#666', fontSize: 11 }}
                      tickMargin={8}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="impactScore" 
                      name="Impact" 
                      domain={[0, 100]} 
                      label={{ value: 'Impact', angle: -90, position: 'insideLeft', offset: -30, fill: '#666', fontSize: 12 }}
                      ticks={[0, 25, 50, 75, 100]}
                      tickFormatter={(value) => value === 25 ? 'Low' : value === 50 ? 'Medium' : value === 75 ? 'High' : ''}
                      tick={{ fill: '#666', fontSize: 11 }}
                      tickMargin={8}
                    />

                    {/* Reference lines for quadrant boundaries */}
                    <ReferenceLine x={50} stroke="#666" strokeWidth={1.5} />
                    <ReferenceLine y={50} stroke="#666" strokeWidth={1.5} />

                    {/* Strategy bubbles */}
                    <Scatter
                      data={matrixData}
                      fill={themes[currentTheme].primary}
                      fillOpacity={0.7}
                    />

                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-4 border rounded shadow-lg max-w-xs">
                              <p className="font-bold text-sm">{data.title}</p>
                              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                                <div>
                                  <span className="font-medium text-gray-700">Complexity:</span> {data.complexity}
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Timeframe:</span> {data.timeframe || 'Medium-term'}
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="col-span-12 md:col-span-4">
          <div className={`${themes[currentTheme].cardBg} rounded-lg shadow-sm p-6 h-full`}>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Category Distribution</h3>
            <div className="h-[400px] flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie
                    data={calculateCategoryDistribution(opportunities, currentTheme)
                      // Filter out categories with zero values
                      .filter(item => item.value > 0)
                      .map(item => ({
                        ...item,
                        originalValue: item.value
                      }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {calculateCategoryDistribution(opportunities, currentTheme)
                      .filter(item => item.value > 0)
                      .map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.fill}
                        />
                      ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string, props: any) => {
                      const actualValue = props.payload.payload.originalValue;
                      return [`${actualValue} ${actualValue === 1 ? 'strategy' : 'strategies'}`, ''];
                    }}
                    contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {calculateCategoryDistribution(opportunities, currentTheme)
                  // Only show categories with strategies in the legend
                  .filter(item => item.value > 0)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((category, index) => (
                  <div key={category.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.fill }} 
                    />
                    <span className="text-sm text-gray-600">
                      {category.name} ({category.value})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Strategy Cards */}
      <div className="col-span-12">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-800">Top AI Strategies</h3>
          <button 
            className="text-sm flex items-center px-3 py-1.5 hover:bg-gray-100 rounded-md transition-colors"
            style={{ color: themes[currentTheme].secondary }}
            onClick={() => window.dispatchEvent(new CustomEvent('setActiveTab', { detail: 'strategies' }))}
          >
            View all strategies
            <i className="ri-arrow-right-s-line ml-1"></i>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {opportunities
            .map(strategy => ({
              ...strategy,
              quadrant: getQuadrantForStrategy(strategy),
              quadrantPriority: 
                getQuadrantForStrategy(strategy) === 'quick-wins' ? 1 :
                getQuadrantForStrategy(strategy) === 'major-projects' ? 2 :
                getQuadrantForStrategy(strategy) === 'low-priority' ? 3 : 4,
              impactScore: strategy.impact === 'High' ? 3 : strategy.impact === 'Medium' ? 2 : 1
            }))
            .sort((a, b) => {
              // First sort by quadrant priority
              if (a.quadrantPriority !== b.quadrantPriority) {
                return a.quadrantPriority - b.quadrantPriority;
              }
              // Within same quadrant, sort by impact score
              return b.impactScore - a.impactScore;
            })
            .slice(0, 3)
            .map((strategy, index) => (
              <div 
                key={strategy.id || index} 
                id={`strategy-${strategy.id}`}
                className={`${themes[currentTheme].cardBg} rounded-lg shadow-sm overflow-hidden border border-gray-100 hover:shadow-md flex flex-col h-full`}
                style={{ 
                  borderColor: themes[currentTheme].lightBorder,
                  transition: 'all 0.3s ease-in-out'
                }}
              >
                {/* Progress indicator at top */}
                <div className="h-1 bg-gray-100">
                  <div 
                    className="h-1" 
                    style={{ backgroundColor: themes[currentTheme].primary, width: `${strategy.impact === 'High' ? '100%' : strategy.impact === 'Medium' ? '66%' : '33%'}` }}
                  ></div>
                </div>
                
                <div className="p-5 flex-grow flex flex-col">
                  {/* Impact score */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: 
                          strategy.category ? getCategoryColors(currentTheme)[strategy.category.toLowerCase() as keyof ReturnType<typeof getCategoryColors>] || getCategoryColors(currentTheme)['other'] : getCategoryColors(currentTheme)['other']
                        }}
                      >
                        <i className={`ri-${
                          strategy.category?.toLowerCase() === 'conversation' ? 'message' :
                          strategy.category?.toLowerCase() === 'content generation' ? 'file-text' :
                          strategy.category?.toLowerCase() === 'knowledge management' ? 'book' :
                          strategy.category?.toLowerCase() === 'text analysis' ? 'search' :
                          strategy.category?.toLowerCase() === 'automation' ? 'settings' :
                          'question'
                        }-line`}></i>
                      </div>
                      <div className="ml-3">
                        <h4 className="font-medium text-gray-900 text-sm">{strategy.title}</h4>
                      </div>
                    </div>
                  </div>
                  
                  {/* Flexible content area */}
                  <div className="flex-grow">
                    <div>
                      <p className={`text-gray-600 text-sm mb-2 ${expandedCards[`${index}_desc`] ? '' : 'line-clamp-2'}`}>
                        {strategy.description}
                      </p>
                      <button 
                        onClick={() => toggleExpand(`${index}_desc`)}
                        className="text-xs mb-4 flex items-center px-2 py-1 hover:bg-gray-100 rounded transition-colors w-fit"
                        style={{ color: themes[currentTheme].secondary }}
                      >
                        {expandedCards[`${index}_desc`] ? 'Show less' : 'View more'}
                        <i className={`ri-arrow-${expandedCards[`${index}_desc`] ? 'up' : 'down'}-s-line ml-1`}></i>
                      </button>
                    </div>
                    
                    {/* Metrics Section */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <h5 className="text-sm font-medium text-gray-700 mb-3">Strategy Metrics</h5>
                      <div className="space-y-4">
                        {/* Complexity */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">Complexity</span>
                            <span className="font-medium" style={{ color: strategy.complexity === 'Low' ? '#10B981' : strategy.complexity === 'Medium' ? '#F59E0B' : '#EF4444' }}>
                              {strategy.complexity}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full" 
                              style={{ 
                                backgroundColor: strategy.complexity === 'Low' ? '#10B981' : strategy.complexity === 'Medium' ? '#F59E0B' : '#EF4444',
                                width: `${strategy.complexity === 'Low' ? '33' : strategy.complexity === 'Medium' ? '66' : '100'}%` 
                              }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                            <span>Easier</span>
                            <span>Harder</span>
                          </div>
                        </div>

                        {/* Impact */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">Impact</span>
                            <span className="font-medium" style={{ color: strategy.impact === 'High' ? '#10B981' : strategy.impact === 'Medium' ? '#F59E0B' : '#EF4444' }}>
                              {strategy.impact}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full" 
                              style={{ 
                                backgroundColor: strategy.impact === 'High' ? '#10B981' : strategy.impact === 'Medium' ? '#F59E0B' : '#EF4444',
                                width: `${strategy.impact === 'High' ? '100' : strategy.impact === 'Medium' ? '66' : '33'}%` 
                              }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                            <span>Lower</span>
                            <span>Higher</span>
                          </div>
                        </div>

                        {/* Timeframe */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">Timeframe</span>
                            <span className="font-medium" style={{ color: strategy.timeframe === 'Short-term' ? '#10B981' : strategy.timeframe === 'Medium-term' ? '#F59E0B' : '#EF4444' }}>
                              {strategy.timeframe}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full" 
                              style={{ 
                                backgroundColor: strategy.timeframe === 'Short-term' ? '#10B981' : strategy.timeframe === 'Medium-term' ? '#F59E0B' : '#EF4444',
                                width: `${strategy.timeframe === 'Short-term' ? '33' : strategy.timeframe === 'Medium-term' ? '66' : '100'}%` 
                              }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                            <span>Shorter</span>
                            <span>Longer</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Key benefits */}
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Key Benefits</h5>
                      <ul className="text-sm text-gray-600 space-y-1 pl-5 list-disc">
                        {strategy.keyBenefits ? (
                          strategy.keyBenefits.slice(0, 3).map((benefit, idx) => (
                            <li key={idx}>{benefit}</li>
                          ))
                        ) : (
                          <>
                            <li>Increased operational efficiency</li>
                            <li>Reduced manual workload</li>
                            <li>Enhanced data-driven decision making</li>
                          </>
                        )}
                      </ul>
                    </div>

                    {/* Implementation steps - collapsible */}
                    <div className="border-t pt-4 mt-4">
                      <button 
                        onClick={() => toggleExpand(`${index}_steps`)}
                        className="flex items-center justify-between w-full text-sm font-medium hover:bg-gray-100 p-2 rounded-md transition-all"
                        style={{ color: themes[currentTheme].secondary }}
                      >
                        <span>Implementation Steps</span>
                        <i className={`ri-arrow-${expandedCards[`${index}_steps`] ? 'up' : 'down'}-s-line ml-1 transition-transform duration-200`}></i>
                      </button>
                      
                      {expandedCards[`${index}_steps`] && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="space-y-4">
                            {strategy.implementationSteps ? (
                              strategy.implementationSteps.slice(0, 5).map((step, stepIdx) => (
                                <div key={stepIdx}>
                                  <h6 className="text-xs font-medium text-gray-700 mb-2">{stepIdx + 1}. {step.split(':')[0]}</h6>
                                  {step.includes(':') ? (
                                    <div className="text-xs text-gray-600">
                                      {step.split(':')[1].trim().startsWith('-') ? (
                                        <ul className="list-disc pl-5 space-y-1">
                                          {step.split(':')[1].trim().split('\n').map((bullet, i) => (
                                            <li key={i}>{bullet.trim().startsWith('-') ? bullet.trim().substring(1).trim() : bullet.trim()}</li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p>{step.split(':')[1].trim()}</p>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-600">{step}</p>
                                  )}
                                </div>
                              ))
                            ) : (
                              <>
                                <div>
                                  <h6 className="text-xs font-medium text-gray-700 mb-2">1. LLM Selection</h6>
                                  <p className="text-xs text-gray-600">Choose appropriate LLM model based on requirements.</p>
                                </div>
                                <div>
                                  <h6 className="text-xs font-medium text-gray-700 mb-2">2. Knowledge Base Setup</h6>
                                  <p className="text-xs text-gray-600">Gather and structure company data for LLM context.</p>
                                </div>
                                <div>
                                  <h6 className="text-xs font-medium text-gray-700 mb-2">3. Integration Development</h6>
                                  <p className="text-xs text-gray-600">Connect LLM APIs with existing systems.</p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Technical challenges - collapsible */}
                    {strategy.technicalChallenges && strategy.technicalChallenges.length > 0 && (
                      <div className="border-t pt-4 mt-4">
                        <button 
                          onClick={() => toggleExpand(`${index}_challenges`)}
                          className="flex items-center justify-between w-full text-sm font-medium hover:bg-gray-100 p-2 rounded-md transition-all"
                          style={{ color: themes[currentTheme].secondary }}
                        >
                          <span>Technical Challenges</span>
                          <i className={`ri-arrow-${expandedCards[`${index}_challenges`] ? 'up' : 'down'}-s-line ml-1 transition-transform duration-200`}></i>
                        </button>
                        
                        {expandedCards[`${index}_challenges`] && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="space-y-4">
                              {strategy.technicalChallenges.slice(0, 3).map((challenge, idx) => (
                                <div key={idx}>
                                  <p className="text-xs text-gray-600">{challenge}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Resource requirements - collapsible */}
                    {strategy.resourceRequirements && strategy.resourceRequirements.length > 0 && (
                      <div className="border-t pt-4 mt-4">
                        <button 
                          onClick={() => toggleExpand(`${index}_resources`)}
                          className="flex items-center justify-between w-full text-sm font-medium hover:bg-gray-100 p-2 rounded-md transition-all"
                          style={{ color: themes[currentTheme].tertiary }}
                        >
                          <span>Resource Requirements</span>
                          <i className={`ri-arrow-${expandedCards[`${index}_resources`] ? 'up' : 'down'}-s-line ml-1 transition-transform duration-200`}></i>
                        </button>
                        
                        {expandedCards[`${index}_resources`] && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="space-y-4">
                              {strategy.resourceRequirements.slice(0, 3).map((resource, idx) => (
                                <div key={idx}>
                                  <p className="text-xs text-gray-600">{resource}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Risk factors - collapsible */}
                    {strategy.riskFactors && strategy.riskFactors.length > 0 && (
                      <div className="border-t pt-4 mt-4">
                        <button 
                          onClick={() => toggleExpand(`${index}_risks`)}
                          className="flex items-center justify-between w-full text-sm font-medium hover:bg-gray-100 p-2 rounded-md transition-all"
                          style={{ color: themes[currentTheme].quaternary }}
                        >
                          <span>Risk Factors</span>
                          <i className={`ri-arrow-${expandedCards[`${index}_risks`] ? 'up' : 'down'}-s-line ml-1 transition-transform duration-200`}></i>
                        </button>
                        
                        {expandedCards[`${index}_risks`] && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="space-y-4">
                              {strategy.riskFactors.slice(0, 3).map((risk, idx) => (
                                <div key={idx}>
                                  <p className="text-xs text-gray-600">{risk}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mitigation strategies - collapsible */}
                    {strategy.mitigationStrategies && strategy.mitigationStrategies.length > 0 && (
                      <div className="border-t pt-4 mt-4">
                        <button 
                          onClick={() => toggleExpand(`${index}_mitigations`)}
                          className="flex items-center justify-between w-full text-sm font-medium hover:bg-gray-100 p-2 rounded-md transition-all"
                          style={{ color: themes[currentTheme].primary }}
                        >
                          <span>Mitigation Strategies</span>
                          <i className={`ri-arrow-${expandedCards[`${index}_mitigations`] ? 'up' : 'down'}-s-line ml-1 transition-transform duration-200`}></i>
                        </button>
                        
                        {expandedCards[`${index}_mitigations`] && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="space-y-4">
                              {strategy.mitigationStrategies.slice(0, 3).map((mitigation, idx) => (
                                <div key={idx}>
                                  <p className="text-xs text-gray-600">{mitigation}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Footer section with button - always at the bottom */}
                  <div className="mt-4 pt-4 border-t">
                    <button 
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('setActiveTab', { detail: 'strategies' }));
                        window.dispatchEvent(new CustomEvent('selectStrategy', { detail: strategy.id }));
                      }}
                      className="w-full py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2 text-white hover:brightness-110 hover:shadow-md"
                      style={{ 
                        backgroundColor: themes[currentTheme].primary,
                      }}
                    >
                      <span>View full strategy details</span>
                      <i className="ri-arrow-right-line"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
} 