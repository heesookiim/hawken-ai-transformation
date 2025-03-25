import { NextResponse, NextRequest } from 'next/server';

// CORS headers to allow requests from our Vercel domain
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Heroku API URL without trailing slash
const HEROKU_API_URL = process.env.NEXT_PUBLIC_HEROKU_API_URL?.endsWith('/')
  ? process.env.NEXT_PUBLIC_HEROKU_API_URL.slice(0, -1)
  : process.env.NEXT_PUBLIC_HEROKU_API_URL || 'https://hawken-ai-transformation-27d8ee0ab1a5.herokuapp.com';

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { 
    status: 204,
    headers: corsHeaders,
  });
}

// Handle GET requests
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  // Build the path by joining all path segments
  const path = params.path.join('/');
  // Get search params
  const searchParams = request.nextUrl.search;
  
  // Construct the full URL to the Heroku test-results endpoint
  const url = `${HEROKU_API_URL}/test-results/${path}${searchParams}`;
  
  console.log(`[Test Results Route] Proxying GET request to: ${url}`);
  
  try {
    // Forward the request to the Heroku API
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Check if response is ok
    if (!response.ok) {
      console.error(`[Test Results Route] Heroku API returned status: ${response.status}`);
      return NextResponse.json(
        { error: `Heroku API returned status: ${response.status}` },
        { status: response.status, headers: corsHeaders }
      );
    }
    
    // Check Content-Type to handle binary responses
    const contentType = response.headers.get('Content-Type');
    
    // For JSON responses
    if (contentType?.includes('application/json')) {
      try {
        const data = await response.json();
        return NextResponse.json(data, {
          status: response.status,
          headers: corsHeaders,
        });
      } catch (jsonError) {
        console.error('[Test Results Route] Failed to parse JSON:', jsonError);
        return NextResponse.json(
          { error: 'Failed to parse JSON response' },
          { status: 500, headers: corsHeaders }
        );
      }
    }
    
    // For binary or other responses, forward the response as-is
    const blob = await response.blob();
    const headers = {
      ...corsHeaders,
      'Content-Type': contentType || 'application/octet-stream',
    };
    
    return new NextResponse(blob, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error(`[Test Results Route] Error proxying GET request to ${url}:`, error);
    
    // Return a 500 error
    return NextResponse.json(
      { error: 'Failed to proxy request to Heroku test-results endpoint' },
      { status: 500, headers: corsHeaders }
    );
  }
} 