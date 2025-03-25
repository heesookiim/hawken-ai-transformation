import dotenv from 'dotenv';
import { ScrapedData, scrapeCompanyWebsite } from '../scraper';
import { analyzeContext } from '../ai/engines/context';
import { generateBusinessChallenges } from '../ai/engines/businessChallenges';
import { getIndustryInsights } from '../ai/engines/industry';
import { createStrategies, StrategyFeedback, Strategy } from '../ai/engines/strategy';
import { validateStrategies, ValidatedStrategy } from '../ai/engines/validation';
import { createImplementationPlan } from '../ai/engines/implementation';
import { checkFeasibility, FeasibilityResult } from '../ai/engines/feasibility';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv with the correct path
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Add this near the top of the file after dotenv.config()
console.log('API Key available:', !!process.env.GOOGLE_AI_API_KEY);

// Configuration constants
const MAX_VALIDATION_ITERATIONS = 3;
const VALIDATION_SCORE_THRESHOLD = 80;
const MAX_FEASIBILITY_ITERATIONS = 2;
const FEASIBILITY_SCORE_THRESHOLD = 80;
const STRATEGY_INDIVIDUAL_THRESHOLD = 80; // Threshold for individual strategy validation
const MIN_STRATEGY_SCORE_REQUIRED = 60;    // Absolute minimum score we'll accept in the final output

// Sample pre-defined test case if scraping fails
const sampleTestData: ScrapedData = {
  pageContent: "Sample company website content",
  title: "Sample Company - Innovation at Work",
  metaDescription: "Sample Company provides innovative solutions for enterprise customers.",
  links: ["https://example.com/about", "https://example.com/products"],
  images: ["https://example.com/logo.png"],
  products: ["Product Suite", "Analytics Platform", "Automation Tools"],
  services: ["Consulting", "Implementation", "Support"],
  aboutText: "Sample Company was founded in 2010 to transform how businesses leverage technology.",
  teamInfo: ["CEO: Jane Smith", "CTO: John Doe"]
};

// Helper interface to track strategy evolution
interface StrategyEvolution {
  iterations: ValidatedStrategy[];
  bestScore: number;
  bestIteration: number;
}

// Add interfaces for feasibility evolution tracking
interface ImplementationStrategy extends Strategy {
  technicalApproach?: string;
  keyBenefits?: string[];
  implementationSteps?: string[];
  roi?: string;
  [key: string]: any; // Allow additional properties
}

interface FeasibilityAnalysis extends Strategy {
  feasibilityScore: number;
  feasibilityCriteria?: {
    technicalFeasibility: number;
    resourceRequirements: number;
    riskAssessment: number;
    implementationComplexity: number;
  };
  technicalChallenges?: string[];
  resourceRequirements?: string[];
  riskFactors?: string[];
  mitigationStrategies?: string[];
  recommendedApproach?: string;
  [key: string]: any; // Allow additional properties
}

interface FeasibilityEvolutionEntry {
  strategy: ImplementationStrategy;
  feasibilityScore: number;
  feedback: FeasibilityAnalysis;
}

interface FeasibilityEvolution {
  id: string;
  originalStrategy: ImplementationStrategy;
  iterations: FeasibilityEvolutionEntry[];
  bestScore: number;
  bestIteration: number;
}

// Add scoring function before testIndividualComponents
function calculateStrategyScore(strategy: ImplementationStrategy): number {
  // Impact scoring (highest weight)
  const impactScores: { [key: string]: number } = {
    'High': 100,
    'Medium': 60,
    'Low': 20
  };
  
  // Complexity scoring (inverse - lower complexity is better)
  const complexityScores: { [key: string]: number } = {
    'High': 20,
    'Medium': 60,
    'Low': 100
  };
  
  // Timeframe scoring (shorter timeframe is better)
  const timeframeScores: { [key: string]: number } = {
    'Short-term': 100,
    'Medium-term': 60,
    'Long-term': 20
  };
  
  // Calculate weighted score
  const impactScore = impactScores[strategy.impact] || 0;
  const complexityScore = complexityScores[strategy.complexity] || 0;
  const timeframeScore = timeframeScores[strategy.timeframe] || 0;
  
  // Weights: 50% impact, 30% complexity, 20% timeframe
  return (impactScore * 0.5) + (complexityScore * 0.3) + (timeframeScore * 0.2);
}

async function testIndividualComponents(
  companyName: string = "Sample Company",
  companyUrl: string = "https://example.com",
  description?: string
) {
  console.log(`\n===== Testing Individual Components with ${companyName} =====\n`);
  
  // Create output directory
  const outputDir = path.join(__dirname, '../../test-results/components');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    // Step 1: Test Web Scraper
    console.log("1. Testing Web Scraper...");
    let scrapedData: ScrapedData;
    try {
      scrapedData = await scrapeCompanyWebsite(companyUrl);
    } catch (error) {
      console.warn("Scraping failed, using sample data:", error);
      scrapedData = sampleTestData;
    }
    fs.writeFileSync(
      path.join(outputDir, `${companyName.toLowerCase()}-scraped-data.json`),
      JSON.stringify(scrapedData, null, 2)
    );
    console.log("   Scraping completed");

    // Step 2: Test Context Analyzer
    console.log("2. Testing Context Analyzer...");
    const contextResult = await analyzeContext(scrapedData, companyName, description);
    fs.writeFileSync(
      path.join(outputDir, `${companyName.toLowerCase()}-context.json`),
      JSON.stringify(contextResult, null, 2)
    );
    console.log("   Context analysis completed");
    
    // Step 3: Test Business Challenges Generator
    console.log("3. Testing Business Challenges Generator...");
    const businessChallenges = await generateBusinessChallenges(contextResult.businessContext);
    fs.writeFileSync(
      path.join(outputDir, `${companyName.toLowerCase()}-businessChallenges.json`),
      JSON.stringify(businessChallenges, null, 2)
    );
    console.log("   Business challenges generation completed");
    
    // Step 4: Test Industry Insights
    console.log("4. Testing Industry Insights...");
    const industryResult = await getIndustryInsights(contextResult.domainKnowledge);
    fs.writeFileSync(
      path.join(outputDir, `${companyName.toLowerCase()}-industry.json`),
      JSON.stringify(industryResult, null, 2)
    );
    console.log("   Industry insights completed");
    
    // Step 5-6: Strategy Creation and Validation Loop
    console.log("5. Starting Strategy Creation and Validation Loop...");
    
    // Initial strategy creation
    let initialStrategies = await createStrategies(
      businessChallenges, 
      industryResult.industryInsights
    );
    fs.writeFileSync(
      path.join(outputDir, `${companyName.toLowerCase()}-strategies-initial.json`),
      JSON.stringify(initialStrategies, null, 2)
    );
    console.log("   Initial strategy creation completed");
    
    // Initial validation
    let validationResult = await validateStrategies(
      initialStrategies,
      contextResult.businessContext,
      industryResult.industry
    );
    
    fs.writeFileSync(
      path.join(outputDir, `${companyName.toLowerCase()}-validation-initial.json`),
      JSON.stringify(validationResult, null, 2)
    );
    
    console.log(`   Initial validation average score: ${validationResult.averageScore}`);
    
    // Create a map to track the evolution of each strategy
    const strategyEvolutions = new Map<string, StrategyEvolution>();
    
    // Initialize the evolution tracking for each strategy
    validationResult.strategies.forEach(strategy => {
      strategyEvolutions.set(strategy.id, {
        iterations: [strategy],
        bestScore: strategy.validationScore,
        bestIteration: 0
      });
    });
    
    // Start the iterative improvement process
    for (let iteration = 0; iteration < MAX_VALIDATION_ITERATIONS - 1; iteration++) {
      // Get strategies that still need improvement
      const strategiesNeedingImprovement = validationResult.strategies.filter(
        s => s.validationScore < STRATEGY_INDIVIDUAL_THRESHOLD
      );
      
      if (strategiesNeedingImprovement.length === 0) {
        console.log("   All strategies are above individual threshold. No further refinement needed.");
        break;
      }
      
      console.log(`   Iteration ${iteration + 1}: ${strategiesNeedingImprovement.length} strategies need improvement`);
      
      // Create feedback for the strategy engine
      const feedback: StrategyFeedback = {
        strategies: strategiesNeedingImprovement,
        feedbackComments: [
          `Overall validation score (${validationResult.averageScore}) is below target threshold (${VALIDATION_SCORE_THRESHOLD})`,
          "Focus on improving alignment with business context and market potential",
          "Consider more specific implementation approaches in the description"
        ],
        industryContext: `Based on ${industryResult.industry} industry trends`
      };
      
      // Create refined strategies with feedback
      const refinedStrategies = await createStrategies(
        businessChallenges,
        industryResult.industryInsights,
        feedback
      );
      
      // Create a map of the refined strategies for easy lookup
      const refinedStrategyMap = new Map<string, Strategy>();
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
        } else {
          // Replace with refined version if available
          const refined = refinedStrategyMap.get(strategy.id);
          return refined || strategy;
        }
      });
      
      fs.writeFileSync(
        path.join(outputDir, `${companyName.toLowerCase()}-strategies-iteration-${iteration + 1}.json`),
        JSON.stringify(nextStrategies, null, 2)
      );
      
      // Validate the new set of strategies
      validationResult = await validateStrategies(
        nextStrategies,
        contextResult.businessContext,
        industryResult.industry
      );
      
      fs.writeFileSync(
        path.join(outputDir, `${companyName.toLowerCase()}-validation-iteration-${iteration + 1}.json`),
        JSON.stringify(validationResult, null, 2)
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
        } else {
          // New strategy (shouldn't happen but handle just in case)
          strategyEvolutions.set(strategy.id, {
            iterations: [strategy],
            bestScore: strategy.validationScore,
            bestIteration: 0
          });
        }
      });
    }
    
    console.log("   Strategy validation iterations completed");
    
    // For each strategy, select the version with the highest score
    const optimizedStrategies = Array.from(strategyEvolutions.values()).map(evolution => {
      return evolution.iterations[evolution.bestIteration];
    });
    
    // Sort strategies by score (highest first)
    optimizedStrategies.sort((a, b) => b.validationScore - a.validationScore);
    
    // Filter out any strategies that don't meet our absolute minimum score
    const finalValidatedStrategies = optimizedStrategies.filter(
      s => s.validationScore >= MIN_STRATEGY_SCORE_REQUIRED
    );
    
    console.log(`   Final optimized strategies: ${finalValidatedStrategies.length}`);
    console.log(`   Scores: ${finalValidatedStrategies.map(s => s.validationScore).join(', ')}`);
    
    fs.writeFileSync(
      path.join(outputDir, `${companyName.toLowerCase()}-strategies-optimized.json`),
      JSON.stringify(finalValidatedStrategies, null, 2)
    );
    
    // Step 7: Test Implementation Planning
    console.log("7. Testing Implementation Planning...");
    const implementationStrategies = await createImplementationPlan(finalValidatedStrategies);
    fs.writeFileSync(
      path.join(outputDir, `${companyName.toLowerCase()}-implementation.json`),
      JSON.stringify(implementationStrategies, null, 2)
    );
    console.log("   Implementation planning completed");
    
    // Step 8: Test Feasibility Checking with feedback loop
    console.log("8. Starting Feasibility Checking Loop...");
    
    // Track each implementation strategy's evolution through feasibility checks
    const feasibilityEvolutions: FeasibilityEvolution[] = implementationStrategies.map(strategy => ({
      id: strategy.id,
      originalStrategy: strategy as ImplementationStrategy,
      iterations: [],
      bestScore: 0,
      bestIteration: -1
    }));
    
    // Initial feasibility check
    let feasibilityResult = await checkFeasibility(implementationStrategies);
    let iteration = 0;
    
    // Record initial results
    implementationStrategies.forEach((strategy, index) => {
      const feasibilityData = feasibilityResult.strategies[index];
      if (!feasibilityData) return;
      
      const evolution = feasibilityEvolutions[index];
      evolution.iterations.push({
        strategy: strategy as ImplementationStrategy,
        feasibilityScore: feasibilityData.feasibilityScore,
        feedback: feasibilityData
      });
      evolution.bestScore = feasibilityData.feasibilityScore;
      evolution.bestIteration = 0;
    });
    
    fs.writeFileSync(
      path.join(outputDir, `${companyName.toLowerCase()}-feasibility-initial.json`),
      JSON.stringify(feasibilityResult, null, 2)
    );
    
    console.log(`   Initial feasibility score: ${feasibilityResult.averageScore}`);
    
    // Check for strategies that need further feasibility improvement
    let strategiesNeedingImprovement = feasibilityResult.strategies.filter(
      s => s.feasibilityScore < FEASIBILITY_SCORE_THRESHOLD
    );
    
    while (iteration < MAX_FEASIBILITY_ITERATIONS - 1 && 
           strategiesNeedingImprovement.length > 0) {
      
      iteration++;
      console.log(`   Feasibility iteration ${iteration + 1}...`);
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
        return {
          ...strategy,
          // Use feasibility data to update implementation details
          technicalApproach: feasibilityData.recommendedApproach || strategy.technicalApproach,
          keyBenefits: feasibilityData.mitigationStrategies || strategy.keyBenefits,
          implementationSteps: feasibilityData.resourceRequirements || strategy.implementationSteps
        };
      });
      
      fs.writeFileSync(
        path.join(outputDir, `${companyName.toLowerCase()}-implementation-iteration-${iteration}.json`),
        JSON.stringify(refinedImplementationStrategies, null, 2)
      );
      
      // Check feasibility of the refined implementation
      feasibilityResult = await checkFeasibility(refinedImplementationStrategies);
      
      fs.writeFileSync(
        path.join(outputDir, `${companyName.toLowerCase()}-feasibility-iteration-${iteration}.json`),
        JSON.stringify(feasibilityResult, null, 2)
      );
      
      console.log(`   Iteration ${iteration} feasibility score: ${feasibilityResult.averageScore}`);
      
      // Record this iteration's results and track best version of each strategy
      implementationStrategies.forEach((strategy, index) => {
        const feasibilityData = feasibilityResult.strategies[index];
        if (!feasibilityData) return;
        
        const evolution = feasibilityEvolutions[index];
        evolution.iterations.push({
          strategy: refinedImplementationStrategies[index] as ImplementationStrategy,
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
      strategiesNeedingImprovement = feasibilityResult.strategies.filter(
        s => s.feasibilityScore < FEASIBILITY_SCORE_THRESHOLD
      );
    }
    
    console.log(`   Feasibility checking completed after ${iteration + 1} iterations`);
    
    // For each strategy, select the best version based on feasibility score
    const optimizedImplementations = feasibilityEvolutions.map(evolution => {
      if (evolution.bestIteration === -1) {
        return evolution.originalStrategy;
      }
      
      const bestIteration = evolution.iterations[evolution.bestIteration];
      return {
        ...bestIteration.strategy,
        feasibilityScore: bestIteration.feasibilityScore,
        technicalChallenges: bestIteration.feedback.technicalChallenges || [],
        resourceRequirements: bestIteration.feedback.resourceRequirements || [],
        riskFactors: bestIteration.feedback.riskFactors || [],
        mitigationStrategies: bestIteration.feedback.mitigationStrategies || []
      };
    });
    
    // Sort by combined score (feasibility + opportunity score)
    optimizedImplementations.sort((a, b) => {
      const feasibilityScoreA = a.feasibilityScore || 0;
      const feasibilityScoreB = b.feasibilityScore || 0;
      const opportunityScoreA = calculateStrategyScore(a);
      const opportunityScoreB = calculateStrategyScore(b);
      
      // Combined score: 60% feasibility, 40% opportunity
      const scoreA = (feasibilityScoreA * 0.6) + (opportunityScoreA * 0.4);
      const scoreB = (feasibilityScoreB * 0.6) + (opportunityScoreB * 0.4);
      
      return scoreB - scoreA;
    });
    
    // Add opportunity scores to the final output
    const finalStrategiesWithScores = optimizedImplementations.map(strategy => ({
      ...strategy,
      feasibilityScore: strategy.feasibilityScore || 0,
      opportunityScore: calculateStrategyScore(strategy),
      combinedScore: (strategy.feasibilityScore || 0) * 0.6 + calculateStrategyScore(strategy) * 0.4
    }));
    
    fs.writeFileSync(
      path.join(outputDir, `${companyName.toLowerCase()}-final-strategies-optimized.json`),
      JSON.stringify(finalStrategiesWithScores, null, 2)
    );
    
    console.log("   Final strategies optimized for both validation and feasibility");
    
    return {
      scrapedData,
      contextResult,
      businessChallenges,
      industryResult,
      optimizedStrategies: finalValidatedStrategies,
      implementationStrategies: finalStrategiesWithScores,
      feasibilityResult,
      finalReport: {
        validationScores: finalValidatedStrategies.map(s => s.validationScore),
        feasibilityScores: finalStrategiesWithScores.map(s => s.feasibilityScore || 0),
        opportunityScores: finalStrategiesWithScores.map(s => s.opportunityScore),
        combinedScores: finalStrategiesWithScores.map(s => s.combinedScore),
        improvementStats: {
          validation: Array.from(strategyEvolutions.values()).map(e => ({
            initialScore: e.iterations[0].validationScore,
            finalScore: e.iterations[e.bestIteration].validationScore,
            improvement: e.iterations[e.bestIteration].validationScore - e.iterations[0].validationScore
          })),
          feasibility: feasibilityEvolutions.map(e => ({
            id: e.id,
            initialScore: e.iterations[0]?.feasibilityScore || 0,
            finalScore: e.bestScore,
            improvement: e.bestScore - (e.iterations[0]?.feasibilityScore || 0)
          }))
        }
      }
    };
    
  } catch (error) {
    console.error("Error in component testing:", error);
    throw error;
  }
}

// Execute the test
const company = {
  name: process.argv[2] || "Stripe",
  url: process.argv[3] || "https://stripe.com",
  description: process.argv[4] || "Payment processing platform for businesses"
};

testIndividualComponents(company.name, company.url, company.description)
  .then((results) => {
    console.log('\nComponent tests completed');
    
    // Save the final report to a JSON file
    const outputDir = path.join(__dirname, '../../test-results/components');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Save the complete results object
    fs.writeFileSync(
      path.join(outputDir, `${company.name.toLowerCase()}-complete-results.json`),
      JSON.stringify(results, null, 2)
    );
    
    // Save just the final report for easier analysis
    fs.writeFileSync(
      path.join(outputDir, `${company.name.toLowerCase()}-final-report.json`),
      JSON.stringify(results.finalReport, null, 2)
    );
    
    console.log(`Final report saved to: ${path.join(outputDir, `${company.name.toLowerCase()}-final-report.json`)}`);
  })
  .catch(err => console.error('Error in component test process:', err));

export { testIndividualComponents }; 