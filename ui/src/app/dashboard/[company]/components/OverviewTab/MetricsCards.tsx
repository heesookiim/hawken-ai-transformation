import { MetricsCardProps } from '@/types/dashboard';
import { themes } from '@/lib/themes';

export function MetricsCards({
  title,
  description,
  score,
  icon,
  color,
  getAssessment,
  theme = 'classic'
}: MetricsCardProps & { theme?: 'nature' | 'classic' | 'ocean' }) {
  const currentTheme = themes[theme];
  
  return (
    <div className={`${currentTheme.cardBg} rounded-lg shadow-sm p-6`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <i className={`${icon} text-2xl`} style={{ color: currentTheme.primary }} />
      </div>
      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full" 
                  style={{ 
                    color: currentTheme.primary,
                    backgroundColor: `${currentTheme.primary}15`
                  }}>
              {score}%
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded" 
             style={{ backgroundColor: `${currentTheme.primary}15` }}>
          <div 
            style={{ 
              width: `${score}%`,
              backgroundColor: currentTheme.primary
            }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center"
          />
        </div>
      </div>
      <div className="text-xs text-gray-500 mt-2">
        {getAssessment(score)}
      </div>
    </div>
  );
} 