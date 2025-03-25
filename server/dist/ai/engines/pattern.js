import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
const VERBOSE_LOGGING = false;
// Helper function to clean JSON response
function cleanJsonResponse(text) {
    // Remove markdown code blocks if present
    text = text.replace(/```json\n/g, '').replace(/```\n/g, '').replace(/```/g, '');
    // Remove any leading/trailing whitespace
    text = text.trim();
    return text;
}
export async function generatePatterns(businessContext) {
    console.log('Generating business patterns');
    const patternPrompt = `
    You are an AI business consultant specialized in identifying business patterns and opportunities.
    Based on the following business context, identify 5-7 common business patterns or challenges 
    that might be addressed through AI technologies.
    
    Business Context:
    ${businessContext}
    
    Return only a valid JSON object with no markdown formatting or other text:
    {
      "patterns": [
        "pattern description 1",
        "pattern description 2",
        "etc..."
      ]
    }
  `;
    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: patternPrompt }] }],
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
        return jsonResponse.patterns || [];
    }
    catch (error) {
        console.error('Error parsing AI response:', error);
        console.error('Raw response:', textResponse);
        throw new Error('Failed to generate business patterns');
    }
}
