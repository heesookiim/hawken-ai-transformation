import { useMemo, useState } from 'react';
import { StrategyCard } from './StrategyCard';
import { AIOpportunity } from '@/types/api';
import { themes } from '@/lib/themes';

interface StrategiesTabProps {
  opportunities: AIOpportunity[];
  isLoading?: boolean;
  error?: Error;
  theme?: 'nature' | 'classic' | 'ocean';
}

type ViewMode = 'list' | 'grid-2';

export const StrategiesTab = ({ opportunities, isLoading, error, theme = 'classic' }: StrategiesTabProps) => {
  const [expandedCards, setExpandedCards] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedImpact, setSelectedImpact] = useState<string>('all');
  const [selectedComplexity, setSelectedComplexity] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const currentTheme = themes[theme];

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = new Set(opportunities?.map(opp => opp.category) || []);
    return ['all', ...Array.from(uniqueCategories)].filter(Boolean);
  }, [opportunities]);

  const impacts = ['all', 'High', 'Medium', 'Low'];
  const complexities = ['all', 'High', 'Medium', 'Low'];
  const timeframes = ['all', 'Short-term', 'Medium-term', 'Long-term'];

  // Important: We use all opportunities here regardless of business challenge relevance
  // This ensures all strategies appear in this tab, even if they don't have
  // businessChallengeRelevances or don't match specific business challenges
  const filteredOpportunities = useMemo(() => {
    if (!opportunities) return [];
    
    // Make sure we're displaying ALL strategies, filtering only by user-selected filters
    return opportunities.filter(opp => {
      const categoryMatch = selectedCategory === 'all' || 
        opp.category === selectedCategory;
      
      const impactMatch = selectedImpact === 'all' || 
        opp.impact === selectedImpact;
      
      const complexityMatch = selectedComplexity === 'all' || 
        opp.complexity === selectedComplexity;
      
      const timeframeMatch = selectedTimeframe === 'all' || 
        opp.timeframe === selectedTimeframe;
      
      const searchMatch = !searchQuery || 
        opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      return categoryMatch && impactMatch && complexityMatch && timeframeMatch && searchMatch;
    });
  }, [opportunities, selectedCategory, selectedImpact, selectedComplexity, selectedTimeframe, searchQuery]);

  const handleToggleExpand = (id: string) => {
    setExpandedCards(prev => 
      prev.includes(id) ? prev.filter(cardId => cardId !== id) : [...prev, id]
    );
  };

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedImpact('all');
    setSelectedComplexity('all');
    setSelectedTimeframe('all');
    setSearchQuery('');
  };

  const getGridClass = () => {
    switch (viewMode) {
      case 'grid-2':
        return 'grid-cols-1 md:grid-cols-2';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: currentTheme.primary }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error loading strategies: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border" style={{ borderColor: currentTheme.lightBorder }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Filter Strategies</h2>
          <div className="flex items-center gap-4">
            {/* View mode toggle */}
            <div className="flex items-center gap-2 border rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                title="List view"
              >
                <i className="ri-list-check-2 text-lg" />
              </button>
              <button
                onClick={() => setViewMode('grid-2')}
                className={`p-1.5 rounded ${viewMode === 'grid-2' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                title="2 columns"
              >
                <i className="ri-layout-grid-2-line text-lg" />
              </button>
            </div>
            <button
              onClick={resetFilters}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <i className="ri-refresh-line" /> Reset Filters
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search strategies by title or description..."
              className="w-full rounded-md border border-gray-300 shadow-sm py-2 pl-10 pr-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <i 
              className="ri-search-line absolute left-3 text-gray-400" 
              style={{ 
                top: '50%', 
                transform: 'translateY(-50%)',
                height: '100%',
                display: 'flex',
                alignItems: 'center'
              }} 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Category filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map((category) => category && (
                <option key={category} value={category}>
                  {category === 'all' 
                    ? 'All Categories' 
                    : category}
                </option>
              ))}
            </select>
          </div>

          {/* Impact filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Impact</label>
            <select
              value={selectedImpact}
              onChange={(e) => setSelectedImpact(e.target.value)}
              className="w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              {impacts.map((impact) => (
                <option key={impact} value={impact}>
                  {impact === 'all' ? 'All Impact Levels' : impact}
                </option>
              ))}
            </select>
          </div>

          {/* Complexity filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Complexity</label>
            <select
              value={selectedComplexity}
              onChange={(e) => setSelectedComplexity(e.target.value)}
              className="w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              {complexities.map((complexity) => (
                <option key={complexity} value={complexity}>
                  {complexity === 'all' ? 'All Complexity Levels' : complexity}
                </option>
              ))}
            </select>
          </div>

          {/* Timeframe filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timeframe</label>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              {timeframes.map((timeframe) => (
                <option key={timeframe} value={timeframe}>
                  {timeframe === 'all' ? 'All Timeframes' : timeframe}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active filters */}
        {(selectedCategory !== 'all' || selectedImpact !== 'all' || selectedComplexity !== 'all' || selectedTimeframe !== 'all' || searchQuery) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Category: {selectedCategory}
                <button onClick={() => setSelectedCategory('all')} className="ml-1 hover:text-blue-900">
                  <i className="ri-close-line" />
                </button>
              </span>
            )}
            {selectedImpact !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Impact: {selectedImpact}
                <button onClick={() => setSelectedImpact('all')} className="ml-1 hover:text-green-900">
                  <i className="ri-close-line" />
                </button>
              </span>
            )}
            {selectedComplexity !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                Complexity: {selectedComplexity}
                <button onClick={() => setSelectedComplexity('all')} className="ml-1 hover:text-orange-900">
                  <i className="ri-close-line" />
                </button>
              </span>
            )}
            {selectedTimeframe !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Timeframe: {selectedTimeframe}
                <button onClick={() => setSelectedTimeframe('all')} className="ml-1 hover:text-purple-900">
                  <i className="ri-close-line" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Search: {searchQuery}
                <button onClick={() => setSearchQuery('')} className="ml-1 hover:text-gray-900">
                  <i className="ri-close-line" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {filteredOpportunities.length} of {opportunities?.length || 0} strategies
        </div>
      </div>

      {/* Strategy cards */}
      <div className={`${viewMode === 'list' ? 'space-y-4' : `grid gap-4 ${getGridClass()}`}`}>
        {filteredOpportunities.map((opportunity) => (
          <StrategyCard
            key={opportunity.id}
            strategy={opportunity}
            expanded={expandedCards.includes(opportunity.id)}
            onToggle={() => handleToggleExpand(opportunity.id)}
            theme={theme}
          />
        ))}
        
        {filteredOpportunities.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No strategies match the selected filters
          </div>
        )}
      </div>
    </div>
  );
}; 