import { useState } from 'react';

interface SettingsTabProps {
  companyName?: string;
  companyUrl?: string;
  onSaveCompanyDetails: (name: string, url: string) => void;
  onRegenerateAnalysis: () => void;
  onGenerateNewAnalysis: (name: string, url: string) => void;
  onThemeChange: () => void;
  isRegenerating?: boolean;
  isGeneratingNew?: boolean;
  isEditing?: boolean;
}

export const SettingsTab = ({
  companyName = '',
  companyUrl = '',
  onSaveCompanyDetails,
  onRegenerateAnalysis,
  onGenerateNewAnalysis,
  onThemeChange,
  isRegenerating = false,
  isGeneratingNew = false,
  isEditing = false,
}: SettingsTabProps) => {
  const [editedCompanyName, setEditedCompanyName] = useState(companyName);
  const [editedCompanyUrl, setEditedCompanyUrl] = useState(companyUrl);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyUrl, setNewCompanyUrl] = useState('');

  const handleSave = () => {
    onSaveCompanyDetails(editedCompanyName, editedCompanyUrl);
  };

  const handleGenerateNew = () => {
    onGenerateNewAnalysis(newCompanyName, newCompanyUrl);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={onThemeChange}
            className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50"
          >
            Switch Theme
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Company Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input 
                type="text" 
                className="px-3 py-2 border rounded w-full" 
                value={editedCompanyName} 
                onChange={(e) => setEditedCompanyName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
              <input 
                type="text" 
                className="px-3 py-2 border rounded w-full" 
                value={editedCompanyUrl} 
                onChange={(e) => setEditedCompanyUrl(e.target.value)}
                placeholder="https://example.com"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter the full URL including https://
              </p>
            </div>
            <div className="pt-4 flex space-x-4">
              <button 
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
                onClick={handleSave}
              >
                Save Changes
              </button>
              <button 
                className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm flex items-center"
                onClick={onRegenerateAnalysis}
                disabled={isRegenerating}
              >
                {isRegenerating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Regenerating...
                  </>
                ) : (
                  <>
                    {isEditing ? 'Apply Changes & Regenerate' : 'Regenerate Analysis'}
                  </>
                )}
              </button>
            </div>
            <div>
              <p className="mt-2 text-xs text-gray-500">
                {isEditing ? 
                  'Click "Apply Changes & Regenerate" to update the company information and generate a new analysis.' : 
                  'This will create a new analysis for your company. It may take several minutes to complete.'}
              </p>
              {isEditing && (
                <p className="mt-2 text-xs text-orange-500">
                  <strong>Note:</strong> Changing the company name will redirect you to a new dashboard URL.
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* New section for generating new analysis */}
        <div className="bg-white rounded-lg shadow-sm p-6" data-section="generate-new-analysis">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Generate New Analysis</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Company Name</label>
              <input 
                type="text" 
                className="px-3 py-2 border rounded w-full" 
                value={newCompanyName} 
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="Enter new company name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Website URL</label>
              <input 
                type="text" 
                className="px-3 py-2 border rounded w-full" 
                value={newCompanyUrl} 
                onChange={(e) => setNewCompanyUrl(e.target.value)}
                placeholder="https://example.com"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter the full URL including https://
              </p>
            </div>
            <div className="pt-4">
              <button 
                className="px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm flex items-center"
                onClick={handleGenerateNew}
                disabled={isGeneratingNew}
              >
                {isGeneratingNew ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating New Analysis...
                  </>
                ) : (
                  <>
                    <i className="ri-add-line mr-1"></i>
                    Generate New Analysis
                  </>
                )}
              </button>
              <p className="mt-2 text-xs text-gray-500">
                This will create a brand new analysis for a different company. After generation, you will be redirected to the new dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 