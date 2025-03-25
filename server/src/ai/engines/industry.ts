import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
const VERBOSE_LOGGING = false;  // Set to true for detailed logs, including LLM outputs

// Helper function to clean JSON response
function cleanJsonResponse(text: string): string {
  // Remove markdown code blocks if present
  text = text.replace(/```json\n/g, '').replace(/```\n/g, '').replace(/```/g, '');
  // Remove any leading/trailing whitespace
  text = text.trim();
  return text;
}

export interface IndustryResult {
  industry: string;
  industryInsights: string[];
  possiblePainPoints: PossiblePainPoint[];
}

export interface PossiblePainPoint {
  id: string;
  title: string;
  description: string;
  typicalSeverity: number; // 1-10
  commonManifestations: string[];
  industryRelevance: string;
}

async function extractPossiblePainPoints(industryContext: string): Promise<PossiblePainPoint[]> {
  console.log('Extracting possible industry pain points');
  
  const painPointPrompt = `
    Based on the industry context provided, identify 5-7 POSSIBLE business pain points that companies in this sector commonly face.
    
    Industry Context:
    ${industryContext}
    
    For each possible pain point:
    1. Provide a concise title (max 5 words)
    2. Write a brief description of the issue (2-3 sentences)
    3. Assign a typical severity score (1-10) based on industry benchmarks
    4. List 2-3 examples of how this pain point typically manifests
    5. Explain why companies in this industry often face this challenge (1-2 sentences)
    
    Return only a valid JSON array with no markdown formatting:
    [
      {
        "title": "Possible pain point title",
        "description": "Description of this common industry challenge",
        "typicalSeverity": 8,
        "commonManifestations": ["symptom1", "symptom2"],
        "industryRelevance": "Companies in this industry often face this because..."
      }
    ]
  `;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: painPointPrompt }] }],
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
    
    const painPoints = JSON.parse(cleanedResponse);
    
    // Add unique IDs to each pain point
    return painPoints.map((point: any, index: number) => ({
      ...point,
      id: `pain_point_${index + 1}`,
      typicalSeverity: Math.min(10, Math.max(1, point.typicalSeverity || 5)) // Ensure between 1-10
    }));
  } catch (error) {
    console.error('Error parsing pain points:', error);
    if (VERBOSE_LOGGING) {
      console.error('Raw response:', textResponse);
    }
    
    // Return default pain points if parsing fails
    return [
      {
        id: "pain_point_1",
        title: "Operational Inefficiency",
        description: "Manual processes and legacy systems creating workflow bottlenecks.",
        typicalSeverity: 7,
        commonManifestations: ["Long processing times", "High error rates", "Customer complaints"],
        industryRelevance: "Common across most industries as digital transformation accelerates."
      },
      {
        id: "pain_point_2", 
        title: "Data Management Challenges",
        description: "Difficulty integrating and utilizing data effectively across systems.",
        typicalSeverity: 8,
        commonManifestations: ["Incomplete reporting", "Inconsistent data", "Decision delays"],
        industryRelevance: "Increasingly important as data volumes grow exponentially."
      },
      {
        id: "pain_point_3",
        title: "Customer Experience Gaps",
        description: "Inability to meet modern customer expectations for personalization and responsiveness.",
        typicalSeverity: 8,
        commonManifestations: ["Declining satisfaction", "Lost customers", "Negative reviews"],
        industryRelevance: "Critical factor in customer retention across all sectors."
      }
    ];
  }
}

export async function getIndustryInsights(domainKnowledge: string): Promise<IndustryResult> {
  console.log('Getting industry insights');
  
  const industryPrompt = `
    You are an AI industry analyst with expertise across multiple sectors.
    Based on the following domain knowledge, identify:
    1. The specific industry the company belongs to
    2. 5-7 industry-specific insights or trends that might influence AI adoption
    
    Domain Knowledge:
    ${domainKnowledge}
    
    Return only a valid JSON object with no markdown formatting or other text:
    {
      "industry": "specific industry name",
      "industryInsights": [
        "industry insight 1",
        "industry insight 2",
        "etc..."
      ]
    }
  `;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: industryPrompt }] }],
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
    const industry = jsonResponse.industry || 'Technology';
    const industryInsights = jsonResponse.industryInsights || [];
    
    // Extract possible pain points
    const possiblePainPoints = await extractPossiblePainPoints(industry + '\n' + industryInsights.join('\n'));
    
    return {
      industry,
      industryInsights,
      possiblePainPoints
    };
  } catch (error) {
    console.error('Error in industry insights:', error);
    console.error('Raw response:', textResponse);
    
    return {
      industry: 'Technology',
      industryInsights: [
        'AI adoption is rapidly increasing across the technology sector',
        'Companies are focusing on data-driven decision making',
        'Automation of routine tasks is a key trend'
      ],
      possiblePainPoints: [
        {
          id: "pain_point_1",
          title: "Talent Acquisition Challenges",
          description: "Difficulty finding and retaining skilled technical personnel.",
          typicalSeverity: 8,
          commonManifestations: ["Extended hiring times", "High turnover", "Skill gaps"],
          industryRelevance: "Technology companies face intense competition for limited talent."
        },
        {
          id: "pain_point_2",
          title: "Rapid Technology Evolution",
          description: "Challenge of keeping systems and skills current with fast-changing technology.",
          typicalSeverity: 7,
          commonManifestations: ["Technical debt", "Compatibility issues", "Competitive disadvantage"],
          industryRelevance: "Technology sector faces constant disruption from new innovations."
        }
      ]
    };
  }
} 