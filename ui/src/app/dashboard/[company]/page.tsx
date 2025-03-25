'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiService, CompanyData, IndustryInsights } from '@/lib/api';
import { DashboardProps } from '@/types/dashboard';
import { OverviewTab } from './components/OverviewTab';
import { StrategiesTab } from './components/StrategiesTab';
import { InsightsTab } from './components/InsightsTab';
import { BusinessChallengesTab } from './components/BusinessChallengesTab';
import { SkeletonCard } from '@/components/Skeletons';
import { themes } from '@/lib/themes';
import { DashboardPDF } from '@/components/PDF/DashboardPDF';
// @ts-ignore - Missing type declaration
import { useTheme } from 'next-themes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
// @ts-ignore - Missing type declaration
import { saveAs } from 'file-saver';
// @ts-ignore - Missing type declaration
import { jsPDF } from 'jspdf';
// @ts-ignore - Missing type declaration
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGeneratedSummaryContent } from '@/components/PDF/hooks/useGeneratedSummaryContent';

export default function Dashboard({}: DashboardProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const params = useParams() as { company: string };
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [industryInsights, setIndustryInsights] = useState<IndustryInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentTheme, setCurrentTheme] = useState<'nature' | 'classic' | 'ocean'>('classic');
  const [showPDF, setShowPDF] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isGeneratingNew, setIsGeneratingNew] = useState(false);
  const [editedCompanyName, setEditedCompanyName] = useState('');
  const [editedCompanyUrl, setEditedCompanyUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyUrl, setNewCompanyUrl] = useState('');
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [pdfContentStatus, setPdfContentStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  // New state for PDF direct preloading
  const [isPDFPreloading, setIsPDFPreloading] = useState(false);
  
  // Pre-generate PDF content once company data is loaded
  const {
    isLoading: isLLMContentLoading,
    error: llmContentError,
    refreshContent: refreshLLMContent
  } = useGeneratedSummaryContent(
    companyData || { 
      companyName: '', 
      companyUrl: '', 
      industry: '', 
      businessContext: '',
      aiOpportunities: [],
      recommendedApproach: '',
      nextSteps: []
    }, 
    (industryInsights as any)?.possiblePainPoints?.map((p: any) => p.description || p.title) || []
  );

  // Update PDF content status based on LLM content generation
  useEffect(() => {
    if (!companyData) {
      setPdfContentStatus('idle');
    } else if (isLLMContentLoading) {
      setPdfContentStatus('loading');
    } else if (llmContentError) {
      setPdfContentStatus('error');
      console.error('[Dashboard] Error pre-generating PDF content:', llmContentError);
    } else {
      setPdfContentStatus('ready');
    }
  }, [companyData, isLLMContentLoading, llmContentError]);

  const fetchData = async () => {
    if (!params.company) return; // Ensure company parameter is available

    try {
      setIsLoading(true);
      setError(null); // Reset any previous errors

      // Try to get final proposal data first - if this fails, we won't proceed with other calls
      try {
        const proposalData = await apiService.getFinalProposal(params.company as string);
        setCompanyData(proposalData);
        setEditedCompanyName(proposalData.companyName);
        setEditedCompanyUrl(proposalData.companyUrl);
      
        // Now try to get optional data - failures here won't block the application
        try {
          const industryData = await apiService.getIndustryInsights(params.company as string);
          setIndustryInsights(industryData);
        } catch (error) {
          console.warn('Could not load industry insights:', error);
          // Still allow app to function without this data
          setIndustryInsights({ industry: proposalData.industry, industryInsights: [] });
        }
      } catch (error) {
        console.error('Error fetching proposal data:', error);
        setError(error instanceof Error ? error : new Error('Failed to fetch company data'));
      }
    } catch (error) {
      console.error('Error in fetch data process:', error);
      setError(error instanceof Error ? error : new Error('Failed to fetch data. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); // Fetch data when the component mounts or when the company changes
  }, [params.company]);

  // Add event listeners for tab navigation and strategy selection
  useEffect(() => {
    const handleSetActiveTab = (e: CustomEvent) => {
      setActiveTab(e.detail);
    };
    
    const handleSelectStrategy = (e: CustomEvent) => {
      setSelectedStrategyId(e.detail);
    };
    
    window.addEventListener('setActiveTab', handleSetActiveTab as EventListener);
    window.addEventListener('selectStrategy', handleSelectStrategy as EventListener);
    
    return () => {
      window.removeEventListener('setActiveTab', handleSetActiveTab as EventListener);
      window.removeEventListener('selectStrategy', handleSelectStrategy as EventListener);
    };
  }, []);
  
  // Effect to handle strategy selection when switching to strategies tab
  useEffect(() => {
    if (activeTab === 'strategies' && selectedStrategyId) {
      // Add a small delay to ensure the tab content is rendered
      const timeoutId = setTimeout(() => {
        const element = document.getElementById(`strategy-${selectedStrategyId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Add a highlight effect
          element.classList.add('strategy-highlight');
          
          // Remove highlight after animation completes
          setTimeout(() => {
            element.classList.remove('strategy-highlight');
            setSelectedStrategyId(null);
          }, 3000);
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [activeTab, selectedStrategyId]);

  const cycleTheme = () => {
    setCurrentTheme(prev => {
      switch (prev) {
        case 'nature': return 'classic';
        case 'classic': return 'ocean';
        case 'ocean': return 'nature';
      }
    });
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const handleSaveCompanyDetails = () => {
    if (!editedCompanyName || !editedCompanyUrl) {
      alert('Company name and URL are required');
      return;
    }
    setIsEditing(true);
  };

  const handleRegenerateAnalysis = async () => {
    try {
      setIsRegenerating(true);
      
      const companyNameToUse = editedCompanyName || companyData?.companyName;
      const companyUrlToUse = editedCompanyUrl || companyData?.companyUrl;

      if (!companyNameToUse || !companyUrlToUse) {
        setError(new Error('Missing company information required for regeneration'));
        return;
      }

      if (!companyUrlToUse.startsWith('http')) {
        alert('URL must start with http:// or https://');
        return;
      }

      if (!confirm(`Are you sure you want to regenerate the analysis for ${companyNameToUse} (${companyUrlToUse})? This will overwrite the current results and may take several minutes.`)) {
        return; // User cancelled
      }

      // Clear the cache
      console.log(`Clearing cache for ${companyNameToUse}...`);
      await apiService.clearCache(params.company, companyNameToUse);

      // Force a short delay to ensure cache deletion completes
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate the analysis
      console.log(`Regenerating analysis for ${companyNameToUse} (${companyUrlToUse})...`);
      await apiService.generateAnalysis(companyUrlToUse, companyNameToUse);

      // Force another delay to ensure generation is complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // If company name changed, redirect to new URL
      if (companyNameToUse.toLowerCase() !== params.company.toLowerCase()) {
        const newCompanySlug = companyNameToUse.toLowerCase().replace(/\s+/g, '-');
        console.log(`Company name changed. Redirecting to /dashboard/${newCompanySlug}...`);
        router.push(`/dashboard/${newCompanySlug}`);
        return; // Return early as we're redirecting
      }

      // Fetch the new data using the new company name
      console.log(`Fetching regenerated data for ${companyNameToUse}...`);
      const [
        proposalData,
        industryData,
      ] = await Promise.all([
        apiService.getFinalProposal(companyNameToUse),
        apiService.getIndustryInsights(companyNameToUse),
      ]);

      // Update state with new data
      setCompanyData(proposalData);
      setIndustryInsights(industryData);
      setIsEditing(false);

      // Show success message
      alert(`Analysis for ${proposalData.companyName} regenerated successfully!`);
      
      // Switch to overview tab
      setActiveTab('overview');
    } catch (err) {
      console.error('Error regenerating analysis:', err);
      setError(err instanceof Error ? err : new Error('Failed to regenerate analysis'));
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleGenerateNewAnalysis = async () => {
    if (!newCompanyName || !newCompanyUrl) {
      alert('Company name and URL are required');
      return;
    }
    
    try {
      setIsGeneratingNew(true);
      await apiService.generateAnalysis(newCompanyUrl, newCompanyName);
      const newCompanySlug = newCompanyName.toLowerCase().replace(/\s+/g, '-');
      router.push(`/dashboard/${newCompanySlug}`);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to generate new analysis'));
    } finally {
      setIsGeneratingNew(false);
    }
  };

  const renderSettingsTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
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
              </div>
              <div className="pt-4 flex space-x-4">
                <button 
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
                  onClick={handleSaveCompanyDetails}
                >
                  Save Changes
                </button>
                <button 
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm"
                  onClick={handleRegenerateAnalysis}
                  disabled={isRegenerating}
                >
                  {isRegenerating ? 'Regenerating...' : 'Regenerate Analysis'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
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
              </div>
              <div className="pt-4">
                <button 
                  className="px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm"
                  onClick={handleGenerateNewAnalysis}
                  disabled={isGeneratingNew}
                >
                  {isGeneratingNew ? 'Generating...' : 'Generate New Analysis'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Theme Settings</h3>
            <button
              onClick={cycleTheme}
              className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50"
            >
              Switch Theme
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleTogglePDFView = () => {
    if (pdfContentStatus === 'loading') {
      // Notify user that content is still generating
      alert("The personalized content for your PDF is being prepared. Please try again in a moment.");
      return;
    }
    
    if (pdfContentStatus === 'idle') {
      // Handle idle state - try to refresh content first
      refreshLLMContent();
      console.log("Starting to generate PDF content...");
      alert("Starting to prepare your PDF content. Please try again in a moment.");
      return;
    }
    
    console.log("Initiating PDF view with preloading");
    // Start preloading process for PDF
    setIsPDFPreloading(true);
    
    // Show the PDF - the PreloadedPDF component will handle the rest
    setShowPDF(true);
  };

  if (isLoading) {
    return (
      <div className={`flex min-h-screen ${themes[currentTheme].lightBg}`}>
        <div className="flex-1 p-8">
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${themes[currentTheme].lightBg}`}>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${themes[currentTheme].lightBg}`}>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Data Available</h2>
          <p className="text-gray-600 mb-4">No analysis found for this company.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const theme = themes[currentTheme];

  if (showPDF) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <div className="p-4 bg-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold">{companyData.companyName} AI Transformation Plan</h2>
          <button 
            onClick={() => setShowPDF(false)}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
          >
            Close PDF
          </button>
        </div>
        
        <DashboardPDF 
          companyData={companyData} 
          industryInsights={industryInsights || { industry: companyData.industry, industryInsights: [] }} 
          businessChallenges={(industryInsights as any)?.possiblePainPoints?.map((p: any) => p.description || p.title) || []}
          pdfOptions={{ useCache: true }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full ${isSidebarOpen ? 'w-64' : 'w-16'} ${themes[currentTheme].sidebar} text-white py-6 px-4 flex flex-col transition-width duration-300`}>
        <div className={`flex justify-between items-center mb-8 ${isSidebarOpen ? '' : 'flex-col items-start'}`}>
          <div className="flex-grow" />
          <button onClick={toggleSidebar} className="text-white">
            <i className={`ri-${isSidebarOpen ? 'close' : 'menu'}-line text-2xl`} />
          </button>
        </div>
        
        <nav className={`space-y-4 flex-grow flex flex-col ${isSidebarOpen ? 'items-start' : 'items-center'}`}>
          <div className={`flex ${isSidebarOpen ? 'flex-col' : 'flex-col items-center justify-center'}`}>
            {['overview', 'strategies', 'insights', 'businessChallenges', 'settings'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-4 py-2 rounded transition-colors text-lg flex items-center hover:bg-gray-700 ${
                  activeTab === tab ? themes[currentTheme].sidebarActive : ''
                }`}
                onMouseLeave={() => {
                  // Remove hover effect on mouse leave
                  const button = document.querySelector(`button[data-tab="${tab}"]`);
                  if (button) {
                    button.classList.remove(themes[currentTheme].sidebarActive);
                  }
                }}
                data-tab={tab}
              >
                <i className={`ri-${
                  tab === 'overview' ? 'dashboard' :
                  tab === 'strategies' ? 'lightbulb' :
                  tab === 'insights' ? 'line-chart' :
                  tab === 'businessChallenges' ? 'bubble-chart' :
                  'settings'
                }-line text-2xl mr-3`} />
                {isSidebarOpen && (
                  tab === 'businessChallenges' ? 'Challenges' :
                  tab === 'insights' ? 'Insights' :
                  tab.charAt(0).toUpperCase() + tab.slice(1)
                )}
              </button>
            ))}
          </div>
        </nav>

        <div className="mt-6">
        </div>

        <button 
          onClick={(e) => {
            e.stopPropagation(); // Prevent the click event from bubbling up
            handleTogglePDFView();
          }}
          className={`w-full text-left px-4 py-2 rounded hover:${themes[currentTheme].sidebarActive}`}
        >
          <i className={`ri-file-pdf-line mr-3 ${pdfContentStatus === 'loading' ? 'animate-pulse' : ''}`} />
          {isSidebarOpen && (
            <>
              {pdfContentStatus === 'loading' ? 'PDF Preparing...' : 'Export as PDF'}
              {pdfContentStatus === 'ready' && (
                <span className="ml-2 text-xs bg-green-500 text-white rounded-full px-2 py-0.5">Ready</span>
              )}
            </>
          )}
        </button>

        {/* Company Icon at the Bottom */}
        <div className="mt-auto flex items-center mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
               style={{ backgroundColor: themes[currentTheme].primary }}>
            {companyData.companyName.charAt(0)}
          </div>
          {isSidebarOpen && (
            <h2 className="text-lg font-semibold ml-2">{companyData.companyName}</h2>
          )}
        </div>
      </div>
                  
      {/* Main Content */}
      <main className={`flex-grow p-6 overflow-auto bg-background ${isSidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{companyData.companyName} AI Transformation Plan</h1>
          <h4 className="text-sm font-medium text-gray-500">Industry: {companyData.industry}</h4>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'overview' && companyData && (
            <OverviewTab 
              opportunities={companyData.aiOpportunities || []} 
              isLoading={isLoading} 
              error={error ? (error as any).toString() : undefined}
              theme={currentTheme}
              industry={companyData.industry || ''}
              industryData={industryInsights}
            />
          )}
          
          {activeTab === 'strategies' && companyData && (
            <StrategiesTab 
              opportunities={companyData.aiOpportunities || []} 
              isLoading={isLoading} 
              error={error ? (error as any).toString() : undefined}
              theme={currentTheme}
            />
          )}
          
          {activeTab === 'insights' && companyData && (
            <InsightsTab 
              industryInsights={industryInsights || undefined}
              businessContext={companyData.businessContext || ''}
              theme={currentTheme}
            />
          )}
          
          {activeTab === 'businessChallenges' && companyData && (
            <BusinessChallengesTab 
              opportunities={companyData.aiOpportunities || []} 
              isLoading={isLoading} 
              error={error ? (error as any).toString() : undefined}
              theme={currentTheme}
              industry={companyData.industry || ''}
              industryData={industryInsights}
            />
          )}
          
          {activeTab === 'settings' && renderSettingsTab()}
        </div>
      </main>
    </div>
  );
} 