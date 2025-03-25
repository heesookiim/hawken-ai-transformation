'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { apiService } from '@/lib/api';

export default function AnalysisLoadingPage() {
  const router = useRouter();
  const params = useParams<{ company: string }>();
  const company = params?.company || 'company';
  const [progress, setProgress] = useState(10);
  const [status, setStatus] = useState('Starting analysis...');
  const [error, setError] = useState('');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Check if the analysis is complete
        const cacheStatus = await apiService.checkCacheStatus(company as string);
        
        if (cacheStatus.exists && cacheStatus.files?.some(f => f.name === 'final_proposal.json')) {
          // Analysis is complete, redirect to dashboard
          router.push(`/dashboard/${company}`);
        } else {
          // Update progress for visual feedback
          setProgress(prev => Math.min(prev + 5, 95));
          setStatus(`We're analyzing the website and generating AI strategies. This process may take several minutes to complete.`);
          
          // Check again in a few seconds
          setTimeout(checkStatus, 5000);
        }
      } catch (error) {
        console.error('Error checking analysis status:', error);
        setError('Failed to check analysis status. Please try again.');
      }
    };

    checkStatus();
  }, [company, router]);

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen p-4 mx-auto">
      <h1 className="mb-6 text-3xl font-bold">Analyzing {company}</h1>
      
      <div className="w-full max-w-md mb-8">
        <Progress 
          value={progress} 
          className="h-3 mb-2 border border-border rounded-full" 
        />
        <p className="text-center text-muted-foreground">{status}</p>
      </div>

      {error && (
        <div className="p-4 mb-6 text-red-500 border border-red-300 rounded-md bg-red-50">
          {error}
        </div>
      )}
    </div>
  );
} 