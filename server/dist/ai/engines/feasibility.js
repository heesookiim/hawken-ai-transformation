import { GoogleGenerativeAI } from '@google/generative-ai';
const VERBOSE_LOGGING = false; // Set to true for detailed logs, including LLM outputs
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
// Helper function to clean JSON response
function cleanJsonResponse(text) {
    text = text.replace(/```json\n/g, '').replace(/```\n/g, '').replace(/```/g, '');
    return text.trim();
}
export async function checkFeasibility(strategies) {
    console.log('Analyzing feasibility of AI opportunities');
    const feasibilityPrompt = `
    You are an AI feasibility expert who evaluates AI implementation opportunities. Focus EXCLUSIVELY on strategies 
    where Large Language Models (LLMs) are the PRIMARY technology component.
    
    Acceptable LLM applications include:
    - Text-to-text: Traditional LLM applications where both input and output are text
    - Image-to-text: Multimodal LLM applications where images can be inputs, but the LLM processes them to produce text outputs
      (e.g., document analysis, visual content understanding, image-based Q&A)
    
    DO NOT favorably evaluate strategies that primarily rely on:
    - Traditional machine learning or deep learning models with no LLM component
    - Pure computer vision applications not utilizing LLMs
    - Image generation or text-to-image models
    - Audio processing or speech systems as the primary focus
    - Forecasting or prediction systems not powered by LLMs
    - Any system where an LLM is not the core reasoning/processing component
    
    All implementations being reviewed MUST be based on commercial foundation models like GPT-4 (including Vision), Claude, Gemini, 
    or similar models where the LLM is the primary reasoning component.
    
    For each strategy, provide a detailed feasibility analysis considering the following criteria with specific scoring guidelines:
    
    1. Technical Feasibility [0-25 points]:
       - Is the required LLM technology available and capable for this use case? (5 points)
       - Is it compatible with existing systems? (5 points)
       - How mature are the required LLM capabilities for this specific application? (5 points)
       - Are there proven case studies with similar LLM applications? (5 points)
       - Is the scope technically well-defined for an LLM-centric solution? (5 points)
    
    2. Resource Requirements Assessment [0-25 points]:
       - Are the necessary LLM implementation skills available in-house or easily acquired? (7 points)
       - Is the expected timeline reasonable for an LLM deployment? (6 points)
       - Is the cost of LLM API usage or fine-tuning proportional to expected benefits? (6 points)
       - Can the LLM implementation be phased? (6 points)
    
    3. Risk Assessment [0-25 points]:
       - How predictable are the outcomes of the LLM system? (6 points)
       - Are there mitigation strategies for LLM hallucinations and inaccuracies? (6 points)
       - Can potential negative impacts of LLM usage be contained? (7 points)
       - How likely is organizational resistance to LLM adoption? (6 points)
    
    4. Implementation Complexity [0-25 points]:
       - How many dependencies exist for the LLM implementation? (6 points)
       - How many stakeholders are involved in the LLM project? (6 points)
       - How much process change is required for LLM integration? (7 points)
       - How straightforward is the testing and validation of LLM outputs? (6 points)
    
    Total Feasibility Score = Sum of all criteria (maximum 100 points)
    The higher the score, the more feasible the implementation.
    
    For each strategy, provide:
    1. Detailed scores for each criterion
    2. An overall feasibility score
    3. Specific technical challenges identified (MAXIMUM 5), formatted as follows:
       "Challenge Title: Brief description of the challenge"
       
       For example: "Context Management: Ensuring sufficient context is provided to the LLM while staying within token limits"
    4. Resource requirements (MAXIMUM 5), formatted with the same title and description pattern
    5. Risk factors (MAXIMUM 5), formatted with the same title and description pattern
    6. Potential mitigation strategies (MAXIMUM 5), formatted with the same title and description pattern
    7. Recommended implementation approach
    
    CRITICALLY IMPORTANT:
    1. Focus on whether the LLM is the "brain" doing the main processing/reasoning. For multimodal strategies
       involving image inputs, evaluate them based on how well the LLM can understand and process those inputs.
    
    2. For multimodal image-to-text strategies, factor in additional considerations:
       - Visual data quality requirements should be assessed in technical feasibility
       - Appropriate multimodal model selection (GPT-4 Vision, Claude 3, Gemini Pro Vision) is critical
       - Evaluate preprocessing needs for document/image inputs
       - Consider integration requirements with document scanning or image capture systems
       - Evaluate the maturity of the multimodal LLM capabilities for the specific use case
    
    3. If a strategy does not have an LLM as its core intelligence (e.g., it's primarily using traditional ML or
       pure computer vision), assign it a very low feasibility score (below 40) and explain why
       in the technical feedback.
    
    Strategies:
    ${JSON.stringify(strategies, null, 2)}
    
    Return only a valid JSON object with no markdown formatting or other text:
    {
      "feasibilityAnalysis": [
        {
          "id": "strategy_id",
          "title": "strategy title",
          "description": "refined description",
          "impact": "impact level",
          "complexity": "complexity level",
          "timeframe": "implementation timeframe",
          "category": "category name",
          "feasibilityCriteria": {
            "technicalFeasibility": 20,
            "resourceRequirements": 15,
            "riskAssessment": 18,
            "implementationComplexity": 16
          },
          "feasibilityScore": 69,
          "technicalChallenges": ["challenge 1", "challenge 2"],
          "resourceRequirements": ["requirement 1", "requirement 2"],
          "riskFactors": ["risk 1", "risk 2"],
          "mitigationStrategies": ["strategy 1", "strategy 2"],
          "recommendedApproach": "detailed recommendation"
        }
      ],
      "technicalFeedback": "Technical feedback to be sent to strategy engine, or null if no feedback needed"
    }
  `;
    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: feasibilityPrompt }] }],
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
        const feasibilityAnalysis = jsonResponse.feasibilityAnalysis;
        // Ensure scores match criteria and are within constraints, and preserve pain point relevance
        feasibilityAnalysis.forEach((strategy, index) => {
            // Preserve pain point and business challenge relevance data from the original strategy
            const originalStrategy = strategies[index];
            strategy.painPointRelevances = originalStrategy?.painPointRelevances;
            strategy.businessChallengeRelevances = originalStrategy?.businessChallengeRelevances;
            if (strategy.feasibilityCriteria) {
                // Validate ranges for all criteria
                strategy.feasibilityCriteria.technicalFeasibility =
                    Math.min(25, Math.max(0, strategy.feasibilityCriteria.technicalFeasibility));
                strategy.feasibilityCriteria.resourceRequirements =
                    Math.min(25, Math.max(0, strategy.feasibilityCriteria.resourceRequirements));
                strategy.feasibilityCriteria.riskAssessment =
                    Math.min(25, Math.max(0, strategy.feasibilityCriteria.riskAssessment));
                strategy.feasibilityCriteria.implementationComplexity =
                    Math.min(25, Math.max(0, strategy.feasibilityCriteria.implementationComplexity));
                // Calculate score from criteria
                const calculatedScore = strategy.feasibilityCriteria.technicalFeasibility +
                    strategy.feasibilityCriteria.resourceRequirements +
                    strategy.feasibilityCriteria.riskAssessment +
                    strategy.feasibilityCriteria.implementationComplexity;
                // Override the provided score with calculated score
                strategy.feasibilityScore = calculatedScore;
            }
            // Ensure arrays are limited to 5 items
            if (strategy.technicalChallenges && strategy.technicalChallenges.length > 5) {
                strategy.technicalChallenges = strategy.technicalChallenges.slice(0, 5);
            }
            if (strategy.resourceRequirements && strategy.resourceRequirements.length > 5) {
                strategy.resourceRequirements = strategy.resourceRequirements.slice(0, 5);
            }
            if (strategy.riskFactors && strategy.riskFactors.length > 5) {
                strategy.riskFactors = strategy.riskFactors.slice(0, 5);
            }
            if (strategy.mitigationStrategies && strategy.mitigationStrategies.length > 5) {
                strategy.mitigationStrategies = strategy.mitigationStrategies.slice(0, 5);
            }
        });
        // Calculate average feasibility score
        const averageScore = feasibilityAnalysis.reduce((sum, s) => sum + s.feasibilityScore, 0) / feasibilityAnalysis.length;
        // Determine if refinement is needed (score below 75)
        const requiresRefinement = averageScore < 75;
        return {
            strategies: feasibilityAnalysis,
            technicalFeedback: jsonResponse.technicalFeedback || null,
            averageScore,
            requiresRefinement
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
        const defaultAnalysis = strategies.map(s => {
            // Preserve pain point relevance data in the default fallback
            return {
                ...s,
                feasibilityScore: 75,
                feasibilityCriteria: {
                    technicalFeasibility: 20,
                    resourceRequirements: 18,
                    riskAssessment: 19,
                    implementationComplexity: 18
                },
                technicalChallenges: ["Integration complexity", "Data quality requirements"],
                resourceRequirements: ["AI expertise", "Development team", "Infrastructure"],
                riskFactors: ["Technical risks", "Resource availability"],
                mitigationStrategies: ["Phased implementation", "Expert consultation"],
                recommendedApproach: "Start with a pilot project to validate approach",
                // Preserve pain point relevances
                painPointRelevances: s.painPointRelevances,
                businessChallengeRelevances: s.businessChallengeRelevances
            };
        });
        return {
            strategies: defaultAnalysis,
            technicalFeedback: null,
            averageScore: 75,
            requiresRefinement: false
        };
    }
}
