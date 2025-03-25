import { scrapeCompanyWebsite } from '../scraper/index.js';
import { analyzeContext } from './engines/context.js';
import { generateBusinessChallenges } from './engines/businessChallenges.js';
import { getIndustryInsights } from './engines/industry.js';
import { createStrategies as generateStrategies, validateStrategiesBeforeImplementation } from './engines/strategy.js';
import { validateStrategies } from './engines/validation.js';
import { createImplementationPlan } from './engines/implementation.js';
import { checkFeasibility } from './engines/feasibility.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { calculateOpportunityScore, calculateCombinedScore } from '../utils/scoring.js';
import { generateLLMContent, loadLLMContent } from './llmContent.js';
import { getCompanyId, getCacheDirectory, getCachePath } from '../utils/cache.js';
// Configuration constants
const MAX_VALIDATION_ITERATIONS = 3;
const VALIDATION_SCORE_THRESHOLD = 80;
const MAX_FEASIBILITY_ITERATIONS = 3;
const FEASIBILITY_SCORE_THRESHOLD = 7.0;
const STRATEGY_INDIVIDUAL_THRESHOLD = 75; // Threshold for individual strategy validation
const MIN_STRATEGY_SCORE_REQUIRED = 65; // Absolute minimum score we'll accept
const USE_CACHE = true; // Set to false to bypass cache and regenerate everything
const VERBOSE_LOGGING = false; // Set to true for detailed logs, including LLM outputs
// Configure dotenv with the correct path
dotenv.config();
// Initialize Google AI
const API_KEY = process.env.GOOGLE_AI_API_KEY;
if (!API_KEY) {
    throw new Error('GOOGLE_AI_API_KEY environment variable is required but not found');
}
console.log('API Key available:', true);
const genAI = new GoogleGenerativeAI(API_KEY);
// Clean JSON response helper function - handles markdown-formatted JSON
function cleanJsonResponse(text) {
    // Remove markdown code blocks if present (```json, ```, etc.)
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').replace(/```/g, '');
    // Remove any leading/trailing whitespace
    return text.trim();
}
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
// Helper functions for file I/O
const writeCache = (companyId, step, data) => {
    const filePath = getCachePath(companyId, step);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    if (VERBOSE_LOGGING) {
        console.log(`   Saved ${step} to ${filePath}`);
    }
    return data;
};
const readCache = (companyId, step) => {
    const filePath = getCachePath(companyId, step);
    if (USE_CACHE && fs.existsSync(filePath)) {
        if (VERBOSE_LOGGING) {
            console.log(`   Loading ${step} from cache: ${filePath}`);
        }
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return null;
};
// Mock data for testing
function generateMockData(companyName, companyUrl) {
    return {
        id: `${companyName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        companyName: companyName,
        companyUrl: companyUrl,
        industry: "Technology",
        businessContext: `${companyName} is a technology company focused on digital innovation.`,
        companyOverview: {
            description: `${companyName} provides digital solutions for modern businesses.`,
            foundedYear: "2015",
            headquarters: "San Francisco, CA",
            employees: "250-500"
        },
        industryAnalysis: {
            industryName: "Software as a Service (SaaS)",
            marketSize: "$157 billion (2023)",
            growthRate: "21% annually",
            keyTrends: [
                "Increased adoption of AI technologies",
                "Shift to remote work solutions",
                "Focus on data security and privacy"
            ]
        },
        currentTechStack: [
            "Cloud infrastructure (AWS)",
            "Microservices architecture",
            "React.js frontend",
            "Python backend services"
        ],
        aiOpportunities: [
            {
                id: "strategy_1",
                title: "AI-Powered Customer Service Automation",
                description: "Implement AI chatbots and automated support systems to enhance customer service efficiency and availability.",
                impact: "High",
                complexity: "Medium",
                timeframe: "Short-term",
                keyBenefits: [
                    "24/7 customer support availability",
                    "Reduced response time by 75%",
                    "Cost reduction of 35% for support operations"
                ],
                implementationSteps: [
                    "Select and customize NLP model",
                    "Build knowledge base integration",
                    "Develop conversation flows",
                    "Test with subset of common queries",
                    "Gradual rollout with human oversight"
                ]
            },
            {
                id: "strategy_2",
                title: "Predictive Analytics for Business Intelligence",
                description: "Develop AI models to analyze business data and provide predictive insights for decision making.",
                impact: "High",
                complexity: "High",
                timeframe: "Medium-term",
                keyBenefits: [
                    "Data-driven decision making",
                    "15% improvement in forecast accuracy",
                    "Early identification of market trends"
                ],
                implementationSteps: [
                    "Data collection and preparation",
                    "Feature engineering",
                    "Model selection and training",
                    "Dashboard development",
                    "Integration with existing systems"
                ]
            },
            {
                id: "strategy_3",
                title: "Automated Content Generation",
                description: "Utilize AI to generate marketing content, reports, and documentation.",
                impact: "Medium",
                complexity: "Medium",
                timeframe: "Short-term",
                keyBenefits: [
                    "50% reduction in content creation time",
                    "Consistent messaging across channels",
                    "Ability to scale content production"
                ],
                implementationSteps: [
                    "Select AI model for content generation",
                    "Fine-tune with company content",
                    "Develop templates for different content types",
                    "Create review workflow",
                    "Integrate with content management systems"
                ]
            }
        ],
        implementationStrategy: {
            approach: "Phased implementation starting with high-impact, lower-complexity opportunities",
            timeline: "18-month roadmap with quarterly milestones",
            resourceRequirements: [
                "Data science team (2-3 specialists)",
                "DevOps support for deployment",
                "Integration with existing systems"
            ]
        },
        riskAssessment: {
            potentialRisks: [
                "Data privacy concerns",
                "Staff adaptation to new systems",
                "Integration challenges with legacy systems"
            ],
            mitigationStrategies: [
                "Comprehensive data governance framework",
                "Change management and training programs",
                "Phased integration approach with thorough testing"
            ]
        },
        recommendedApproach: "Begin with customer service automation for quick wins, then expand to predictive analytics and content generation.",
        nextSteps: [
            "Conduct detailed technical assessment",
            "Develop project plan with key stakeholders",
            "Allocate initial resources for first phase",
            "Set up measurement framework"
        ],
        imagePrompts: [
            "AI chatbot interface for customer support",
            "Dashboard showing predictive analytics for business metrics",
            "Automated content generation workflow diagram"
        ]
    };
}
/**
 * Load a previously generated proposal from cache
 */
export function loadProposal(companyName, companyUrl) {
    const companyId = getCompanyId(companyName);
    const proposal = readCache(companyId, 'final_proposal');
    // Add additional check to ensure the proposal is for the right company, ignoring case sensitivity
    // and being more lenient with URLs (if URL is empty in the request, don't use it for comparison)
    if (proposal &&
        proposal.companyName.toLowerCase() === companyName.toLowerCase() &&
        (companyUrl === '' || proposal.companyUrl === companyUrl)) {
        return proposal;
    }
    // If company name doesn't match, don't use the cached proposal
    if (proposal) {
        console.log(`Found cached proposal but company details don't match. Cached: ${proposal.companyName} (${proposal.companyUrl}), Requested: ${companyName} (${companyUrl})`);
        // Try to look for the proposal in test-results directory
        const resultsDir = path.join(process.cwd(), '../test-results');
        const filePath = path.join(resultsDir, `${companyName.toLowerCase().replace(/\s+/g, '-')}-analysis.json`);
        if (fs.existsSync(filePath)) {
            try {
                const testResultsProposal = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                console.log(`Found proposal for ${companyName} in test-results directory`);
                return testResultsProposal;
            }
            catch (e) {
                console.error(`Error parsing test-results file for ${companyName}:`, e);
            }
        }
    }
    return null;
}
export async function generateProposal(companyUrl, companyName) {
    try {
        const companyId = getCompanyId(companyName);
        console.log(`Generating proposal for ${companyName} (${companyUrl}), Company ID: ${companyId}`);
        // Check if we already have a final proposal
        const cachedProposal = loadProposal(companyName, companyUrl);
        if (cachedProposal) {
            console.log("Found cached final proposal. Returning it.");
            // Trigger LLM content pre-generation in the background to ensure it's available
            // We don't need to await it since we already have a proposal
            triggerLLMContentGeneration(companyName, companyUrl, cachedProposal);
            return cachedProposal;
        }
        // Step 1: Web Scraping
        console.log("1. Starting Web Scraping...");
        let scrapedData;
        // Try to load from cache first
        const cachedScrapedData = readCache(companyId, 'scraped_data');
        if (cachedScrapedData) {
            scrapedData = cachedScrapedData;
        }
        else {
            try {
                scrapedData = await scrapeCompanyWebsite(companyUrl);
                if (VERBOSE_LOGGING) {
                    console.log("   Scraping completed successfully");
                }
                writeCache(companyId, 'scraped_data', scrapedData);
            }
            catch (error) {
                console.warn("   Scraping failed, using mock data:", error);
                // Use a simplified version if scraping fails
                scrapedData = {
                    pageContent: `${companyName} website content`,
                    title: `${companyName} - Innovative Solutions`,
                    metaDescription: `${companyName} provides innovative solutions for modern businesses.`,
                    links: [companyUrl],
                    images: [],
                    products: ["Products"],
                    services: ["Services"],
                    aboutText: `${companyName} is a company focused on innovation.`,
                    teamInfo: []
                };
                writeCache(companyId, 'scraped_data', scrapedData);
            }
        }
        // Step 2: Context Analysis
        console.log("2. Starting Context Analysis...");
        let contextResult;
        const cachedContextResult = readCache(companyId, 'context_analysis');
        if (cachedContextResult) {
            contextResult = cachedContextResult;
        }
        else {
            contextResult = await analyzeContext(scrapedData, companyName);
            if (VERBOSE_LOGGING) {
                console.log("   Context analysis completed");
            }
            writeCache(companyId, 'context_analysis', contextResult);
        }
        // Step 3: Business Challenges Generation
        console.log("3. Starting Business Challenges Generation...");
        let businessChallenges;
        const cachedBusinessChallenges = readCache(companyId, 'businessChallenges');
        if (cachedBusinessChallenges) {
            businessChallenges = cachedBusinessChallenges;
        }
        else {
            businessChallenges = await generateBusinessChallenges(contextResult.businessContext);
            if (VERBOSE_LOGGING) {
                console.log("   Business challenges generation completed");
            }
            // Only write to businessChallenges cache, no longer maintaining patterns for backward compatibility
            writeCache(companyId, 'businessChallenges', businessChallenges);
        }
        // Step 4: Industry Insights
        console.log("4. Starting Industry Insights...");
        let industryResult;
        const cachedIndustryResult = readCache(companyId, 'industry_insights');
        if (cachedIndustryResult) {
            industryResult = cachedIndustryResult;
        }
        else {
            industryResult = await getIndustryInsights(contextResult.domainKnowledge);
            if (VERBOSE_LOGGING) {
                console.log("   Industry insights completed");
            }
            writeCache(companyId, 'industry_insights', industryResult);
        }
        // Step 5: Strategy Creation
        console.log("5. Starting Strategy Creation...");
        let aiStrategies;
        const cachedStrategies = readCache(companyId, 'strategies');
        if (cachedStrategies) {
            aiStrategies = cachedStrategies;
        }
        else {
            aiStrategies = await generateStrategies(businessChallenges, industryResult.industryInsights);
            if (VERBOSE_LOGGING) {
                console.log("   Strategy creation completed");
            }
            writeCache(companyId, 'strategies', aiStrategies);
        }
        // Step 6: Strategy validation with feedback loop
        console.log("6. Starting Strategy Validation Loop...");
        // Check if we already have optimized versions in cache
        const cachedOptimizedStrategies = readCache(companyId, 'optimized_strategies');
        let finalValidatedStrategies;
        if (cachedOptimizedStrategies) {
            console.log("   Loading optimized strategies from cache");
            finalValidatedStrategies = cachedOptimizedStrategies;
        }
        else {
            // Run validation on the proposed strategies
            let validationResult = await validateStrategies(aiStrategies, contextResult.businessContext, industryResult.industry, industryResult.possiblePainPoints, businessChallenges);
            // Optimize if needed
            if (validationResult.requiresFeedback) {
                console.log("   Initial validation score below threshold, running feedback-based optimization");
                // Improvement loop through feedback
                validationResult = await optimizeWithFeedback(validationResult, businessChallenges, industryResult.industryInsights);
            }
            // Use the final validated strategies with improved scores
            finalValidatedStrategies = validationResult.strategies;
            // Cache the optimized strategies
            writeCache(companyId, 'optimized_strategies', finalValidatedStrategies);
        }
        // NEW STEP: Pre-implementation validation to identify problematic strategies
        console.log("6b. Performing pre-implementation validation check...");
        // Analyze strategies for LLM feasibility before implementation
        const { strategies: enrichedStrategies, warnings, allValid } = validateStrategiesBeforeImplementation(finalValidatedStrategies, {
            logWarnings: true,
            enrichWithWarnings: true
        });
        // Update the strategies with enriched information
        finalValidatedStrategies = enrichedStrategies;
        // Log validation outcome
        if (warnings.length > 0) {
            console.warn(`   Pre-implementation validation found ${warnings.length} potential issues.`);
            // Count warnings by severity
            const severityCounts = warnings.reduce((counts, w) => {
                counts[w.severity] = (counts[w.severity] || 0) + 1;
                return counts;
            }, {});
            console.warn(`   Warning counts: ${JSON.stringify(severityCounts)}`);
        }
        else {
            console.log("   All strategies passed pre-implementation validation.");
        }
        // Cache the enriched strategies
        writeCache(companyId, 'enriched_strategies', finalValidatedStrategies);
        // Step 7: Implementation Planning
        console.log("7. Starting Implementation Planning...");
        let implementationStrategies;
        const cachedImplementation = readCache(companyId, 'implementation_strategies');
        if (cachedImplementation) {
            implementationStrategies = cachedImplementation;
        }
        else {
            try {
                // Configure implementation planning options based on environment
                const implementationOptions = {
                    // In development, set failOnError to true based on environment variable
                    failOnError: process.env.NODE_ENV === 'development' && process.env.FAIL_ON_ERRORS === 'true',
                    requireMinimumStrategies: true,
                    minimumStrategies: 3, // Ensure we have at least 3 valid strategies
                    allowPartialSuccess: true,
                    validateLLMFeasibility: true,
                    fallbackToGeneric: true
                };
                implementationStrategies = await createImplementationPlan(finalValidatedStrategies, implementationOptions);
                if (VERBOSE_LOGGING) {
                    console.log("   Implementation planning completed with", implementationStrategies.length, "strategies");
                }
                writeCache(companyId, 'implementation_strategies', implementationStrategies);
            }
            catch (error) {
                console.error("   Implementation planning failed:", error);
                // In production or with error tolerance enabled, use fallback strategy
                if (process.env.NODE_ENV !== 'development' || process.env.FAIL_ON_ERRORS !== 'true') {
                    console.warn("   Using fallback implementation plans");
                    // Create generic implementation plans as fallback
                    implementationStrategies = finalValidatedStrategies.map((strategy) => {
                        // Create a properly typed object with all required fields
                        return {
                            ...strategy,
                            keyBenefits: [
                                "Increased operational efficiency",
                                "Enhanced user experience",
                                "Reduced manual workload"
                            ],
                            implementationSteps: [
                                "Strategy Assessment: Evaluate specific requirements and constraints",
                                "Model Selection: Choose appropriate LLM based on use case",
                                "Integration Planning: Design system architecture and data flows",
                                "Prototype Development: Build initial proof of concept",
                                "Deployment & Monitoring: Roll out solution with proper tracking"
                            ],
                            feasibilityScore: 75
                        };
                    });
                    writeCache(companyId, 'implementation_strategies_fallback', implementationStrategies);
                }
                else {
                    // In development with strict error handling, propagate the error
                    throw error;
                }
            }
        }
        // Step 8: Feasibility Checking with feedback loop
        console.log("8. Starting Feasibility Checking Loop...");
        // Check if we already have the final optimized implementations
        const cachedFinalImplementations = readCache(companyId, 'final_implementations');
        if (cachedFinalImplementations) {
            console.log("   Loading final implementations from cache");
            var finalStrategiesWithScores = cachedFinalImplementations;
        }
        else {
            // Track each implementation strategy's evolution through feasibility checks
            const feasibilityEvolutions = implementationStrategies.map((strategy) => ({
                id: strategy.id,
                originalStrategy: strategy,
                iterations: [],
                bestScore: 0,
                bestIteration: -1
            }));
            // Initial feasibility check
            let feasibilityResult;
            const cachedInitialFeasibility = readCache(companyId, 'initial_feasibility');
            if (cachedInitialFeasibility) {
                feasibilityResult = cachedInitialFeasibility;
            }
            else {
                feasibilityResult = await checkFeasibility(implementationStrategies);
                if (VERBOSE_LOGGING) {
                    console.log("   Initial feasibility check completed");
                }
                writeCache(companyId, 'initial_feasibility', feasibilityResult);
            }
            let iteration = 0;
            // Record initial results
            implementationStrategies.forEach((strategy, index) => {
                const feasibilityData = feasibilityResult.strategies[index];
                if (!feasibilityData)
                    return;
                const evolution = feasibilityEvolutions[index];
                evolution.iterations.push({
                    strategy: strategy,
                    feasibilityScore: feasibilityData.feasibilityScore,
                    feedback: feasibilityData
                });
                evolution.bestScore = feasibilityData.feasibilityScore;
                evolution.bestIteration = 0;
            });
            if (VERBOSE_LOGGING) {
                console.log(`   Initial feasibility score: ${feasibilityResult.averageScore}`);
            }
            // Check for strategies that need further feasibility improvement
            let strategiesNeedingImprovement = feasibilityResult.strategies.filter(s => s.feasibilityScore < FEASIBILITY_SCORE_THRESHOLD);
            // Feasibility improvement loop
            while (iteration < MAX_FEASIBILITY_ITERATIONS - 1 &&
                strategiesNeedingImprovement.length > 0) {
                // Check if this iteration exists in cache
                const cachedIteration = readCache(companyId, `feasibility_iteration_${iteration + 1}`);
                if (cachedIteration) {
                    console.log(`   Loading feasibility iteration ${iteration + 1} from cache`);
                    const feasibilityResult = cachedIteration.feasibilityResult;
                    const refinedImplementationStrategies = cachedIteration.refinedStrategies;
                    // Record this iteration's results
                    refinedImplementationStrategies.forEach((strategy, index) => {
                        const feasibilityData = feasibilityResult.strategies[index];
                        if (!feasibilityData)
                            return;
                        const evolution = feasibilityEvolutions[index];
                        evolution.iterations.push({
                            strategy: strategy,
                            feasibilityScore: feasibilityData.feasibilityScore,
                            feedback: feasibilityData
                        });
                        // Update best version if this iteration is better
                        if (feasibilityData.feasibilityScore > evolution.bestScore) {
                            evolution.bestScore = feasibilityData.feasibilityScore;
                            evolution.bestIteration = evolution.iterations.length - 1;
                        }
                    });
                    // Update the list of strategies still needing improvement
                    strategiesNeedingImprovement = feasibilityResult.strategies.filter((s) => s.feasibilityScore < FEASIBILITY_SCORE_THRESHOLD);
                    iteration++;
                    continue;
                }
                iteration++;
                console.log(`   Feasibility iteration ${iteration}...`);
                console.log(`   ${strategiesNeedingImprovement.length} strategies need feasibility improvement`);
                if (feasibilityResult.technicalFeedback) {
                    console.log(`   Technical feedback: ${feasibilityResult.technicalFeedback}`);
                }
                // Create refined implementation strategies, incorporating feasibility feedback
                const refinedImplementationStrategies = implementationStrategies.map((strategy, index) => {
                    const feasibilityData = feasibilityResult.strategies[index];
                    if (!feasibilityData || feasibilityData.feasibilityScore >= FEASIBILITY_SCORE_THRESHOLD) {
                        // This strategy is already feasible enough, don't change it
                        return strategy;
                    }
                    // Create a hybrid implementation strategy with feasibility data
                    const refinedStrategy = {
                        ...strategy,
                        validationScore: strategy.validationScore || 0,
                        feasibilityScore: feasibilityData.feasibilityScore,
                        keyBenefits: feasibilityData.mitigationStrategies || strategy.keyBenefits,
                        implementationSteps: (feasibilityData.resourceRequirements || strategy.implementationSteps || []).slice(0, 5)
                    };
                    return refinedStrategy;
                });
                // Check feasibility of the refined implementation
                feasibilityResult = await checkFeasibility(refinedImplementationStrategies);
                // Cache this iteration's results
                writeCache(companyId, `feasibility_iteration_${iteration}`, {
                    refinedStrategies: refinedImplementationStrategies,
                    feasibilityResult: feasibilityResult
                });
                if (VERBOSE_LOGGING) {
                    console.log(`   Iteration ${iteration} feasibility score: ${feasibilityResult.averageScore}`);
                }
                else {
                    console.log(`   Feasibility iteration ${iteration} completed`);
                }
                // Record this iteration's results and track best version of each strategy
                refinedImplementationStrategies.forEach((strategy, index) => {
                    const feasibilityData = feasibilityResult.strategies[index];
                    if (!feasibilityData)
                        return;
                    const evolution = feasibilityEvolutions[index];
                    evolution.iterations.push({
                        strategy: strategy,
                        feasibilityScore: feasibilityData.feasibilityScore,
                        feedback: feasibilityData
                    });
                    // Update best version if this iteration is better
                    if (feasibilityData.feasibilityScore > evolution.bestScore) {
                        evolution.bestScore = feasibilityData.feasibilityScore;
                        evolution.bestIteration = evolution.iterations.length - 1;
                    }
                });
                // Update the list of strategies still needing improvement
                strategiesNeedingImprovement = feasibilityResult.strategies.filter((s) => s.feasibilityScore < FEASIBILITY_SCORE_THRESHOLD);
            }
            console.log(`   Feasibility checking completed after ${iteration + 1} iterations`);
            // Save feasibility evolutions for analysis
            writeCache(companyId, 'feasibility_evolutions', feasibilityEvolutions);
            // For each strategy, select the best version based on feasibility score
            const optimizedImplementations = feasibilityEvolutions.map(evolution => {
                if (evolution.bestIteration === -1) {
                    return {
                        ...evolution.originalStrategy,
                        implementationSteps: (evolution.originalStrategy.implementationSteps || []).slice(0, 5),
                        feasibilityScore: evolution.originalStrategy.feasibilityScore || 0
                    };
                }
                const bestIteration = evolution.iterations[evolution.bestIteration];
                return {
                    ...bestIteration.strategy,
                    feasibilityScore: bestIteration.feasibilityScore,
                    technicalChallenges: bestIteration.feedback.technicalChallenges || [],
                    resourceRequirements: bestIteration.feedback.resourceRequirements || [],
                    riskFactors: bestIteration.feedback.riskFactors || [],
                    mitigationStrategies: bestIteration.feedback.mitigationStrategies || [],
                    implementationSteps: (bestIteration.strategy.implementationSteps || []).slice(0, 5)
                };
            });
            // Sort by combined score (feasibility + opportunity score)
            optimizedImplementations.sort((a, b) => {
                const opportunityScoreA = calculateOpportunityScore(a);
                const opportunityScoreB = calculateOpportunityScore(b);
                const scoreA = (a.feasibilityScore || 0) * 0.6 + opportunityScoreA * 0.4;
                const scoreB = (b.feasibilityScore || 0) * 0.6 + opportunityScoreB * 0.4;
                return scoreB - scoreA;
            });
            // Add opportunity scores to the final output
            finalStrategiesWithScores = optimizedImplementations.map((strategy) => ({
                ...strategy,
                feasibilityScore: strategy.feasibilityScore || 0,
                opportunityScore: calculateOpportunityScore(strategy),
                combinedScore: calculateCombinedScore(strategy)
            }));
            // Save final implementations to cache
            writeCache(companyId, 'final_implementations', finalStrategiesWithScores);
        }
        // Step 9: Preparing Final Results
        console.log("9. Preparing Final Results...");
        // Build the final proposal data
        const proposalData = {
            id: `${companyId}-${Date.now()}`,
            companyName: companyName,
            companyUrl: companyUrl,
            industry: industryResult.industry,
            businessContext: contextResult.businessContext,
            possiblePainPoints: industryResult.possiblePainPoints,
            aiOpportunities: finalStrategiesWithScores.map((strategy) => ({
                id: strategy.id,
                title: strategy.title,
                description: strategy.description,
                impact: strategy.impact,
                complexity: strategy.complexity,
                timeframe: strategy.timeframe,
                keyBenefits: strategy.keyBenefits || [],
                implementationSteps: strategy.implementationSteps || [],
                painPointRelevances: strategy.painPointRelevances,
                businessChallengeRelevances: strategy.businessChallengeRelevances
            })),
            businessChallenges: businessChallenges,
            recommendedApproach: "Implement highest-scoring opportunities first, focusing on quick wins with low complexity.",
            nextSteps: [
                "Conduct detailed technical assessment of selected opportunities",
                "Develop project plan with key stakeholders",
                "Allocate initial resources for first phase",
                "Set up measurement framework"
            ],
            imagePrompts: [
                "AI transformation roadmap diagram",
                "Strategic opportunity matrix showing impact vs complexity",
                "Implementation timeline with key milestones"
            ]
        };
        // Save final proposal to cache
        writeCache(companyId, 'final_proposal', proposalData);
        console.log("   Proposal generation completed");
        // Trigger LLM content pre-generation in the background
        triggerLLMContentGeneration(companyName, companyUrl, proposalData);
        return proposalData;
    }
    catch (error) {
        console.error('Error generating proposal:', error);
        console.log('Falling back to mock data due to pipeline error');
        return generateMockData(companyName, companyUrl);
    }
}
/**
 * Trigger LLM content generation without waiting for completion
 * This allows the proposal to be returned immediately while content generation
 * happens in the background
 */
function triggerLLMContentGeneration(companyName, companyUrl, proposalData) {
    const companyId = getCompanyId(companyName);
    // Check if LLM content already exists - if so, don't regenerate
    const existingContent = loadLLMContent ? loadLLMContent(companyId) : null;
    if (existingContent) {
        console.log(`LLM content already exists for ${companyName}, skipping background generation`);
        return;
    }
    // Set a flag in the file system to prevent duplicate generation
    const lockFilePath = path.join(getCacheDirectory(companyId), 'llm_content_generating.lock');
    // Check if lock file exists (another process is already generating)
    if (fs.existsSync(lockFilePath)) {
        console.log(`LLM content generation already in progress for ${companyName}, skipping`);
        return;
    }
    // Create lock file
    try {
        fs.writeFileSync(lockFilePath, new Date().toISOString());
    }
    catch (err) {
        console.error(`Error creating lock file for ${companyName}:`, err);
        return;
    }
    // Start background process
    console.log(`Triggering background LLM content generation for ${companyName}`);
    // Run in the background (don't await)
    (async () => {
        try {
            await generateLLMContent(proposalData.companyName, proposalData.companyUrl, proposalData.businessContext, proposalData.industry, proposalData // Pass the full proposal data to avoid LLM API calls
            );
            console.log(`Background LLM content generation completed for ${companyName}`);
        }
        catch (error) {
            console.error(`Error in background LLM content generation for ${companyName}:`, error);
        }
        finally {
            // Always remove the lock file when done
            try {
                if (fs.existsSync(lockFilePath)) {
                    fs.unlinkSync(lockFilePath);
                }
            }
            catch (err) {
                console.error(`Error removing lock file for ${companyName}:`, err);
            }
        }
    })();
}
// Helper function to validate a strategy with proper typing
function getStrategyValidationAndFeasibility(s) {
    return new Promise(async (resolve) => {
        try {
            const validatedStrategy = await validateStrategy(s);
            resolve(validatedStrategy);
        }
        catch (error) {
            console.error('Error in strategy validation:', error);
            // Return original strategy if validation fails
            resolve(s);
        }
    });
}
// Helper function to validate a strategy
async function validateStrategy(strategy) {
    // In a real implementation, this would call the validation service
    // For now, we'll just return the strategy with a default validation score
    return {
        ...strategy,
        validationScore: 80 // Default validation score
    };
}
// Helper function to add score and ID to a strategy
function addScoreAndId(strategy, index) {
    return {
        ...strategy,
        id: strategy.id || `strategy_${index + 1}`,
        validationScore: strategy.validationScore || 75
    };
}
// Helper function to determine strategy category
export function determineStrategyCategory(strategy) {
    const title = strategy.title.toLowerCase();
    const description = strategy.description.toLowerCase();
    const content = `${title} ${description}`;
    // First check for image/visual related applications that should go in 'visual understanding'
    const visualKeywords = [
        'image', 'photo', 'picture', 'scan', 'visual', 'document analysis', 'document processing',
        'ocr', 'optical character', 'vision', 'camera', 'visual', 'image recognition',
        'document understanding', 'image input', 'image-based', 'multimodal'
    ];
    // Check if this is a visual understanding strategy
    for (const keyword of visualKeywords) {
        if (content.includes(keyword)) {
            return 'visual understanding';
        }
    }
    // Define category keywords with enhanced LLM-specific terms
    const categoryKeywords = {
        'conversation': [
            'chat', 'conversation', 'dialogue', 'communication', 'interaction',
            'support', 'customer service', 'chatbot', 'virtual assistant',
            'interactive', 'conversational ai', 'chat interface', 'llm chat',
            'gpt', 'claude', 'gemini', 'llama', 'agent', 'conversational agent'
        ],
        'content generation': [
            'generate', 'creation', 'write', 'content', 'text', 'document',
            'report', 'article', 'blog', 'draft', 'create content',
            'writing assistant', 'copywriting', 'content creator', 'text generator',
            'automated writing', 'content creation', 'llm writing', 'generate text',
            'marketing copy', 'email drafting', 'blog generation'
        ],
        'text analysis': [
            'analyze', 'analysis', 'process', 'extract', 'classify', 'categorize',
            'sentiment', 'understanding', 'summarize', 'summarization', 'extraction',
            'semantic search', 'text understanding', 'text processing',
            'identify patterns', 'classify text', 'sentiment analysis',
            'text classification', 'information extraction'
        ],
        'knowledge management': [
            'knowledge', 'learning', 'training', 'documentation', 'organize',
            'manage', 'repository', 'wiki', 'faqs', 'knowledge base',
            'information retrieval', 'rag', 'retrieval augmented', 'vector database',
            'semantic search', 'knowledge search', 'document retrieval',
            'company knowledge', 'institutional knowledge', 'knowledge storage'
        ],
        'automation': [
            'automate', 'workflow', 'process', 'task', 'routine', 'scheduling',
            'optimization', 'streamline', 'efficiency', 'automated process',
            'workflow automation', 'business process', 'process improvement',
            'task management', 'automated workflow', 'email automation',
            'process automation', 'customer interaction automation'
        ]
    };
    // Score each category based on keyword matches
    const scores = Object.entries(categoryKeywords).map(([category, keywords]) => {
        const score = keywords.reduce((acc, keyword) => {
            return acc + (content.includes(keyword) ? 1 : 0);
        }, 0);
        return { category, score };
    });
    // Sort by score and get the highest scoring category
    scores.sort((a, b) => b.score - a.score);
    // Return the highest scoring category, or 'other' as default if no clear match
    return scores[0].score > 0 ? scores[0].category : 'other';
}
// Modify the createStrategies function to include category
export async function createStrategies(businessChallenges, industryInsights, feedback) {
    try {
        // Prepare the prompt for strategy generation
        const prompt = `Based on the following business challenges and industry insights, generate AI implementation strategies:
    
    Business Challenges: ${JSON.stringify(businessChallenges)}
    Industry Insights: ${JSON.stringify(industryInsights)}
    ${feedback ? `Previous Feedback: ${JSON.stringify(feedback)}` : ''}
    
    Generate strategies that are specific, actionable, and aligned with business goals.
    Each strategy should include:
    - title: Clear and specific title
    - description: Detailed explanation
    - impact: "High", "Medium", or "Low"
    - complexity: "High", "Medium", or "Low"
    - timeframe: "Short-term", "Medium-term", or "Long-term"
    
    IMPORTANT: Include a diverse mix of AI strategy types, including:
    1. Text-to-text applications (traditional LLM use cases)
    2. Visual understanding applications (using multimodal LLMs for document analysis, image understanding, etc.)
    3. Knowledge management applications
    4. Workflow automation applications
    5. Content generation applications
    
    For visual understanding strategies, focus on applications where multimodal LLMs can process images 
    and extract insights, such as document analysis, visual content understanding, image-based Q&A, etc.
    
    Format the response as a JSON array of strategies.`;
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        // Parse the response and ensure it's an array
        const cleanedJson = cleanJsonResponse(text);
        let strategies = JSON.parse(cleanedJson);
        if (!Array.isArray(strategies)) {
            throw new Error('Generated strategies is not an array');
        }
        // Add IDs and categories to strategies
        strategies = strategies.map((strategy, index) => ({
            ...strategy,
            id: `strategy_${index + 1}`,
            category: determineStrategyCategory(strategy)
        }));
        return strategies;
    }
    catch (error) {
        console.error('Error in strategy creation:', error);
        // Return a basic strategy if generation fails
        return [{
                id: 'strategy_1',
                title: 'AI-Powered Process Automation',
                description: 'Implement AI to automate routine business processes',
                impact: 'Medium',
                complexity: 'Medium',
                timeframe: 'Medium-term',
                category: 'automation'
            }];
    }
}
// Helper function for optimizing strategies with feedback
async function optimizeWithFeedback(validationResult, businessChallenges, industryInsights) {
    console.log("Starting strategy optimization with feedback");
    // Create a map to track the evolution of each strategy
    const strategyEvolutions = new Map();
    // Initialize the evolution tracking for each strategy
    validationResult.strategies.forEach(strategy => {
        strategyEvolutions.set(strategy.id, {
            iterations: [strategy],
            bestScore: strategy.validationScore,
            bestIteration: 0
        });
    });
    // Start the iterative improvement process for validation
    for (let iteration = 0; iteration < MAX_VALIDATION_ITERATIONS - 1; iteration++) {
        // Get strategies that still need improvement
        const strategiesNeedingImprovement = validationResult.strategies.filter((s) => s.validationScore < STRATEGY_INDIVIDUAL_THRESHOLD);
        if (strategiesNeedingImprovement.length === 0) {
            console.log("   All strategies are above individual threshold. No further refinement needed.");
            break;
        }
        console.log(`   Iteration ${iteration + 1}: ${strategiesNeedingImprovement.length} strategies need improvement`);
        // Create feedback for the strategy engine
        const feedback = {
            strategies: strategiesNeedingImprovement,
            feedbackComments: [
                `Overall validation score (${validationResult.averageScore}) is below target threshold (${VALIDATION_SCORE_THRESHOLD})`,
                "Focus on improving alignment with business context and market potential",
                "Consider more specific implementation approaches in the description"
            ],
            industryContext: `Based on industry trends and specifics`
        };
        // Create refined strategies with feedback - use generateStrategies to avoid name conflict
        const refinedStrategies = await generateStrategies(businessChallenges, industryInsights, feedback);
        // Create a map of the refined strategies for easy lookup
        const refinedStrategyMap = new Map();
        refinedStrategies.forEach((strategy, index) => {
            // Use the original ID if we're refining an existing strategy
            const originalId = strategiesNeedingImprovement[index]?.id;
            if (originalId) {
                strategy.id = originalId;
                refinedStrategyMap.set(originalId, strategy);
            }
        });
        // Create the next set of strategies to validate by combining:
        // 1. Strategies that were already good enough (no change)
        // 2. Newly refined versions of strategies that needed improvement
        const nextStrategies = validationResult.strategies.map(strategy => {
            if (strategy.validationScore >= STRATEGY_INDIVIDUAL_THRESHOLD) {
                // Keep good strategies as they are
                return strategy;
            }
            else {
                // Replace with refined version if available
                const refined = refinedStrategyMap.get(strategy.id);
                // We need to handle the case where refined is a Strategy but we need a ValidatedStrategy
                // This is simplistic but demonstrates the necessary type handling
                return refined ? {
                    ...refined,
                    validationScore: 0,
                    validationCriteria: {
                        businessAlignment: 0,
                        marketPotential: 0,
                        industryRelevance: 0,
                        clarity: 0
                    }
                } : strategy;
            }
        });
        // Validate the new set of strategies
        validationResult = await validateStrategies(nextStrategies, // Cast to expected type for validation function
        "Business context from previous step", // This would normally come from a parameter
        "Industry information from previous step", // This would normally come from a parameter
        [], // Empty pain points array since we don't have the actual pain points
        businessChallenges // Pass business challenges to maintain relevance data
        );
        console.log(`   Iteration ${iteration + 1} validation score: ${validationResult.averageScore}`);
        // Update our tracking of each strategy's evolution
        validationResult.strategies.forEach(strategy => {
            const evolution = strategyEvolutions.get(strategy.id);
            if (evolution) {
                // Add this iteration
                evolution.iterations.push(strategy);
                // Update best score if this iteration is better
                if (strategy.validationScore > evolution.bestScore) {
                    evolution.bestScore = strategy.validationScore;
                    evolution.bestIteration = evolution.iterations.length - 1;
                }
            }
        });
    }
    console.log("   Strategy optimization completed");
    // For each strategy, select the version with the highest score
    const optimizedStrategies = Array.from(strategyEvolutions.values()).map(evolution => {
        return evolution.iterations[evolution.bestIteration];
    });
    // Sort strategies by score (highest first)
    optimizedStrategies.sort((a, b) => b.validationScore - a.validationScore);
    // Filter out any strategies that don't meet our absolute minimum score
    const finalStrategies = optimizedStrategies.filter((s) => s.validationScore >= MIN_STRATEGY_SCORE_REQUIRED);
    // Calculate the new average score
    const newAverageScore = finalStrategies.reduce((sum, s) => sum + s.validationScore, 0) / (finalStrategies.length || 1);
    return {
        strategies: finalStrategies,
        requiresFeedback: newAverageScore < VALIDATION_SCORE_THRESHOLD,
        averageScore: newAverageScore
    };
}
