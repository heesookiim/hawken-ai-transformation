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
    return text;
}
/**
 * Performs lightweight validation of strategies before they're sent to implementation planning.
 * This helps identify potential issues early without being overly strict.
 *
 * @param strategies The strategies to validate
 * @param options Configuration options for validation behavior
 * @returns Object containing validated strategies and metadata about validation
 */
export function validateStrategiesBeforeImplementation(strategies, options = { logWarnings: true, enrichWithWarnings: true }) {
    const warnings = [];
    const validCategories = [
        'conversation', 'content generation', 'text analysis',
        'knowledge management', 'visual understanding', 'automation', 'other'
    ];
    // Non-LLM keywords that might indicate a strategy isn't LLM-focused
    const nonLlmKeywords = [
        'neural network', 'deep learning', 'regression', 'classification algorithm',
        'decision tree', 'data mining', 'clustering', 'forecasting model',
        'recommender system', 'anomaly detection', 'computer vision', 'image generation',
        'image recognition', 'predictive analysis', 'statistical model', 'data warehousing'
    ];
    // LLM-related keywords that indicate a strategy is LLM-friendly
    const llmKeywords = [
        'llm', 'language model', 'gpt', 'claude', 'gemini', 'palm', 'text generation',
        'understanding', 'processing', 'conversation', 'chatbot', 'response generation',
        'content creation', 'analysis', 'summarization', 'knowledge extraction',
        'semantic search', 'embedding', 'question answering', 'rag', 'retrieval augmented'
    ];
    // Check each strategy for potential issues
    for (const strategy of strategies) {
        const lowercaseTitle = strategy.title.toLowerCase();
        const lowercaseDesc = strategy.description.toLowerCase();
        const content = `${lowercaseTitle} ${lowercaseDesc}`;
        // Check for valid category
        if (!strategy.category || !validCategories.includes(strategy.category.toLowerCase())) {
            warnings.push({
                strategyId: strategy.id,
                message: `Strategy has invalid category: "${strategy.category || 'undefined'}"`,
                severity: 'medium'
            });
        }
        // Check for non-LLM keywords
        const nonLlmMatches = nonLlmKeywords.filter(keyword => content.includes(keyword));
        if (nonLlmMatches.length > 0) {
            warnings.push({
                strategyId: strategy.id,
                message: `Strategy contains non-LLM technology keywords: ${nonLlmMatches.join(', ')}`,
                severity: nonLlmMatches.length > 2 ? 'high' : 'medium'
            });
        }
        // Check for absence of LLM keywords
        const llmMatches = llmKeywords.filter(keyword => content.includes(keyword));
        if (llmMatches.length === 0) {
            warnings.push({
                strategyId: strategy.id,
                message: 'Strategy does not mention any LLM-related technologies',
                severity: 'high'
            });
        }
        // Check for strategy descriptions that are too vague
        if (strategy.description && strategy.description.length < 50) {
            warnings.push({
                strategyId: strategy.id,
                message: 'Strategy description is too short to determine feasibility',
                severity: 'low'
            });
        }
        // Check for specific problem domains that are typically not well-suited for LLMs
        const problemKeywords = [
            'real-time', 'latency-sensitive', 'safety-critical', 'control system',
            'autonomous vehicle', 'mission critical', 'embedded system'
        ];
        const problemMatches = problemKeywords.filter(keyword => content.includes(keyword));
        if (problemMatches.length > 0) {
            warnings.push({
                strategyId: strategy.id,
                message: `Strategy targets problem domains that may not be suitable for LLMs: ${problemMatches.join(', ')}`,
                severity: 'medium'
            });
        }
    }
    // Log warnings if requested
    if (options.logWarnings && warnings.length > 0) {
        console.warn(`Found ${warnings.length} potential issues in ${strategies.length} strategies:`);
        warnings.forEach(warning => {
            console.warn(`[${warning.severity.toUpperCase()}] Strategy ${warning.strategyId}: ${warning.message}`);
        });
    }
    // Enrich strategies with warnings if requested
    let enrichedStrategies = strategies;
    if (options.enrichWithWarnings) {
        enrichedStrategies = strategies.map(strategy => {
            const strategyWarnings = warnings.filter(w => w.strategyId === strategy.id);
            if (strategyWarnings.length === 0) {
                return strategy;
            }
            return {
                ...strategy,
                implementationWarnings: strategyWarnings.map(w => w.message),
                implementationRisk: strategyWarnings.some(w => w.severity === 'high') ? 'high' :
                    strategyWarnings.some(w => w.severity === 'medium') ? 'medium' : 'low'
            };
        });
    }
    return {
        strategies: enrichedStrategies,
        warnings,
        allValid: warnings.length === 0 || !warnings.some(w => w.severity === 'high')
    };
}
export async function createStrategies(businessChallenges, industryInsights, feedback) {
    console.log('Creating AI transformation strategies');
    // We no longer need to handle the legacy format
    const processedBusinessChallenges = businessChallenges;
    let feedbackSection = '';
    if (feedback && feedback.strategies.length > 0) {
        feedbackSection = `
    Previous strategies that need improvement:
    ${JSON.stringify(feedback.strategies, null, 2)}
    
    Feedback comments:
    ${feedback.feedbackComments.join('\n')}
    
    Additional industry context:
    ${feedback.industryContext || 'No additional context'}
    
    Please refine these strategies by addressing the feedback. Keep what works well, and improve the areas with low scores.
    For strategies with validation scores above 80, maintain their strengths while addressing any weaknesses.
    For strategies with low validation scores (below 80), consider more significant revisions or replacements.
    `;
    }
    const strategyPrompt = `
    You are an AI transformation consultant specializing in creating strategic opportunities.
    Based on the following business challenges and industry insights, generate 
    3-5 specific AI transformation opportunities that drive modernization, automation, or growth for this company.
    
    IMPORTANT: Focus ONLY on strategies that leverage Large Language Models (LLMs) as the PRIMARY technology.
    Each strategy must have the LLM as the core reasoning/processing component, with text as the primary output.
    
    Acceptable LLM applications include:
    - Text-to-text: Traditional LLM applications where both input and output are text
    - Image-to-text: Multimodal LLM applications where images can be inputs, but the LLM processes them to produce text outputs
      (e.g., document analysis, visual content understanding, image-based Q&A)
    
    DO NOT suggest strategies that use:
    - Traditional machine learning or deep learning models with no LLM component
    - Pure computer vision applications not utilizing LLMs
    - Image generation or text-to-image models (like DALL-E, Midjourney)
    - Audio processing, speech recognition, or speech synthesis as the primary focus
    - Time series forecasting or prediction
    - Recommendation systems not powered by LLMs
    - Anomaly detection systems not powered by LLMs
    - Tabular data analysis without LLM reasoning
    
    Each strategy MUST be directly implementable with commercial LLMs such as GPT-4 (including Vision), Claude, Gemini, 
    or similar foundation models as their PRIMARY technology. All strategies MUST be categorized into one of these categories:
    
    1. Conversation
       - Chatbots, virtual assistants
       - Customer support automation
       - Interactive dialogue systems
    
    2. Content Generation
       - Document/report creation
       - Marketing content generation
       - Code generation
       - Automated writing assistance
    
    3. Text Analysis
       - Document understanding
       - Sentiment analysis
       - Information extraction
       - Pattern recognition in text
    
    4. Knowledge Management
       - Knowledge base creation/maintenance
       - Documentation automation
       - Learning systems
       - Information organization
    
    5. Visual Understanding
       - Document analysis with images
       - Visual content interpretation
       - Image-based Q&A
       - Visual information extraction
    
    6. Automation
       - Process automation using text or image inputs
       - Workflow optimization with LLM processing
       - Task automation through LLM understanding
       - System integration with LLM interfaces

    7. Other
       - Use this category ONLY when the strategy doesn't clearly fit into any of the above categories
       - When using this category, provide a brief explanation of why it doesn't fit other categories
    
    REMEMBER: Every strategy MUST use an LLM as its primary technology and produce text outputs.
    The key distinction is that the LLM must be the "brain" doing the reasoning/processing.
    
    COMMON MISTAKES TO AVOID:
    1. Suggesting traditional ML/AI approaches without an LLM component
    2. Focusing on data analysis or visualization without using LLMs for interpretation
    3. Proposing pure computer vision solutions that don't involve LLMs for reasoning
    4. Recommending real-time or safety-critical systems where LLMs may not be appropriate
    5. Creating strategies around standard BI, dashboards or analytics without LLM intelligence
    
    FOR EACH STRATEGY, EXPLICITLY MENTION:
    - Which specific LLM capabilities are being leveraged (understanding, generation, etc.)
    - How the LLM adds unique value beyond traditional approaches
    - What type of LLM would be appropriate (base model requirements)
    
    TEST EACH STRATEGY: Ask yourself "Is the LLM the core intelligence in this system?" If not, the strategy is unsuitable.
    
    Choose the most appropriate category based on the primary focus of the strategy.
    If a strategy could fit multiple categories, choose the one that best represents its main purpose.
    
    Business Challenges:
    ${processedBusinessChallenges.map((p, i) => `${i + 1}. ${p}`).join('\n')}
    
    Industry Insights:
    ${industryInsights.map((insight, i) => `${i + 1}. ${insight}`).join('\n')}
    ${feedbackSection}
    
    Return only a valid JSON object with no markdown formatting or other text:
    {
      "strategies": [
        {
          "id": "unique_id_1", 
          "title": "strategy title",
          "description": "detailed description",
          "impact": "High/Medium/Low",
          "complexity": "High/Medium/Low",
          "timeframe": "Short-term/Medium-term/Long-term",
          "category": "one of: conversation, content generation, text analysis, knowledge management, visual understanding, automation, other"
        }
      ]
    }
  `;
    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: strategyPrompt }] }],
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
        return jsonResponse.strategies.map((strategy, index) => ({
            ...strategy,
            id: strategy.id || `strategy_${index + 1}`,
            // Ensure category is one of the valid options, default to 'other' if invalid
            category: ['conversation', 'content generation', 'text analysis', 'knowledge management', 'visual understanding', 'automation', 'other']
                .includes(strategy.category?.toLowerCase())
                ? strategy.category.toLowerCase()
                : 'other'
        }));
    }
    catch (error) {
        console.error('Error parsing AI response:', error);
        if (VERBOSE_LOGGING) {
            console.error('Raw response:', textResponse);
        }
        else {
            console.error('Error parsing LLM response (enable VERBOSE_LOGGING to see raw response)');
        }
        throw new Error('Failed to create strategies');
    }
}
