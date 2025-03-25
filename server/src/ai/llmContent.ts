import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { getCompanyId, getCachePath } from '../utils/cache.js';

// Load environment variables
dotenv.config();

// Configure generative AI
const API_KEY = process.env.GOOGLE_AI_API_KEY;
if (!API_KEY) {
  console.error('Error: GOOGLE_AI_API_KEY is required in environment variables');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const contentGenerationModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Define LLM content structure to match client-side expectations
export interface ExecutiveSummaryContent {
  problemStatement: string;
  partnershipProposals: string[];
  timingPoints: string[];
  businessContextSummary: string;
  prioritizedChallenges: Array<{
    title: string;
    description: string;
    severity: number;
    manifestations: string[];
    industryRelevance: string;
  }>;
  challengeSolutions: Array<{
    challenge: string;
    solution: string;
    relevanceScore: number;
    expectedImpact: string;
  }>;
  industryTerminology: string[];
}

export interface LLMGeneratedContent {
  companyContext: string;
  keyBusinessChallenges: string[];
  strategicOpportunities: string[];
  executiveSummaryContent: ExecutiveSummaryContent;
  generatedAt: number;
}

/**
 * Load pre-generated LLM content from cache if available
 */
export function loadLLMContent(companyId: string): LLMGeneratedContent | null {
  const filePath = getCachePath(companyId, 'llm_content');
  
  if (fs.existsSync(filePath)) {
    console.log(`Loading pre-generated LLM content for ${companyId}`);
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      console.error(`Error loading LLM content for ${companyId}:`, error);
      return null;
    }
  }
  
  return null;
}

/**
 * Save pre-generated LLM content to cache
 */
export function saveLLMContent(companyId: string, content: LLMGeneratedContent): void {
  const filePath = getCachePath(companyId, 'llm_content');
  console.log(`Saving pre-generated LLM content for ${companyId}`);
  
  try {
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
  } catch (error) {
    console.error(`Error saving LLM content for ${companyId}:`, error);
  }
}

/**
 * Generate key business challenges/pain points
 */
async function generateKeyBusinessChallenges(businessContext: string, industry: string): Promise<string[]> {
  const painPointsPrompt = `
    Extract 3-4 common industry pain points from the provided business context that would most benefit 
    from AI solutions. Focus on challenges that are typical in the company's industry and highly addressable 
    through AI. Format these as bullet points.
    
    Business Context:
    ${businessContext || `The company operates in the ${industry} sector.`}
    
    Industry:
    ${industry || 'Technology'}
    
    Format each pain point as a concise bullet point starting with a dash (-) that:
    - Identifies a widespread industry challenge, not just company-specific
    - Uses direct, declarative language
    - Highlights quantifiable impacts where possible
    - Focuses on pain points that AI can effectively address
    
    Example output:
    - Manual data processing consuming significant resources across the industry, causing operational inefficiencies
    - Customer service bottlenecks common in this sector, leading to decreased satisfaction scores
    - Content personalization challenges typical in this industry, resulting in lower engagement metrics
  `;

  try {
    const result = await contentGenerationModel.generateContent(painPointsPrompt);
    const response = result.response.text();
    
    // Process pain points - extract bullet points
    const painPoints = response
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().substring(1).trim());
      
    return painPoints.length > 0 ? painPoints : [
      'Manual processes and workflows requiring significant time and resources',
      'Data silos preventing comprehensive insights and decision-making',
      'Customer experience inconsistencies impacting satisfaction and retention',
      'Operational inefficiencies increasing costs and reducing competitiveness'
    ];
  } catch (error) {
    console.error('Error generating key business challenges:', error);
    return [
      'Manual processes and workflows requiring significant time and resources',
      'Data silos preventing comprehensive insights and decision-making',
      'Customer experience inconsistencies impacting satisfaction and retention'
    ];
  }
}

/**
 * Generate strategic opportunities based on business challenges
 */
async function generateStrategicOpportunities(businessContext: string, industry: string, keyBusinessChallenges: string[]): Promise<string[]> {
  const opportunitiesPrompt = `
    Based on the business context and identified industry pain points, create 3-4 high-impact strategic AI 
    opportunities for this company. Format these as bullet points that clearly state the opportunity and 
    quantifiable benefit.
    
    Business Context:
    ${businessContext || `The company operates in the ${industry} sector.`}
    
    Industry:
    ${industry || 'Technology'}
    
    Common Industry Pain Points:
    ${keyBusinessChallenges.map(challenge => `- ${challenge}`).join('\n')}
    
    Format each opportunity as a concise bullet point starting with a dash (-) that:
    - Describes a specific, actionable AI implementation
    - Focuses on measurable business value and ROI
    - Uses precise language with numeric impact estimates (%, $, time)
    - Connects to one or more of the pain points
    - Is realistic and practical to implement
    
    Example output:
    - Implement AI-powered workflow automation to reduce operational costs by 30%
    - Deploy intelligent customer engagement platform to increase satisfaction by 40%
    - Develop predictive analytics system to improve decision-making accuracy by 25%
  `;

  try {
    const result = await contentGenerationModel.generateContent(opportunitiesPrompt);
    const response = result.response.text();
    
    // Process opportunities - extract bullet points
    const opportunities = response
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().substring(1).trim());
      
    return opportunities.length > 0 ? opportunities : [
      'Implement AI-powered workflow automation to reduce operational costs by 30%',
      'Deploy intelligent customer engagement platform to increase satisfaction by 40%',
      'Develop predictive analytics system to improve decision-making accuracy by 25%'
    ];
  } catch (error) {
    console.error('Error generating strategic opportunities:', error);
    return [
      'Implement AI-powered workflow automation to reduce operational costs by 30%',
      'Deploy intelligent customer engagement platform to increase satisfaction by 40%',
      'Develop predictive analytics system to improve decision-making accuracy by 25%'
    ];
  }
}

/**
 * Generate executive summary content
 */
async function generateExecutiveSummary(
  companyName: string, 
  industry: string,
  businessContext: string, 
  keyBusinessChallenges: string[], 
  strategicOpportunities: string[]
): Promise<ExecutiveSummaryContent> {
  try {
    // Create a consolidated prompt that generates multiple sections in one call
    // This significantly reduces the number of API calls needed
    const consolidatedPrompt = `
      Generate an executive summary for ${companyName}, an ${industry} company.
      
      Business Context:
      ${businessContext}
      
      Key Business Challenges:
      ${keyBusinessChallenges.map(challenge => `- ${challenge}`).join('\n')}
      
      Strategic Opportunities:
      ${strategicOpportunities.map(opportunity => `- ${opportunity}`).join('\n')}
      
      Return a JSON object with these fields:
      1. problemStatement: A concise, powerful problem statement (2-3 sentences) that describes their core challenge
      2. partnershipProposals: Array of 5 one-sentence proposals explaining how AI solutions could address challenges
      3. timingPoints: Array of 4 one-sentence points explaining why NOW is the perfect time to implement AI
      4. businessContextSummary: A 2-3 sentence summary of their market position and business model
      5. prioritizedChallenges: Array of 3 objects with {title, description, severity, manifestations, industryRelevance}
      6. challengeSolutions: Array of 3 objects with {challenge, solution, relevanceScore, expectedImpact}
      7. industryTerminology: Array of 8-10 industry-specific terms relevant to this business
      
      Format as a valid, parseable JSON object.
    `;
    
    const result = await contentGenerationModel.generateContent(consolidatedPrompt);
    const responseText = result.response.text();
    
    // Extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from response');
    }
    
    const parsedResponse = JSON.parse(jsonMatch[0]);
    
    // Construct and return the ExecutiveSummaryContent object
    return {
      problemStatement: parsedResponse.problemStatement || '',
      partnershipProposals: parsedResponse.partnershipProposals || [],
      timingPoints: parsedResponse.timingPoints || [],
      businessContextSummary: parsedResponse.businessContextSummary || '',
      prioritizedChallenges: parsedResponse.prioritizedChallenges || [],
      challengeSolutions: parsedResponse.challengeSolutions || [],
      industryTerminology: parsedResponse.industryTerminology || []
    };
  } catch (error) {
    console.error('Error generating executive summary:', error);
    
    // Return fallback content
    return {
      problemStatement: `${companyName}'s ${industry} team faces significant challenges that require substantial manual effort that could be better spent advancing strategic initiatives directly.`,
      partnershipProposals: [
        `Develop an AI-powered system that monitors and analyzes ${industry} data`,
        `Reclaim significant staff time through automation`,
        `Enable monitoring of additional metrics and KPIs`,
        `Help shift the team to a more proactive stance`,
        `Strengthen stakeholder relationships through comprehensive coverage`
      ],
      timingPoints: [
        `${industry} competitors are increasingly adopting AI solutions`,
        `Staff currently turn down strategic opportunities due to time constraints`,
        `Implementing this solution now enables influencing upcoming business cycles`,
        `Early adoption provides competitive advantage in the ${industry} market`
      ],
      businessContextSummary: `${companyName} operates in the ${industry} industry, providing solutions to address common industry challenges while maintaining competitive positioning.`,
      prioritizedChallenges: [
        {
          title: "Manual Processes",
          description: `Manual workflows in ${industry} companies reduce efficiency and increase error rates`,
          severity: 8,
          manifestations: [
            "Excessive time spent on routine tasks",
            "High error rates in data processing"
          ],
          industryRelevance: `Common across the ${industry} industry`
        },
        {
          title: "Data Silos",
          description: `Disconnected systems prevent holistic insights in ${industry} operations`,
          severity: 7,
          manifestations: [
            "Incomplete customer views",
            "Duplicate data entry requirements"
          ],
          industryRelevance: `Prevalent issue for growing ${industry} companies`
        },
        {
          title: "Customer Experience Gaps",
          description: `Inconsistent customer experience impacts satisfaction and retention`,
          severity: 9,
          manifestations: [
            "Slow response times to customer inquiries",
            "Inconsistent service quality across channels"
          ],
          industryRelevance: `Critical differentiator in the competitive ${industry} market`
        }
      ],
      challengeSolutions: [
        {
          challenge: "Manual Processes",
          solution: `Implement AI-powered workflow automation to streamline ${industry} operations`,
          relevanceScore: 9,
          expectedImpact: "Reduce operational costs by 30% and processing time by 65%"
        },
        {
          challenge: "Data Silos",
          solution: "Deploy unified data platform with AI-driven insights engine",
          relevanceScore: 8,
          expectedImpact: "Enable 360-degree customer view and improve decision accuracy by 40%"
        },
        {
          challenge: "Customer Experience Gaps",
          solution: "Implement AI chatbots and predictive customer service tools",
          relevanceScore: 9,
          expectedImpact: "Increase customer satisfaction scores by 25% and retention by 15%"
        }
      ],
      industryTerminology: [
        `${industry} Analytics`, 
        "Predictive Modeling", 
        "Machine Learning", 
        "Workflow Automation", 
        "Natural Language Processing", 
        "Customer Journey Mapping", 
        "Operational Excellence", 
        "Digital Transformation"
      ]
    };
  }
}

/**
 * Generate all LLM content needed for PDF generation for a company
 * This is the main function to be called after a proposal is generated
 */
export async function generateLLMContent(companyName: string, companyUrl: string, businessContext: string, industry: string, proposalData?: any): Promise<LLMGeneratedContent> {
  console.log(`[LLM Content Debug] Generating LLM content for ${companyName}`);
  console.log(`[LLM Content Debug] Input businessContext length: ${businessContext?.length || 0}`);
  console.log(`[LLM Content Debug] Input businessContext preview: ${businessContext?.substring(0, 100) || 'EMPTY'}`);
  
  const companyId = getCompanyId(companyName);
  
  try {
    // Check if content already exists
    const existingContent = loadLLMContent(companyId);
    if (existingContent) {
      console.log(`LLM content already exists for ${companyName}`);
      return existingContent;
    }
    
    console.log(`Generating new LLM content for ${companyName} - using existing proposal data`);
    
    // Extract company context from existing businessContext
    const sentences = (businessContext || '').split('.').map(s => s.trim()).filter(s => s.length > 0);
    
    console.log(`[LLM Content Debug] Extracted ${sentences.length} sentences from businessContext`, {
      sentencesPreview: sentences.slice(0, 2)
    });
    
    const companyContext = sentences.length > 0 ? sentences.slice(0, 2).join('. ') + '.' : '';
    
    console.log(`[LLM Content Debug] Created companyContext: "${companyContext}"`);
    
    // Check if company context is meaningful (at least 20 characters)
    const hasValidCompanyContext = companyContext.length >= 20;
    if (!hasValidCompanyContext) {
      console.log(`[LLM Content Debug] companyContext too short (${companyContext.length} chars), need fallback`);
    }
    
    // Extract key business challenges from proposal data (if available)
    let keyBusinessChallenges: string[] = [];
    if (proposalData && proposalData.businessChallenges && proposalData.businessChallenges.length > 0) {
      // Directly use business challenges from the proposal
      keyBusinessChallenges = proposalData.businessChallenges.map((challenge: any) => {
        // Handle both string array and object array formats
        if (typeof challenge === 'string') {
          return challenge;
        } else if (challenge.description) {
          return challenge.description;
        } else if (challenge.name) {
          return challenge.name;
        }
        return `Challenge in ${industry}`;
      }).slice(0, 5);
    } else if (proposalData && proposalData.possiblePainPoints && proposalData.possiblePainPoints.length > 0) {
      // Or use pain points if business challenges aren't available
      keyBusinessChallenges = proposalData.possiblePainPoints
        .slice(0, 5)
        .map((pp: any) => pp.description || pp.title || `Challenge in ${industry}`);
    } else {
      // Fallback if nothing is available
      keyBusinessChallenges = [
        `Manual processes in ${industry} requiring significant time and resources`,
        `Data silos preventing comprehensive insights and decision-making in ${industry}`,
        `Customer experience inconsistencies impacting satisfaction and retention`,
        `Inefficient resource allocation resulting in increased operational costs`,
        `Legacy systems limiting adaptation to market changes`
      ];
    }
    
    // Extract strategic opportunities from proposal data (if available)
    let strategicOpportunities: string[] = [];
    if (proposalData && proposalData.aiOpportunities && proposalData.aiOpportunities.length > 0) {
      // Get from AI opportunities in the proposal
      strategicOpportunities = proposalData.aiOpportunities
        .slice(0, 5)
        .map((opp: any) => opp.title || opp.description || `AI opportunity for ${industry}`);
    } else {
      // Fallback strategic opportunities
      strategicOpportunities = [
        `AI-powered workflow automation for ${industry}`,
        `Predictive analytics for data-driven decision making`,
        `Intelligent customer engagement platforms`,
        `Process optimization through machine learning`,
        `Automated quality control and monitoring`
      ];
    }
    
    // Build industry terminology based on industry and proposal data
    const industryTerminology = generateIndustryTerminology(industry);
    
    // Now create the executive summary content
    console.log('[LLM Content Debug] Generating executive summary content structures');
    
    // Generate the business context summary - use the full context by default
    let businessContextSummary = businessContext || '';
    
    // If businessContext is too short or empty, try to use the companyContext if it's valid
    if (businessContextSummary.length < 20 && hasValidCompanyContext) {
      console.log('[LLM Content Debug] businessContext too short, using companyContext');
      businessContextSummary = companyContext;
    }
    
    // If both are empty or too short, create a generic industry-specific summary
    if (businessContextSummary.length < 20) {
      console.log('[LLM Content Debug] Both businessContext and companyContext are too short, using generic fallback');
      businessContextSummary = `${companyName} operates in the ${industry} industry, providing innovative solutions to address market challenges.`;
    }
    
    console.log(`[LLM Content Debug] Final businessContextSummary (${businessContextSummary.length} chars): "${businessContextSummary.substring(0, 100)}${businessContextSummary.length > 100 ? '...' : ''}"`);
    
    // Generate the complete executive summary content using existing proposal data
    const executiveSummaryContent: ExecutiveSummaryContent = {
      // Core summary elements
      problemStatement: `${companyName} faces challenges in optimizing operations and maximizing efficiency, particularly with ${keyBusinessChallenges[0]?.toLowerCase() || 'key business challenges'}.`,
      partnershipProposals: [
        `Implementation of AI solutions to address ${keyBusinessChallenges[0]?.toLowerCase() || 'operational inefficiencies'}`,
        `Development of ${strategicOpportunities[0]?.toLowerCase() || 'strategic AI capabilities'} to enhance competitive advantage`,
        `Deployment of automated workflows to reduce manual effort and improve accuracy`
      ],
      timingPoints: [
        `Increasing competitive pressure in the ${industry} industry necessitates innovation`,
        `Growing availability of AI technologies makes implementation more cost-effective`,
        `Early adoption provides opportunity to establish market differentiation`
      ],
      
      // Enhanced executive summary content - use our properly generated business context summary
      businessContextSummary,
      
      // Extract and format prioritized challenges
      prioritizedChallenges: keyBusinessChallenges.map((challenge, index) => {
        return {
          title: challenge.split(':')[0] || challenge.split('.')[0] || challenge,
          description: formatChallengeDescription(challenge),
          severity: 9 - index, // Higher severity for earlier challenges
          manifestations: extractManifestations(challenge),
          industryRelevance: `Common in the ${industry} industry, impacting operational efficiency and competitive positioning.`
        };
      }),
      
      // Create challenge-solution pairs from opportunities and challenges
      challengeSolutions: keyBusinessChallenges.map((challenge, index) => {
        const matchingOpportunity = strategicOpportunities[index] || strategicOpportunities[0];
        return {
          challenge: challenge,
          solution: `Implement ${matchingOpportunity.toLowerCase()} to address this challenge through automation and intelligence.`,
          relevanceScore: 9 - index, // Higher relevance for earlier pairs
          expectedImpact: ['High', 'Substantial', 'Significant', 'Moderate', 'Measurable'][index % 5]
        };
      }),
      
      // Add industry terminology
      industryTerminology: industryTerminology
    };
    
    // If the proposal has detailed AI opportunities, enhance the executive summary
    if (proposalData && proposalData.aiOpportunities && proposalData.aiOpportunities.length > 0) {
      // Extract more detailed problem statement from the first opportunity
      const firstOpp = proposalData.aiOpportunities[0];
      if (firstOpp.description) {
        executiveSummaryContent.problemStatement = 
          `${companyName} faces challenges that impact operational efficiency and competitive positioning. ` +
          `Specifically, ${firstOpp.description.split('.')[0]?.toLowerCase() || firstOpp.description.toLowerCase()}.`;
      }
      
      // Create more detailed partnership proposals from opportunities
      executiveSummaryContent.partnershipProposals = proposalData.aiOpportunities
        .slice(0, 3)
        .map((opp: any) => {
          return `Implementation of ${opp.title || 'AI solution'} to ${opp.description?.split('.')[0]?.toLowerCase() || 'address business challenges'}`;
        });
      
      // Extract timing points from recommended approach if available
      if (proposalData.recommendedApproach) {
        const approachSentences = proposalData.recommendedApproach.split('.').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
        if (approachSentences.length >= 3) {
          executiveSummaryContent.timingPoints = approachSentences.slice(0, 3);
        }
      }
      
      // Create better challenge-solution pairs from AI opportunities
      executiveSummaryContent.challengeSolutions = proposalData.aiOpportunities
        .slice(0, 5)
        .map((opp: any, index: number) => {
          // Find a matching challenge if possible
          const matchingChallenge = keyBusinessChallenges[index] || 
            `Inefficiency in ${opp.title?.split(' ').slice(1).join(' ') || industry} processes`;
          
          return {
            challenge: matchingChallenge,
            solution: `${opp.title}: ${opp.description || 'AI-powered solution to enhance operations'}`,
            relevanceScore: 10 - index, // Higher score for earlier opportunities
            expectedImpact: opp.impact || ['High', 'Substantial', 'Significant', 'Moderate', 'Measurable'][index % 5]
          };
        });
    }
    
    // Assemble the complete content object
    const generatedContent: LLMGeneratedContent = {
      companyContext,
      keyBusinessChallenges,
      strategicOpportunities,
      executiveSummaryContent,
      generatedAt: Date.now()
    };
    
    // Save to cache
    saveLLMContent(companyId, generatedContent);
    console.log(`Successfully generated and saved LLM content for ${companyName} without any API calls`);
    
    return generatedContent;
  } catch (error) {
    console.error(`Error generating LLM content for ${companyName}:`, error);
    
    // Provide a basic fallback in case of errors
    const fallbackContent: LLMGeneratedContent = {
      companyContext: `${companyName} is a company in the ${industry} industry.`,
      keyBusinessChallenges: [
        `Operational inefficiency in ${industry}`,
        `Data management challenges`,
        `Customer engagement limitations`
      ],
      strategicOpportunities: [
        `AI-powered workflow automation`,
        `Predictive analytics implementation`,
        `Intelligent customer engagement`
      ],
      executiveSummaryContent: {
        problemStatement: `${companyName} faces typical challenges in the ${industry} industry.`,
        partnershipProposals: [
          `Implementation of AI solutions for operational efficiency`,
          `Development of data analytics capabilities`,
          `Deployment of automated customer engagement systems`
        ],
        timingPoints: [
          `Growing industry competition requires innovation`,
          `Increasing data volumes create analysis opportunities`,
          `Customer expectations are evolving rapidly`
        ],
        businessContextSummary: businessContext || `${companyName} operates in the ${industry} industry.`,
        prioritizedChallenges: [
          {
            title: `Operational Efficiency`,
            description: `Manual processes limiting productivity and scalability.`,
            severity: 8,
            manifestations: [`Increased costs`, `Extended processing times`, `Error rates`],
            industryRelevance: `Common challenge in ${industry}`
          },
          {
            title: `Data Management`,
            description: `Siloed data preventing comprehensive business insights.`,
            severity: 7,
            manifestations: [`Delayed reporting`, `Incomplete analysis`, `Decision lag`],
            industryRelevance: `Affects most ${industry} organizations`
          }
        ],
        challengeSolutions: [
          {
            challenge: `Operational Efficiency`,
            solution: `Implement AI-powered workflow automation to reduce manual effort.`,
            relevanceScore: 9,
            expectedImpact: `High`
          },
          {
            challenge: `Data Management`,
            solution: `Deploy predictive analytics to unlock data value.`,
            relevanceScore: 8,
            expectedImpact: `Substantial`
          }
        ],
        industryTerminology: generateIndustryTerminology(industry)
      },
      generatedAt: Date.now()
    };
    
    return fallbackContent;
  }
}

// Helper functions to format and extract data for executive summary
function formatChallengeDescription(challenge: string): string {
  // Remove any bullet points or numbering
  let cleanedChallenge = challenge.replace(/^[-•*\d.]+\s*/g, '');
  
  // Ensure it's a complete sentence
  if (!cleanedChallenge.endsWith('.')) {
    cleanedChallenge += '.';
  }
  
  return cleanedChallenge;
}

function extractManifestations(challenge: string): string[] {
  if (!challenge) {
    return ["Process inefficiencies impacting productivity", "Increased operational costs"];
  }
  
  // Generate specific manifestations based on the challenge
  const lowercaseChallenge = challenge.toLowerCase();
  
  if (lowercaseChallenge.includes('manual') || lowercaseChallenge.includes('workflow')) {
    return ["Excessive time spent on routine tasks", "High error rates in data processing"];
  } else if (lowercaseChallenge.includes('data') || lowercaseChallenge.includes('silo')) {
    return ["Incomplete customer views", "Duplicate data entry requirements"];
  } else if (lowercaseChallenge.includes('customer') || lowercaseChallenge.includes('experience')) {
    return ["Inconsistent service across channels", "Slow response times to inquiries"];
  } else if (lowercaseChallenge.includes('cost') || lowercaseChallenge.includes('expense')) {
    return ["Budget overruns on routine operations", "Difficulty forecasting operational costs"];
  } else {
    // Generic fallback
    return [
      "Reduced operational efficiency", 
      "Difficulty scaling with business growth"
    ];
  }
}

function generateIndustryTerminology(industry: string): string[] {
  // Base terms for any industry
  const baseTerms = [
    "Predictive Analytics",
    "Machine Learning",
    "Workflow Automation",
    "Natural Language Processing",
    "Digital Transformation"
  ];
  
  // Industry-specific terms based on industry name
  const lowercaseIndustry = industry.toLowerCase();
  
  if (lowercaseIndustry.includes('tech') || lowercaseIndustry.includes('software')) {
    return [...baseTerms, "DevOps", "Agile Methodology", "Technical Debt", "Scalability", "Cloud Infrastructure"];
  } else if (lowercaseIndustry.includes('finance') || lowercaseIndustry.includes('bank')) {
    return [...baseTerms, "Regulatory Compliance", "Risk Management", "Fraud Detection", "Customer Retention", "Open Banking"];
  } else if (lowercaseIndustry.includes('health') || lowercaseIndustry.includes('medical')) {
    return [...baseTerms, "Electronic Health Records", "Patient Engagement", "Precision Medicine", "Regulatory Compliance", "Clinical Efficiency"];
  } else if (lowercaseIndustry.includes('retail') || lowercaseIndustry.includes('commerce')) {
    return [...baseTerms, "Omnichannel", "Customer Journey", "Inventory Optimization", "Price Elasticity", "Personalization"];
  } else if (lowercaseIndustry.includes('manufact')) {
    return [...baseTerms, "Supply Chain Optimization", "Predictive Maintenance", "Quality Control", "Just-in-Time", "IoT Sensors"];
  } else {
    // Generic industry terms
    return [
      `${industry} Analytics`,
      "Predictive Modeling",
      "Machine Learning",
      "Workflow Automation",
      "Natural Language Processing",
      "Customer Journey Mapping",
      "Operational Excellence",
      "Digital Transformation"
    ];
  }
} 