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
    
    // Get the response body
    const data = await response.json();
    
    // Return the response with CORS headers
    return NextResponse.json(data, {
      status: response.status,
      headers: corsHeaders,
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