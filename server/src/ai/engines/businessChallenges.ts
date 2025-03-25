import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
const VERBOSE_LOGGING = false;

// Helper function to clean JSON response
function cleanJsonResponse(text: string): string {
  // Remove markdown code blocks if present
  text = text.replace(/```json\n/g, '').replace(/```\n/g, '').replace(/```/g, '');
  // Remove any leading/trailing whitespace
  text = text.trim();
  return text;
}

export async function generateBusinessChallenges(businessContext: string): Promise<string[]> {
  console.log('Generating business challenges');
  
  const prompt = `
    You are an AI business consultant specialized in identifying business challenges and opportunities.
    Based on the following business context, identify 5-7 common business challenges or issues
    that could be addressed or improved with AI solutions.
    
    Business Context:
    ${businessContext}
    
    For each business challenge:
    1. Clearly articulate the specific challenge or inefficiency
    2. Provide sufficient detail to understand the business impact
    3. Ensure each challenge is distinct from others
    4. Focus on actual pain points, not just general improvements
    
    Format your response as a valid JSON array of strings, each describing a single business challenge.
    Keep each challenge description to 2-3 sentences.
    
    Example:
    [
      "High customer churn due to inconsistent service quality across channels and lack of personalization, resulting in revenue loss.",
      "Manual data processing consuming 30+ hours weekly, leading to reporting delays and decision-making based on outdated information."
    ]
  `;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192
    }
  });

  const response = result.response;
  const textResponse = response.text();
  
  try {
    const cleanedResponse = cleanJsonResponse(textResponse);
    if (VERBOSE_LOGGING) {
      console.log('Cleaned response:', cleanedResponse);
    }
    
    const jsonResponse = JSON.parse(cleanedResponse);
    return Array.isArray(jsonResponse) ? jsonResponse : [];
  } catch (error) {
    console.error('Error generating business challenges:', error);
    throw new Error('Failed to generate business challenges');
  }
} 