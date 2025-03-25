import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { themes } from '@/lib/themes';

interface InsightsTabProps {
  industryInsights?: {
    industry: string;
    industryInsights: string[];
  };
  businessContext?: string;
  theme?: 'nature' | 'classic' | 'ocean';
}

export const InsightsTab = ({ industryInsights, businessContext, theme = 'classic' }: InsightsTabProps) => {
  const currentTheme = themes[theme];

  if (!industryInsights) {
    throw new Error('Industry insights data is required');
  }
  const insights = industryInsights;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Industry Insights</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium mb-4">Industry Overview: {insights.industry}</h3>
          <p className="text-gray-600 mb-4">
            {businessContext}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium mb-4">Key Industry Trends</h3>
          <div className="space-y-4">
            {insights.industryInsights.map((insight, index) => (
              <div key={index} className="p-4 rounded-lg" style={{ backgroundColor: currentTheme.lightBg, borderLeft: `4px solid ${currentTheme.primary}` }}>
                <p className="text-gray-700">{insight}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 col-span-1 md:col-span-2">
          <h3 className="text-lg font-medium mb-4">AI Adoption in {insights.industry}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-lg border border-gray-100">
              <h4 className="text-base font-medium mb-2">Current State</h4>
              <p className="text-sm text-gray-600">
                Most companies in this industry are in the early stages of AI adoption, focusing on basic automation and data analytics.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-gray-100">
              <h4 className="text-base font-medium mb-2">Challenges</h4>
              <p className="text-sm text-gray-600">
                Common challenges include data quality issues, lack of AI expertise, and difficulty integrating with legacy systems.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-gray-100">
              <h4 className="text-base font-medium mb-2">Opportunities</h4>
              <p className="text-sm text-gray-600">
                Early adopters are seeing significant advantages in customer experience, operational efficiency, and decision-making speed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 