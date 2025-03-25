import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();
const VERBOSE_LOGGING = false; // Set to true for detailed logs, including LLM outputs
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
// Helper function to clean JSON response
function cleanJsonResponse(text) {
    // Remove markdown code blocks if present
    text = text.replace(/```json\n/g, '').replace(/```\n/g, '').replace(/```/g, '');
    // Remove any leading/trailing whitespace
    text = text.trim();
    return text;
}
// New function to assess strategy relevance to pain points
async function assessPainPointRelevance(strategies, painPoints) {
    if (!painPoints || painPoints.length === 0) {
        return {};
    }
    console.log('Assessing strategy relevance to industry pain points');
    const relevancePrompt = `
    Evaluate how well each proposed AI strategy addresses the identified possible industry challenges.
    
    Possible Industry Pain Points:
    ${JSON.stringify(painPoints, null, 2)}
    
    AI Strategies:
    ${JSON.stringify(strategies, null, 2)}
    
    For each strategy and each possible pain point, assess:
    1. Relevance score (0-10) where 0 means "not relevant at all" and 10 means "perfectly addresses this pain point"
    2. Brief explanation of how this strategy typically helps companies address this common challenge
    3. Expected improvement range based on industry benchmarks (e.g., "20-30% reduction in processing time")
    
    Return only a valid JSON object with no markdown formatting:
    {
      "strategy_id": {
        "pain_point_id": {
          "relevanceScore": 8,
          "explanation": "This strategy addresses... by...",
          "expectedImprovement": "70% reduction in X"
        }
      }
    }
  `;
    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: relevancePrompt }] }],
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
        const relevanceMap = JSON.parse(cleanedResponse);
        // Transform into our expected format
        const transformedRelevances = {};
        // For each strategy
        Object.entries(relevanceMap).forEach(([strategyId, painPointMap]) => {
            transformedRelevances[strategyId] = [];
            // For each pain point relevance
            Object.entries(painPointMap).forEach(([painPointId, relevance]) => {
                // Ensure score is within 0-10 range
                const relevanceScore = Math.min(10, Math.max(0, relevance.relevanceScore || 0));
                transformedRelevances[strategyId].push({
                    painPointId,
                    relevanceScore,
                    explanation: relevance.explanation || "Addresses common industry challenges.",
                    expectedImprovement: relevance.expectedImprovement || "Moderate improvement expected"
                });
            });
            // Sort by relevance score descending (highest relevance first)
            transformedRelevances[strategyId].sort((a, b) => b.relevanceScore - a.relevanceScore);
        });
        return transformedRelevances;
    }
    catch (error) {
        console.error('Error parsing relevance assessment:', error);
        if (VERBOSE_LOGGING) {
            console.error('Raw response:', textResponse);
        }
        // Return empty relevances if parsing fails
        return {};
    }
}
// New function to assess strategy relevance to business challenges
async function assessBusinessChallengeRelevance(strategies, businessChallenges) {
    if (!businessChallenges || businessChallenges.length === 0) {
        return {};
    }
    console.log('Assessing strategy relevance to business challenges');
    // Process business challenges to handle string or object format
    const processedChallenges = businessChallenges.map((challenge, index) => {
        if (typeof challenge === 'string') {
            return {
                id: `challenge_${index + 1}`,
                description: challenge
            };
        }
        return {
            id: challenge.id || `challenge_${index + 1}`,
            name: challenge.name || '',
            description: challenge.description || challenge.name || '',
            category: challenge.category || '',
            priority: challenge.priority || 5
        };
    });
    const relevancePrompt = `
    Evaluate how well each proposed AI strategy addresses the identified company-specific business challenges.
    
    Business Challenges:
    ${JSON.stringify(processedChallenges, null, 2)}
    
    AI Strategies:
    ${JSON.stringify(strategies, null, 2)}
    
    For each strategy and each business challenge, assess:
    1. Relevance score (0-10) where 0 means "not relevant at all" and 10 means "perfectly addresses this challenge"
    2. Brief explanation of how this strategy directly helps address this specific business challenge
    3. Expected improvement based on typical implementations (e.g., "20-30% reduction in processing time")
    
    Return only a valid JSON object with no markdown formatting:
    {
      "strategy_id": {
        "challenge_id": {
          "relevanceScore": 8,
          "explanation": "This strategy addresses... by...",
          "expectedImprovement": "70% reduction in X"
        }
      }
    }
  `;
    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: relevancePrompt }] }],
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
        const relevanceMap = JSON.parse(cleanedResponse);
        // Transform into our expected format
        const transformedRelevances = {};
        // For each strategy
        Object.entries(relevanceMap).forEach(([strategyId, challengeMap]) => {
            transformedRelevances[strategyId] = [];
            // For each business challenge relevance
            Object.entries(challengeMap).forEach(([challengeId, relevance]) => {
                // Ensure score is within 0-10 range
                const relevanceScore = Math.min(10, Math.max(0, relevance.relevanceScore || 0));
                transformedRelevances[strategyId].push({
                    challengeId,
                    relevanceScore,
                    explanation: relevance.explanation || "Addresses key business challenge.",
                    expectedImprovement: relevance.expectedImprovement || "Significant improvement expected"
                });
            });
            // Sort by relevance score descending (highest relevance first)
            transformedRelevances[strategyId].sort((a, b) => b.relevanceScore - a.relevanceScore);
        });
        return transformedRelevances;
    }
    catch (error) {
        console.error('Error parsing business challenge relevance assessment:', error);
        if (VERBOSE_LOGGING) {
            console.error('Raw response:', textResponse);
        }
        // Return empty relevances if parsing fails
        return {};
    }
}
export async function validateStrategies(strategies, businessContext, industry, painPoints = [], businessChallenges = []) {
    console.log('Validating strategies');
    // First, assess pain point relevance
    const painPointRelevanceMap = await assessPainPointRelevance(strategies, painPoints);
    // Second, assess business challenge relevance
    const businessChallengeRelevanceMap = await assessBusinessChallengeRelevance(strategies, businessChallenges);
    const validationPrompt = `
    You are an AI validation expert who reviews AI transformation strategies.
    Evaluate the following strategies based on how well they align with the business context and industry.
    Improve any strategies that need refinement, and sort them by potential impact (highest first).
    
    IMPORTANT: All strategies MUST leverage Large Language Models (LLMs) as their PRIMARY technology.
    
    Acceptable LLM applications include:
    - Text-to-text: Traditional LLM applications where both input and output are text
    - Image-to-text: Multimodal LLM applications where images can be inputs, but the LLM processes them to produce text outputs
      (e.g., document analysis, visual content understanding, image-based Q&A)
    
    Strategies that should receive low validation scores include:
    - Traditional machine learning or deep learning models with no LLM component
    - Pure computer vision applications not utilizing LLMs
    - Image generation or text-to-image models
    - Audio processing or speech systems as the primary focus
    - Forecasting or prediction systems not powered by LLMs
    - Any system where an LLM is not the core reasoning/processing component
    
    For each strategy, evaluate it against these SPECIFIC criteria and assign points (maximum shown in brackets):
    
    1. Business Alignment [0-25 points]:
       - How well does the strategy align with the company's business model and objectives?
       - Does it address real business challenges identified in the context?
       - Will it create meaningful business value?
    
    2. Market Potential [0-25 points]:
       - Is there demonstrated market demand for this LLM-powered solution?
       - How significant is the potential market impact?
       - Does it provide a competitive advantage?
    
    3. Industry Relevance [0-25 points]:
       - How relevant is the strategy to industry trends and challenges?
       - Does it leverage industry-specific opportunities for LLM applications?
       - Is it aligned with industry best practices or innovations in LLM technology?
    
    4. LLM Suitability and Clarity [0-25 points]:
       - Is the strategy clearly articulated with the LLM as the primary intelligence?
       - Is it genuinely suited for an LLM solution rather than other AI technologies?
       - Does it leverage the unique capabilities of LLMs for understanding, reasoning, or generation?
       - Does it have a well-defined scope appropriate for LLM technology?
    
    Total Validation Score = Sum of all criteria (maximum 100 points)
    
    CRITICALLY IMPORTANT:
    1. Focus on whether the LLM is the "brain" doing the main processing/reasoning. The input modality (text or images) 
       is less important than whether an LLM is the core intelligence component.
    
    2. If a strategy would clearly be better implemented without an LLM as its core (e.g., using traditional ML, 
       pure computer vision, or statistical models), assign it a very low score (below 50) for the LLM Suitability criterion.
    
    3. Image-to-text applications utilizing multimodal LLMs (like GPT-4 Vision, Claude, Gemini) should receive
       normal validation scores if the LLM is doing the core understanding/reasoning.
    
    Provide a score for each criterion, along with an overall validation score.
    If the average validation score across all strategies is below 80, indicate that feedback is required.
    
    Business Context:
    ${businessContext}
    
    Industry:
    ${industry}
    
    Strategies:
    ${JSON.stringify(strategies, null, 2)}
    
    Return only a valid JSON object with no markdown formatting or other text:
    {
      "validatedStrategies": [
        {
          "id": "strategy_id",
          "title": "potentially revised title",
          "description": "potentially revised description",
          "impact": "High/Medium/Low",
          "complexity": "High/Medium/Low",
          "timeframe": "Short-term/Medium-term/Long-term",
          "category": "category name",
          "validationCriteria": {
            "businessAlignment": 20,
            "marketPotential": 18,
            "industryRelevance": 22,
            "clarity": 15
          },
          "validationScore": 75
        }
      ],
      "requiresFeedback": true/false (set to true if average validation score is below 80)
    }
  `;
    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: validationPrompt }] }],
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
        const validatedStrategies = jsonResponse.validatedStrategies;
        // Add pain point relevance data to each strategy
        validatedStrategies.forEach((strategy) => {
            strategy.painPointRelevances = painPointRelevanceMap[strategy.id] || [];
            strategy.businessChallengeRelevances = businessChallengeRelevanceMap[strategy.id] || [];
            // Ensure validation score is capped at 100 and at least 1
            strategy.validationScore = Math.min(100, Math.max(1, strategy.validationScore || 0));
            // Calculate clarity score if not provided
            if (!strategy.validationCriteria.clarity) {
                strategy.validationCriteria.clarity = 20;
            }
            // Recalculate total score from criteria
            if (strategy.validationCriteria.businessAlignment &&
                strategy.validationCriteria.marketPotential &&
                strategy.validationCriteria.industryRelevance &&
                strategy.validationCriteria.clarity) {
                const total = (strategy.validationCriteria.businessAlignment +
                    strategy.validationCriteria.marketPotential +
                    strategy.validationCriteria.industryRelevance +
                    strategy.validationCriteria.clarity);
                strategy.validationScore = Math.round(total);
            }
        });
        // Calculate average validation score
        const averageScore = validatedStrategies.reduce((sum, s) => sum + s.validationScore, 0) / validatedStrategies.length;
        return {
            strategies: validatedStrategies,
            requiresFeedback: jsonResponse.requiresFeedback || averageScore < 80,
            averageScore
        };
    }
    catch (error) {
        console.error('Error parsing AI response:', error);
        if (VERBOSE_LOGGING) {
            console.error('Raw response:', textResponse);
        }
        else {
            console.error('Error parsing LLM response (enable VERBOSE_LOGGING to see raw response)');
        }
        const defaultStrategies = strategies.map(s => ({
            ...s,
            validationScore: 75,
            validationCriteria: {
                businessAlignment: 20,
                marketPotential: 18,
                industryRelevance: 22,
                clarity: 15
            }
        }));
        return {
            strategies: defaultStrategies,
            requiresFeedback: false,
            averageScore: 75
        };
    }
}
