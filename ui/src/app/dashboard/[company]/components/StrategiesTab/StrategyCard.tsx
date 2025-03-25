import { StrategyCardProps } from '@/types/dashboard';
import { themes } from '@/lib/themes';
import { getCategoryColors } from '../../components/OverviewTab/CategoryChart';

export const StrategyCard = ({ strategy, expanded, onToggle, theme = 'classic' }: StrategyCardProps & { theme: 'nature' | 'classic' | 'ocean' }) => {
  const currentTheme = themes[theme];

  return (
    <div 
      id={`strategy-${strategy.id}`}
      className={`${currentTheme.cardBg} rounded-lg shadow-sm overflow-hidden border border-gray-100`}
      style={{ 
        borderColor: currentTheme.lightBorder,
        transition: 'all 0.3s ease-in-out'
      }}
    >
      {/* Progress indicator at top */}
      <div className="h-1 bg-gray-100">
        <div 
          className="h-1" 
          style={{ 
            backgroundColor: currentTheme.primary, 
            width: `${strategy.impact === 'High' ? '100%' : strategy.impact === 'Medium' ? '66%' : '33%'}` 
          }}
        ></div>
      </div>
      
      {/* Strategy content */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div 
              className="w-7 h-7 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: 
                strategy.category ? getCategoryColors(theme)[strategy.category.toLowerCase() as keyof ReturnType<typeof getCategoryColors>] || getCategoryColors(theme)['other'] : getCategoryColors(theme)['other']
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
        
        <p className="text-gray-600 text-sm mb-6">{strategy.description}</p>
        
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
            {strategy.keyBenefits && strategy.keyBenefits.length > 0 ? (
              strategy.keyBenefits.map((benefit, idx) => (
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

        {/* Expandable sections */}
        <div className="border-t pt-4 mt-4">
          <button 
            onClick={onToggle}
            className="flex items-center justify-between w-full text-sm font-medium"
            style={{ color: currentTheme.secondary }}
          >
            <span>View Details</span>
            <i className={`ri-arrow-${expanded ? 'up' : 'down'}-s-line ml-1`}></i>
          </button>
          
          {expanded && (
            <div className="mt-4 space-y-6">
              {/* Implementation steps */}
              {strategy.implementationSteps && strategy.implementationSteps.length > 0 && (
                <div className="space-y-4">
                  <h5 className="text-sm font-medium text-gray-700">Implementation Steps</h5>
                  <div className="space-y-3">
                    {strategy.implementationSteps.map((step, idx) => (
                      <div key={idx} className="flex gap-3">
                        <span className="text-xs text-gray-500">{idx + 1}.</span>
                        <p className="text-sm text-gray-600">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical challenges */}
              {strategy.technicalChallenges && strategy.technicalChallenges.length > 0 && (
                <div className="space-y-4">
                  <h5 className="text-sm font-medium text-gray-700">Technical Challenges</h5>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
                    {strategy.technicalChallenges.map((challenge, idx) => (
                      <li key={idx}>{challenge}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Resource requirements */}
              {strategy.resourceRequirements && strategy.resourceRequirements.length > 0 && (
                <div className="space-y-4">
                  <h5 className="text-sm font-medium text-gray-700">Resource Requirements</h5>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
                    {strategy.resourceRequirements.map((requirement, idx) => (
                      <li key={idx}>{requirement}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risk factors */}
              {strategy.riskFactors && strategy.riskFactors.length > 0 && (
                <div className="space-y-4">
                  <h5 className="text-sm font-medium text-gray-700">Risk Factors</h5>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
                    {strategy.riskFactors.map((risk, idx) => (
                      <li key={idx}>{risk}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Mitigation strategies */}
              {strategy.mitigationStrategies && strategy.mitigationStrategies.length > 0 && (
                <div className="space-y-4">
                  <h5 className="text-sm font-medium text-gray-700">Mitigation Strategies</h5>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
                    {strategy.mitigationStrategies.map((strategy, idx) => (
                      <li key={idx}>{strategy}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 