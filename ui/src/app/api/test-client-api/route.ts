import { NextRequest, NextResponse } from 'next/server';
import { apiService } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { functionToTest, ...params } = body;
    
    console.log(`Testing client-side API function: ${functionToTest} with params:`, params);
    
    if (functionToTest === 'getPreGeneratedLLMContent') {
      const { companyName } = params;
      if (!companyName) {
        return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
      }
      
      // Call the API function
      const result = await apiService.getPreGeneratedLLMContent(companyName);
      return NextResponse.json({ success: true, result });
    }
    
    // Add other functions to test if needed
    
    return NextResponse.json({
      error: `Function ${functionToTest} not supported for testing` 
    }, { status: 400 });
  } catch (error) {
    console.error('Error in test-client-api:', error);
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 