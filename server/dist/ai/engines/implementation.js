import { GoogleGenerativeAI } from '@google/generative-ai';
const VERBOSE_LOGGING = false; // Set to true for detailed logs, including LLM outputs
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
// Helper function to clean JSON response
function cleanJsonResponse(text) {
    // Remove markdown code blocks if present
    text = text.replace(/```json\n/g, '').replace(/```\n/g, '').replace(/```/g, '');
    // Remove any leading/trailing whitespace
    text = text.trim();
    // Replace problematic control characters
    text = text.replace(/[\u0000-\u001F]+/g, ' ');
    // Handle escaped backslashes before quotes to prevent invalid escaping
    text = text.replace(/\\(?=[^"\\])/g, '\\\\');
    // Handle unescaped quotes in strings (risky, use with caution)
    // This attempts to fix issues where the model generates quotes inside string values
    let inString = false;
    let result = '';
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const prevChar = i > 0 ? text[i - 1] : '';
        if (char === '"' && prevChar !== '\\') {
            inString = !inString;
            result += char;
        }
        else if (char === '"' && prevChar === '\\' && inString) {
            // Properly escaped quote within a string
            result += char;
        }
        else if (char === '"' && inString) {
            // Unescaped quote within a string - escape it
            result += '\\"';
        }
        else {
            result += char;
        }
    }
    // Final attempt: If all else fails, try to extract just the JSON part
    try {
        JSON.parse(result);
        return result;
    }
    catch (error) {
        console.log("Initial cleaning failed, attempting stronger cleaning...");
        // If parsing still fails, apply more aggressive cleaning
        // This is a last resort that might modify the content but at least returns valid JSON
        let cleaned = text
            .replace(/\\'/g, "'")
            .replace(/\\"/g, '"')
            .replace(/"/g, '"')
            .replace(/"/g, '"')
            .replace(/'/g, "'")
            .replace(/'/g, "'");
        // Replace all control characters and problematic characters
        cleaned = cleaned.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
        return cleaned;
    }
}
// Error types for better error handling
export class ImplementationPlanError extends Error {
    constructor(message, details) {
        super(message);
        this.details = details;
        this.name = 'ImplementationPlanError';
    }
}
export class NoValidStrategiesError extends ImplementationPlanError {
    constructor(message = 'No valid LLM strategies could be identified') {
        super(message);
        this.name = 'NoValidStrategiesError';
    }
}
export class ParseError extends ImplementationPlanError {
    constructor(message, originalError) {
        super(message, originalError);
        this.originalError = originalError;
        this.name = 'ParseError';
    }
}
// Default options
const DEFAULT_OPTIONS = {
    failOnError: false,
    requireMinimumStrategies: false,
    minimumStrategies: 1,
    allowPartialSuccess: true,
    validateLLMFeasibility: true,
    fallbackToGeneric: true
};
// Function to create generic fallback implementation plan
function createGenericImplementationPlan(strategy) {
    return {
        ...strategy,
        keyBenefits: [
            "Improved user experience",
            "Reduced manual effort",
            "Enhanced information processing",
            "Greater scalability",
            "Faster response times"
        ].slice(0, 3 + Math.floor(Math.random() * 3)), // Random 3-5 benefits
        implementationSteps: [
            "LLM Selection: Choose appropriate LLM model based on requirements",
            "Knowledge Base Setup: Gather and structure company data for LLM context",
            "Integration Development: Connect LLM APIs with existing systems",
            "Testing & Refinement: Evaluate LLM responses and refine prompts",
            "Deployment & Monitoring: Launch with continuous quality monitoring"
        ],
        feasibilityScore: 75 + Math.floor(Math.random() * 10) // Random 75-84
    };
}
// Function to validate if a strategy can be implemented with LLMs
function validateLLMFeasibility(strategy) {
    // Consider a strategy valid for LLM implementation if it meets these criteria:
    // 1. Has a category related to LLM capabilities
    // 2. Description focuses on text processing, understanding, or generation
    const validCategories = [
        'conversation', 'content generation', 'text analysis',
        'knowledge management', 'visual understanding', 'automation'
    ];
    // Check if the category is valid
    const categoryValid = strategy.category &&
        validCategories.includes(strategy.category.toLowerCase());
    // Check if the description mentions LLM-related terms
    const llmKeywords = [
        'llm', 'language model', 'ai model', 'gpt', 'claude', 'gemini',
        'text generation', 'understanding', 'analysis', 'processing'
    ];
    const descriptionValid = strategy.description &&
        llmKeywords.some(keyword => strategy.description.toLowerCase().includes(keyword));
    return Boolean(categoryValid || descriptionValid);
}
export async function createImplementationPlan(strategies, options = {}) {
    console.log('Creating implementation plans');
    // Merge provided options with defaults
    const config = { ...DEFAULT_OPTIONS, ...options };
    // Handle empty strategies array
    if (!strategies || strategies.length === 0) {
        const error = new NoValidStrategiesError('No strategies provided to implementation planner');
        if (config.failOnError) {
            throw error;
        }
        console.warn(error.message);
        return [];
    }
    // Filter strategies if LLM feasibility validation is enabled
    let validStrategies = strategies;
    if (config.validateLLMFeasibility) {
        validStrategies = strategies.filter(validateLLMFeasibility);
        if (validStrategies.length === 0) {
            const error = new NoValidStrategiesError('None of the provided strategies can be implemented with LLMs');
            if (config.failOnError) {
                throw error;
            }
            console.warn(error.message);
            // Return generic plans if fallback is enabled, otherwise empty array
            return config.fallbackToGeneric
                ? strategies.map(createGenericImplementationPlan)
                : [];
        }
        if (validStrategies.length < strategies.length) {
            console.warn(`Filtered out ${strategies.length - validStrategies.length} strategies that cannot be implemented with LLMs`);
        }
    }
    // Check if we have enough valid strategies
    if (config.requireMinimumStrategies &&
        validStrategies.length < (config.minimumStrategies || 1)) {
        const error = new NoValidStrategiesError(`Not enough valid strategies. Required: ${config.minimumStrategies}, Found: ${validStrategies.length}`);
        if (config.failOnError) {
            throw error;
        }
        console.warn(error.message);
        // If fallback is enabled, generate enough generic plans to meet the minimum
        if (config.fallbackToGeneric) {
            const genericCount = (config.minimumStrategies || 1) - validStrategies.length;
            return [
                ...validStrategies.map(createGenericImplementationPlan),
                ...Array(genericCount).fill(0).map((_, i) => createGenericImplementationPlan({
                    id: `generic_strategy_${i + 1}`,
                    title: `Generic AI Strategy ${i + 1}`,
                    description: "A general-purpose AI strategy using LLMs for business process improvement.",
                    impact: "Medium",
                    complexity: "Medium",
                    timeframe: "Medium-term",
                    category: "automation"
                }))
            ];
        }
        return validStrategies.map(createGenericImplementationPlan);
    }
    const implementationPrompt = `
    You are an AI implementation expert with deep knowledge of AI technologies and project management.
    Analyze each strategy and provide detailed implementation insights. Focus EXCLUSIVELY on strategies 
    where Large Language Models (LLMs) are the PRIMARY technology component.
    
    Acceptable LLM applications include:
    - Text-to-text: Traditional LLM applications where both input and output are text
    - Image-to-text: Multimodal LLM applications where images can be inputs, but the LLM processes them to produce text outputs
      (e.g., document analysis, visual content understanding, image-based Q&A)
    
    All implementations MUST be based on commercial foundation models like GPT-4 (including Vision), Claude, Gemini, 
    or similar models where the LLM is the primary reasoning component.
    
    Consider technical feasibility, resource requirements, and potential challenges specific to LLM implementations.
    
    For each strategy, provide:
    - Key benefits (3-5 bullet points) specifically related to the advantages of using LLMs for this application
    - Implementation steps (MAXIMUM 5 KEY STEPS, no more than 5 steps), formatted as follows:
      "Step Title: Brief description of the step" 
      
      For example:
      "Knowledge Base Creation: Gather and structure relevant company data to integrate with the LLM through a RAG approach"
      
      You can also use bullet points in the description by formatting as:
      "LLM Selection & Integration:
      - Evaluate suitable LLM options based on specific requirements
      - Set up API connections or deploy selected models
      - Configure appropriate context windows and response parameters"
    - A feasibility score (0-100)
    
    IMPORTANT: For image-to-text strategies using multimodal LLMs, include appropriate implementation 
    steps for handling image inputs, such as:
    - Image preprocessing requirements (scaling, normalization, enhancement)
    - Image input validation and quality assurance mechanisms
    - Considerations for image quality and formatting
    - Methods for combining image and text context
    - Appropriate multimodal LLM selection (GPT-4V, Claude 3 Opus, Gemini Pro Vision)
    - Integration with document scanning or image capture systems
    - Testing protocols specifically for visual inputs
    
    VERY IMPORTANT FORMATTING INSTRUCTIONS:
    1. Avoid using any special characters, control characters, or non-standard punctuation in your output.
    2. Use only basic ASCII characters when possible.
    3. Keep descriptions plain and simple without complex formatting.
    4. Avoid using quotes within string values, use alternate punctuation if needed.
    5. For bullet points, use simple hyphens (-) rather than special Unicode bullets.
    6. Do not use any special line breaks, tabs, or invisible control characters.
    
    Strategies:
    ${JSON.stringify(validStrategies, null, 2)}
    
    Return only a valid JSON object with no markdown formatting or other text:
    {
      "implementationPlans": [
        {
          "id": "strategy_id",
          "title": "strategy title",
          "description": "strategy description",
          "impact": "impact level",
          "complexity": "complexity level",
          "timeframe": "implementation timeframe",
          "category": "category name",
          "keyBenefits": ["benefit 1", "benefit 2", "benefit 3"],
          "implementationSteps": ["step 1", "step 2", "step 3", "step 4", "step 5"],
          "feasibilityScore": 85
        }
      ]
    }
  `;
    try {
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: implementationPrompt }] }],
            generationConfig: {
                temperature: 0.1, // Low temperature for more deterministic output
                topK: 1,
                topP: 0.7,
                maxOutputTokens: 8192
            }
        });
        const response = result.response;
        const textResponse = response.text();
        // Track which strategies failed parsing (if partial success is allowed)
        const failedStrategyIds = new Set();
        // Create a mapping of original strategies by ID for easier lookup
        const strategiesById = strategies.reduce((map, strategy) => {
            map[strategy.id] = strategy;
            return map;
        }, {});
        try {
            const cleanedResponse = cleanJsonResponse(textResponse);
            if (VERBOSE_LOGGING) {
                console.log('Cleaned response:', cleanedResponse);
            }
            let jsonResponse;
            try {
                jsonResponse = JSON.parse(cleanedResponse);
            }
            catch (parseError) {
                console.error('Failed to parse initial cleaned response, attempting manual extraction');
                // Try to manually extract JSON object
                const matches = cleanedResponse.match(/\{[\s\S]*\}/);
                if (matches && matches[0]) {
                    try {
                        jsonResponse = JSON.parse(matches[0]);
                        console.log('Successfully extracted JSON via regex');
                    }
                    catch (err) {
                        // If that fails too, throw the original error
                        console.error('Manual extraction failed as well');
                        throw new ParseError('Failed to parse response despite multiple cleaning attempts', parseError);
                    }
                }
                else {
                    throw new ParseError('Failed to extract JSON structure from response', parseError);
                }
            }
            // Validate response structure 
            if (!jsonResponse || !jsonResponse.implementationPlans || !Array.isArray(jsonResponse.implementationPlans)) {
                throw new ImplementationPlanError('Invalid response structure: missing implementationPlans array');
            }
            // Edge case: Empty implementation plans array
            if (jsonResponse.implementationPlans.length === 0) {
                if (config.failOnError) {
                    throw new ImplementationPlanError('LLM returned empty implementation plans array');
                }
                console.warn('LLM returned empty implementation plans, using fallbacks');
                return config.fallbackToGeneric
                    ? validStrategies.map(createGenericImplementationPlan)
                    : [];
            }
            // Process each implementation plan, handling data validation issues
            const processedPlans = [];
            for (const plan of jsonResponse.implementationPlans) {
                try {
                    // Basic validation
                    if (!plan.id || !strategiesById[plan.id]) {
                        console.warn(`Plan has invalid or unknown id: ${plan.id}`);
                        failedStrategyIds.add(plan.id || 'unknown');
                        continue;
                    }
                    // Get the original strategy for preserving data like painPointRelevances
                    const originalStrategy = strategiesById[plan.id];
                    // Validate and fix required fields
                    const cleanPlan = {
                        ...plan,
                        // Preserve original data
                        title: plan.title || originalStrategy.title,
                        description: plan.description || originalStrategy.description,
                        impact: plan.impact || originalStrategy.impact,
                        complexity: plan.complexity || originalStrategy.complexity,
                        timeframe: plan.timeframe || originalStrategy.timeframe,
                        category: plan.category || originalStrategy.category,
                        painPointRelevances: originalStrategy.painPointRelevances,
                        businessChallengeRelevances: originalStrategy.businessChallengeRelevances,
                        // Validate and clean arrays
                        keyBenefits: Array.isArray(plan.keyBenefits)
                            ? plan.keyBenefits.filter(Boolean).slice(0, 5)
                            : ['Improved efficiency', 'Enhanced accuracy', 'Better user experience'],
                        implementationSteps: Array.isArray(plan.implementationSteps)
                            ? plan.implementationSteps.filter(Boolean).slice(0, 5)
                            : ["LLM Selection", "Integration", "Testing", "Deployment", "Monitoring"],
                        // Validate and constrain score
                        feasibilityScore: typeof plan.feasibilityScore === 'number'
                            ? Math.min(100, Math.max(0, plan.feasibilityScore))
                            : 75
                    };
                    processedPlans.push(cleanPlan);
                }
                catch (planError) {
                    console.error(`Error processing plan for strategy ${plan.id}:`, planError);
                    failedStrategyIds.add(plan.id || 'unknown');
                    if (!config.allowPartialSuccess && config.failOnError) {
                        throw new ImplementationPlanError('Failed to process an implementation plan', planError);
                    }
                }
            }
            // Check if we have enough valid plans
            if (processedPlans.length === 0) {
                if (config.failOnError) {
                    throw new ImplementationPlanError('No valid implementation plans could be processed');
                }
                console.warn('No valid implementation plans, using fallbacks');
                return config.fallbackToGeneric
                    ? validStrategies.map(createGenericImplementationPlan)
                    : [];
            }
            if (config.requireMinimumStrategies &&
                processedPlans.length < (config.minimumStrategies || 1)) {
                if (config.failOnError) {
                    throw new ImplementationPlanError(`Not enough valid plans. Required: ${config.minimumStrategies}, Found: ${processedPlans.length}`);
                }
                console.warn(`Not enough valid plans. Required: ${config.minimumStrategies}, Found: ${processedPlans.length}`);
                // If fallback is enabled and we allow partial success, supplement with generic plans
                if (config.fallbackToGeneric) {
                    // Find strategies that failed and create generic plans for them
                    const failedStrategies = validStrategies.filter(s => failedStrategyIds.has(s.id));
                    const genericPlans = failedStrategies.map(createGenericImplementationPlan);
                    // If we still need more, create completely generic plans
                    const remainingCount = (config.minimumStrategies || 1) - (processedPlans.length + genericPlans.length);
                    if (remainingCount > 0) {
                        for (let i = 0; i < remainingCount; i++) {
                            genericPlans.push(createGenericImplementationPlan({
                                id: `generic_strategy_${i + 1}`,
                                title: `Generic AI Strategy ${i + 1}`,
                                description: "A general-purpose AI strategy using LLMs for business process improvement.",
                                impact: "Medium",
                                complexity: "Medium",
                                timeframe: "Medium-term",
                                category: "automation"
                            }));
                        }
                    }
                    return [...processedPlans, ...genericPlans];
                }
            }
            // Check if we're missing plans for some strategies, and add fallbacks if allowed
            if (config.fallbackToGeneric) {
                const coveredIds = new Set(processedPlans.map(p => p.id));
                const missingStrategies = validStrategies.filter(s => !coveredIds.has(s.id));
                if (missingStrategies.length > 0) {
                    console.warn(`Creating fallback plans for ${missingStrategies.length} strategies missing from LLM response`);
                    const fallbackPlans = missingStrategies.map(createGenericImplementationPlan);
                    return [...processedPlans, ...fallbackPlans];
                }
            }
            return processedPlans;
        }
        catch (error) {
            console.error('Error parsing AI response:', error);
            if (VERBOSE_LOGGING) {
                console.error('Raw response:', textResponse);
            }
            else {
                console.error('Error parsing LLM response (enable VERBOSE_LOGGING to see raw response)');
            }
            // Log specific information about JSON structure
            try {
                if (textResponse) {
                    // Log the problematic position if it's a SyntaxError
                    if (error instanceof SyntaxError && error.message.includes('position')) {
                        const match = error.message.match(/position (\d+)/);
                        const position = match ? parseInt(match[1]) : -1;
                        if (position >= 0) {
                            // Extract context around the error position
                            const start = Math.max(0, position - 30);
                            const end = Math.min(textResponse.length, position + 30);
                            const context = textResponse.substring(start, end);
                            console.error(`Error context (around position ${position}):`);
                            console.error('...' + context + '...');
                            console.error('Error position indicated by ^:');
                            console.error('...' + ' '.repeat(Math.min(30, position - start)) + '^' + '...');
                            // Check for control characters in the vicinity
                            const nearbyChars = textResponse.substring(Math.max(0, position - 5), Math.min(textResponse.length, position + 5));
                            console.error('Characters near error (showing char codes):');
                            for (let i = 0; i < nearbyChars.length; i++) {
                                const char = nearbyChars[i];
                                console.error(`Position ${position - 5 + i}: '${char}' (char code: ${char.charCodeAt(0)})`);
                            }
                        }
                    }
                }
            }
            catch (logError) {
                console.error('Error while trying to log detailed error information:', logError);
            }
            // Throw error if configured to fail on error
            if (config.failOnError) {
                if (error instanceof ImplementationPlanError) {
                    throw error;
                }
                else {
                    throw new ImplementationPlanError('Failed to generate implementation plans', error);
                }
            }
            // Otherwise return fallback plans
            if (config.fallbackToGeneric) {
                console.warn('Using generic implementation plans due to error');
                return validStrategies.map(createGenericImplementationPlan);
            }
            else {
                return [];
            }
        }
    }
    catch (callError) {
        console.error('Error calling AI model:', callError);
        // Throw error if configured to fail on error
        if (config.failOnError) {
            throw new ImplementationPlanError('AI model call failed', callError);
        }
        // Otherwise return fallback plans
        if (config.fallbackToGeneric) {
            console.warn('Using generic implementation plans due to AI model call failure');
            return validStrategies.map(createGenericImplementationPlan);
        }
        else {
            return [];
        }
    }
}
