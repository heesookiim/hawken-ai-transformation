import React, { useState, useEffect } from 'react';
import { Document, Page, Text, View, StyleSheet, Svg, Path, PDFViewer, Line, Rect, Circle, Link, Font, Image, G } from '@react-pdf/renderer';
import { CompanyData, AIOpportunity } from '@/types/api';
import { BusinessChallenge } from '@/lib/api';
import { usePDFData } from './hooks/usePDFData';
import { styles, chapterStyles, coverPageStyles, tocPageStyles, businessLetterStyles, closingPageStyles } from './styles';
import dotenv from 'dotenv';
import { apiService } from '@/lib/api';
import { Footer } from './ui-components/Footer';
import { PageNumber } from './ui-components/PageNumber';

// Import extracted components and hooks
import { ScoreBar } from './ui-components/ScoreBar';
import { PieChart } from './ui-components/PieChart';
import { OpportunityScores } from './ui-components/OpportunityScores';
import { CategoryDistribution } from './ui-components/CategoryDistribution';

// Import the shared pain point utility
import { getPrioritizedPainPoints, IPainPoint, ProcessedPainPoint, processPainPoints } from '@/utils/painPoints';

// Load environment variables
dotenv.config();

// Register fonts
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2' },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2JL7.woff2', fontWeight: 700 },
  ],
});

// Update the IndustryInsights interface to include possiblePainPoints
interface IndustryInsights {
  industry: string;
  industryInsights: any[];
  possiblePainPoints?: Array<{
    title?: string;
    description?: string;
    typicalSeverity?: number;
    [key: string]: any;
  }>;
}

interface Pattern {
  id: string;
  pattern: string;
  description: string;
  [key: string]: any;
}

interface DashboardPDFProps {
  companyData: CompanyData;
  industryInsights: IndustryInsights;
  businessChallenges: BusinessChallenge[] | string[];
  pdfOptions?: {
    useCache?: boolean;
  };
}

const COLORS = ['#4CAF50', '#2196F3', '#FFC107', '#E91E63', '#9C27B0', '#00BCD4', '#FF5722', '#795548'];

/**
 * Reusable component for displaying severity scores with consistent styling
 */
const SeverityBadge = ({ severity }: { severity: number }) => {
  // Ensure severity is a valid number between 1-10
  const safeValue = typeof severity === 'number' ? 
    Math.min(10, Math.max(1, severity)) : 5;
  
  // Determine colors based on severity level
  const backgroundColor = 
    safeValue >= 8 ? '#FEE2E2' :
    safeValue >= 6 ? '#FEF3C7' :
    '#DCFCE7';
  
  const borderColor = 
    safeValue >= 8 ? '#FECACA' :
    safeValue >= 6 ? '#FDE68A' :
    '#A7F3D0';
  
  const textColor = 
    safeValue >= 8 ? '#B91C1C' :
    safeValue >= 6 ? '#B45309' :
    '#166534';
  
  return (
    <View style={{ 
      backgroundColor,
      width: 22,
      height: 22,
      borderRadius: 11,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 4,
      borderWidth: 1,
      borderColor,
      overflow: 'hidden', // Ensures content stays within border radius
    }}>
      <Text style={{ 
        fontSize: 11, 
        color: textColor,
        fontWeight: 'bold',
        textAlign: 'center',
        // Set both alignSelf and width to ensure proper centering
        alignSelf: 'center',
        width: '100%',
      }}>
        {safeValue}
      </Text>
    </View>
  );
};

const StrategyMatrix = ({ opportunities }: { opportunities: AIOpportunity[] }) => {
  // Convert impact and complexity to numerical scores
  const getScore = (value: string): number => {
    switch (value.toLowerCase()) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  };

  // Categorize opportunities into quadrants based on impact and complexity
  const quadrants = {
    'Major Projects': {
      description: 'High Impact, High Complexity',
      items: [] as AIOpportunity[],
    },
    'Quick Wins': {
      description: 'High Impact, Low Complexity',
      items: [] as AIOpportunity[],
    },
    'Avoid': {
      description: 'Low Impact, High Complexity',
      items: [] as AIOpportunity[],
    },
    'Low Priority': {
      description: 'Low Impact, Low Complexity',
      items: [] as AIOpportunity[],
    },
  };

  opportunities.forEach(opportunity => {
    const impact = getScore(opportunity.impact);
    const complexity = getScore(opportunity.complexity);

    // Properly categorize based on impact and complexity
    if (impact >= 2 && complexity >= 2) {
      // High Impact, High Complexity = Major Projects
      quadrants['Major Projects'].items.push(opportunity);
    } else if (impact >= 2 && complexity < 2) {
      // High Impact, Low Complexity = Quick Wins
      quadrants['Quick Wins'].items.push(opportunity);
    } else if (impact < 2 && complexity >= 2) {
      // Low Impact, High Complexity = Avoid
      quadrants['Avoid'].items.push(opportunity);
    } else {
      // Low Impact, Low Complexity = Low Priority
      quadrants['Low Priority'].items.push(opportunity);
    }
  });

  return (
    <View style={styles.page}>
      <Text style={styles.matrixTitle}>Strategy Prioritization Matrix</Text>
      
      {/* Matrix Display */}
      <View style={styles.matrixContainer}>
        {/* Top row */}
        <View style={styles.matrixRow}>
          {/* Major Projects - Top Left */}
          <View style={[styles.matrixQuadrant, { backgroundColor: '#e6f7ff' }]}>
            <Text style={styles.quadrantTitle}>Major Projects</Text>
            <Text style={styles.quadrantDesc}>High Impact, High Complexity</Text>
            {quadrants['Major Projects'].items.map((item, i) => (
              <Text key={i} style={styles.strategyItem}>• {item.title}</Text>
            ))}
          </View>
          
          {/* Quick Wins - Top Right */}
          <View style={[styles.matrixQuadrant, { backgroundColor: '#e6fffa' }]}>
            <Text style={styles.quadrantTitle}>Quick Wins</Text>
            <Text style={styles.quadrantDesc}>High Impact, Low Complexity</Text>
            {quadrants['Quick Wins'].items.map((item, i) => (
              <Text key={i} style={styles.strategyItem}>• {item.title}</Text>
            ))}
          </View>
        </View>
        
        {/* Bottom row */}
        <View style={styles.matrixRow}>
          {/* Avoid - Bottom Left */}
          <View style={[styles.matrixQuadrant, { backgroundColor: '#fff0f6' }]}>
            <Text style={styles.quadrantTitle}>Avoid</Text>
            <Text style={styles.quadrantDesc}>Low Impact, High Complexity</Text>
            {quadrants['Avoid'].items.map((item, i) => (
              <Text key={i} style={styles.strategyItem}>• {item.title}</Text>
            ))}
          </View>
          
          {/* Low Priority - Bottom Right */}
          <View style={[styles.matrixQuadrant, { backgroundColor: '#fffde7' }]}>
            <Text style={styles.quadrantTitle}>Low Priority</Text>
            <Text style={styles.quadrantDesc}>Low Impact, Low Complexity</Text>
            {quadrants['Low Priority'].items.map((item, i) => (
              <Text key={i} style={styles.strategyItem}>• {item.title}</Text>
            ))}
          </View>
        </View>
      </View>
      
      {/* Axes Labels */}
      <View style={styles.axisContainer}>
        <Text style={styles.axisLabel}>Low Impact</Text>
        <Text style={styles.axisLabel}>High Impact</Text>
      </View>
      <View style={styles.axisContainer}>
        <Text style={styles.axisLabel}>High Complexity</Text>
        <Text style={styles.axisLabel}>Low Complexity</Text>
      </View>
    </View>
  );
};

const getImagePath = (imageName: string) => {
  // Remove .svg from the input if it exists
  const baseName = imageName.replace('.svg', '');
  return `${baseName}.png`;
};

const CoverLetter = ({ companyData }: { companyData: CompanyData }) => (
  <Page size="A4">
    <View style={styles.backgroundContainer}>
      <Image src="/images/intro.png" style={styles.backgroundImageStyle} />
    </View>
    
    {/* Content layer */}
    <View style={coverPageStyles.textContainer}>
      <Text style={{ ...coverPageStyles.title, color: 'black', backgroundColor: 'transparent' }}>
        AI Transformation Plan 
      </Text>
      <Text style={coverPageStyles.subtitle}>
        for {companyData.companyName}
        </Text>
    </View>

    {/* Contact Information */}
    <View style={{
      position: 'absolute',
      bottom: 30,  
      left: 30,
      right: 30,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 10,
    }}>
      <Text style={{ fontSize: 10, color: '#ffffff' }}>hawken.ai</Text>
      <Text style={{ fontSize: 10, color: '#ffffff' }}>© 2025 Hawken. All rights reserved.</Text>
    </View>
  </Page>
);

// Create a combined FooterWithPageNumber component
const FooterWithPageNumber = ({ pageNumber, fixed = false }: { pageNumber: number, fixed?: boolean }) => (
  <View style={styles.footer} fixed={fixed}>
    <Text style={styles.footerText}>© 2025 Hawken. All rights reserved.</Text>
    <Text style={styles.pageNumber}>{pageNumber}</Text>
  </View>
);

const TableOfContents = () => (
  <PageContainer pageNumber={1} title="Table of Contents">
    {/* Executive Summary Section */}
    <View style={styles.tocSection}>
      <View style={styles.tocMainItem}>
        <Text style={styles.tocMainNumber}>1</Text>
        <Text style={styles.tocMainText}>Executive Summary</Text>
        <Text style={styles.tocPage}>2</Text>
      </View>
      <View style={styles.tocSubItem}>
        <Text style={styles.tocSubNumber}>1.1</Text>
        <Text style={styles.tocSubText}>Company's Mission</Text>
        <Text style={styles.tocPage}>2</Text>
      </View>
      <View style={styles.tocSubItem}>
        <Text style={styles.tocSubNumber}>1.2</Text>
        <Text style={styles.tocSubText}>Common Industry Pain Points</Text>
        <Text style={styles.tocPage}>2</Text>
      </View>
      <View style={styles.tocSubItem}>
        <Text style={styles.tocSubNumber}>1.3</Text>
        <Text style={styles.tocSubText}>Recommended AI Solutions</Text>
        <Text style={styles.tocPage}>2</Text>
      </View>
    </View>
    
    {/* Top Opportunities Section */}
    <View style={styles.tocSection}>
      <View style={styles.tocMainItem}>
        <Text style={styles.tocMainNumber}>2</Text>
        <Text style={styles.tocMainText}>Top AI Opportunities</Text>
        <Text style={styles.tocPage}>3</Text>
      </View>
      <View style={styles.tocSubItem}>
        <Text style={styles.tocSubNumber}>2.1</Text>
        <Text style={styles.tocSubText}>Strategic Assessment</Text>
        <Text style={styles.tocPage}>3</Text>
      </View>
      <View style={styles.tocSubItem}>
        <Text style={styles.tocSubNumber}>2.2</Text>
        <Text style={styles.tocSubText}>Key Benefits</Text>
        <Text style={styles.tocPage}>4</Text>
      </View>
      <View style={styles.tocSubItem}>
        <Text style={styles.tocSubNumber}>2.3</Text>
        <Text style={styles.tocSubText}>Implementation Steps</Text>
        <Text style={styles.tocPage}>4</Text>
      </View>
    </View>
    
    {/* Next Steps Section */}
    <View style={styles.tocSection}>
      <View style={styles.tocMainItem}>
        <Text style={styles.tocMainNumber}>3</Text>
        <Text style={styles.tocMainText}>Next Steps & Action Plan</Text>
        <Text style={styles.tocPage}>6</Text>
      </View>
      <View style={styles.tocSubItem}>
        <Text style={styles.tocSubNumber}>3.1</Text>
        <Text style={styles.tocSubText}>Overview</Text>
        <Text style={styles.tocPage}>6</Text>
      </View>
      <View style={styles.tocSubItem}>
        <Text style={styles.tocSubNumber}>3.2</Text>
        <Text style={styles.tocSubText}>Recommended Approach</Text>
        <Text style={styles.tocPage}>6</Text>
      </View>
      <View style={styles.tocSubItem}>
        <Text style={styles.tocSubNumber}>3.3</Text>
        <Text style={styles.tocSubText}>Timeline</Text>
        <Text style={styles.tocPage}>6</Text>
      </View>
    </View>
    
    {/* Why HawkenAI Section */}
    <View style={styles.tocSection}>
      <View style={styles.tocMainItem}>
        <Text style={styles.tocMainNumber}>4</Text>
        <Text style={styles.tocMainText}>Why HawkenAI?</Text>
        <Text style={styles.tocPage}>7</Text>
      </View>
      <View style={styles.tocSubItem}>
        <Text style={styles.tocSubNumber}>4.1</Text>
        <Text style={styles.tocSubText}>Our Advantage</Text>
        <Text style={styles.tocPage}>7</Text>
      </View>
      <View style={styles.tocSubItem}>
        <Text style={styles.tocSubNumber}>4.2</Text>
        <Text style={styles.tocSubText}>Industry Expertise</Text>
        <Text style={styles.tocPage}>7</Text>
      </View>
      <View style={styles.tocSubItem}>
        <Text style={styles.tocSubNumber}>4.3</Text>
        <Text style={styles.tocSubText}>Our Commitment</Text>
        <Text style={styles.tocPage}>7</Text>
      </View>
    </View>
  </PageContainer>
);

const ExecutiveSummary = ({ companyData, businessChallenges, pdfOptions = { useCache: true }, preloadedData, industryInsights }: { 
  companyData: CompanyData, 
  businessChallenges: BusinessChallenge[] | string[],
  pdfOptions?: { useCache?: boolean },
  preloadedData: any,
  industryInsights?: IndustryInsights
}) => {
  console.log('[PDF Debug] ExecutiveSummary component rendering initiated');
  
  // Use the consolidated data hook
  const {
    conciseBusinessSummary,
    prioritizedChallenges,
    challengeSolutions,
    problemStatement,
    partnershipProposals,
    timingPoints,
    isLoading,
    error
  } = usePDFData(
    companyData,
    businessChallenges,
    industryInsights,
    pdfOptions
  );
  
  console.log('[PDF] ExecutiveSummary component prepared for rendering', {
    hasChallenges: prioritizedChallenges.length,
    hasSolutions: challengeSolutions.length,
    isLoading
  });

  // Get all addressable pain points for this section
  const safeChallenges = prioritizedChallenges
    .map(challenge => ({
      id: challenge.id || '',
      title: typeof challenge.title === 'string' ? challenge.title : '',
      description: typeof challenge.description === 'string' ? challenge.description : '',
      severity: typeof challenge.severity === 'number' ? challenge.severity : 5,
      // Check if this pain point is addressable (has relevant strategies)
      isAddressable: companyData.aiOpportunities.some(opp => 
        opp.painPointRelevances?.some((rel: { painPointId: string; relevanceScore: number }) => 
          rel.painPointId === challenge.id && rel.relevanceScore >= 7
        )
      )
    }))
    .filter(challenge => challenge.title);

  // Process AI solutions for grouping and display
  const safeGroupedSolutions = Array.isArray(challengeSolutions) ? 
    challengeSolutions
      .map(item => ({
        challenge: typeof item.challenge === 'string' ? item.challenge : '',
        solutions: Array.isArray(item.solutions) ? item.solutions
          .map(sol => ({
            solution: typeof sol.solution === 'string' ? sol.solution : '',
            relevanceScore: typeof sol.relevanceScore === 'number' ? sol.relevanceScore : 0,
            expectedImpact: typeof sol.expectedImpact === 'string' ? sol.expectedImpact : ''
          }))
          .filter(sol => sol.solution) 
          : []
      }))
      .filter(item => item.challenge && item.solutions.length > 0)
    : [];

  return (
    <PageContainer pageNumber={2} title="Executive Summary">
      {/* Business Context section */}
      <PaginatedSection title="Company's Mission" showContinuationText={false}>
        <Text style={{ fontSize: 12, lineHeight: 1.5 }}>
          {conciseBusinessSummary}
        </Text>
      </PaginatedSection>
      
      {/* Pain Points section */}
      <PaginatedSection title="Common Industry Pain Points" showContinuationText={safeChallenges.length > 3}>
        {/* Explanatory text */}
        <Text style={{ fontSize: 11, color: '#4B5563', marginBottom: 12, lineHeight: 1.4 }}>
          Based on industry analysis, companies with similar profiles often face these challenges. 
          Our AI strategy recommendations are designed to address these potential pain points.
        </Text>
        
        {safeChallenges.length > 0 ? (
          <View>
            
            {/* Pain points list with fixed layout to prevent overlap */}
            {safeChallenges.map((challenge, idx) => (
              <View key={idx} style={{ marginBottom: 10, borderBottom: idx < safeChallenges.length - 1 ? '1pt solid #E5E7EB' : 'none', paddingBottom: 8 }}>
                <View style={{ flexDirection: 'row', marginBottom: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                  {/* Challenge title in its own container */}
                  <Text style={{ fontSize: 12, fontWeight: 'bold', marginRight: 8, flex: 1 }}>
                    {challenge.title}
                  </Text>
                  
                  {/* Addressable badge with proper positioning */}
                  {challenge.isAddressable && (
                    <View style={{ 
                      backgroundColor: '#DCFCE7', 
                      paddingVertical: 2, 
                      paddingHorizontal: 6, 
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: '#BBF7D0',
                      maxHeight: 16,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Text style={{ fontSize: 8, color: '#166534' }}>
                        Addressable
                      </Text>
                    </View>
                  )}
                </View>
                
                {/* Severity indicator row with proper spacing */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ fontSize: 9, color: '#6B7280', marginRight: 4 }}>
                    Severity:
                  </Text>
                  <SeverityBadge severity={challenge.severity} />
                </View>
                
                {/* Description with proper spacing */}
                <Text style={{ fontSize: 10, color: '#4B5563', lineHeight: 1.4 }}>
                  {challenge.description}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={{ fontSize: 11, color: '#4B5563', fontStyle: 'italic' }}>
            No specific pain points identified for your industry.
          </Text>
        )}
      </PaginatedSection>
      
      {/* AI Solutions section */}
      <PaginatedSection title="Recommended AI Solutions" showContinuationText={safeGroupedSolutions.length > 3}>
        {safeGroupedSolutions.length > 0 ? (
          <View>
            {safeGroupedSolutions.map((group, idx) => (
              <View key={idx} style={{ 
                marginBottom: 12, 
                borderBottom: idx < safeGroupedSolutions.length - 1 ? '1pt solid #E5E7EB' : 'none',
                paddingBottom: 8
              }}>
                {/* Challenge title */}
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 }}>
                  {group.challenge}
                </Text>
                
                {/* Solutions with proper vertical spacing */}
                <View style={{ marginLeft: 12 }}>
                  {group.solutions.map((solution, solIdx) => (
                    <View key={solIdx} style={{ marginBottom: 6 }}>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Solution text */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                          <Text style={{ fontSize: 10, color: '#4B5563', marginRight: 4 }}>•</Text>
                          <Text style={{ fontSize: 10, flex: 1 }}>{solution.solution}</Text>
                        </View>
                        
                        {/* Relevance badge with proper spacing */}
                        <View style={{ 
                          backgroundColor: '#F3F4F6',
                          paddingHorizontal: 4,
                          paddingVertical: 2,
                          borderRadius: 4,
                          alignSelf: 'flex-start'
                        }}>
                          <Text style={{ 
                            fontSize: 8, 
                            color: solution.relevanceScore >= 8 ? '#047857' : '#6B7280',
                            fontWeight: 'bold' 
                          }}>
                            Relevance: {solution.relevanceScore}/10
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={{ fontSize: 11, color: '#4B5563', fontStyle: 'italic' }}>
            No AI solutions have been identified yet.
          </Text>
        )}
      </PaginatedSection>
      
      {/* Critical Timing section */}
      <PaginatedSection title="The timing is critical as:" showContinuationText={false}>
        <View style={{ marginLeft: 10 }}>
          {timingPoints.map((point, index) => (
            <KeepTogether key={index}>
              <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                <Text style={{ fontSize: 12, marginRight: 8 }}>•</Text>
                <Text style={{ fontSize: 12, flex: 1 }}>{point}</Text>
              </View>
            </KeepTogether>
          ))}
        </View>
      </PaginatedSection>
      
      {/* Call-to-action conclusion */}
      <View style={styles.calloutBox}>
        <Text style={styles.calloutText}>
          By implementing these AI solutions, {companyData.companyName} can transform operational challenges into 
          strategic advantages, improving efficiency, reducing costs, and enhancing customer experiences.
        </Text>
      </View>
    </PageContainer>
  );
};

const TopOpportunities = ({ companyData, businessChallenges, pdfOptions = { useCache: true } }: { 
  companyData: CompanyData, 
  businessChallenges: BusinessChallenge[] | string[],
  pdfOptions?: { useCache?: boolean } 
}) => {
  // Sort opportunities by combinedScore in descending order
  const opportunitiesArray = companyData?.aiOpportunities ? [...companyData.aiOpportunities] : [];
  const sortedOpportunities = opportunitiesArray
    .sort((a, b) => ((b.combinedScore || 0) - (a.combinedScore || 0)))
    .slice(0, 5); // Get top 5 opportunities

  // Helper function to determine the color based on value
  const getImpactColor = (impact: string) => {
    if (impact === 'High') return '#10B981'; // Green
    if (impact === 'Medium') return '#F59E0B'; // Amber
    return '#EF4444'; // Red
  };
  
  const getComplexityColor = (complexity: string) => {
    if (complexity === 'Low') return '#10B981'; // Green
    if (complexity === 'Medium') return '#F59E0B'; // Amber
    return '#EF4444'; // Red
  };
  
  const getTimeframeColor = (timeframe: string) => {
    if (timeframe === 'Short-term') return '#10B981'; // Green
    if (timeframe === 'Medium-term') return '#F59E0B'; // Amber
    return '#3B82F6'; // Blue for Long-term
  };

  return (
    <PageContainer pageNumber={3} title="Top AI Opportunities">
      <PaginatedSection title="">
        <Text style={{ fontSize: 12, marginBottom: 15, lineHeight: 1.5 }}>
          Based on our analysis of your business context, industry trends, and AI capabilities, 
          we've identified the following high-impact opportunities for your organization.
        </Text>
        
        {sortedOpportunities.length > 0 ? (
          sortedOpportunities.map((opportunity, index) => {
            // Ensure all opportunity properties are valid strings
            const title = typeof opportunity.title === 'string' ? opportunity.title : '';
            const description = typeof opportunity.description === 'string' ? opportunity.description : '';
            const impact = typeof opportunity.impact === 'string' ? opportunity.impact : 'Medium';
            const complexity = typeof opportunity.complexity === 'string' ? opportunity.complexity : 'Medium';
            const timeframe = typeof opportunity.timeframe === 'string' ? opportunity.timeframe : 'Medium-term';
            
            return (
              <KeepTogether key={index}>
                <View style={{ marginBottom: 25, borderBottom: index < sortedOpportunities.length - 1 ? '1pt solid #E5E7EB' : 'none', paddingBottom: 15 }}>
                  {/* Opportunity title with number */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{ 
                      width: 24, 
                      height: 24, 
                      borderRadius: 12, 
                      backgroundColor: '#1e40af', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      marginRight: 10
                    }}>
                      <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>{index + 1}</Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', flex: 1 }}>{title}</Text>
                  </View>
                  
                  {/* Description */}
                  <Text style={{ fontSize: 12, marginBottom: 12, lineHeight: 1.5, marginLeft: 34 }}>
                    {description}
                  </Text>
                  
                  {/* Metrics with proper spacing and layout */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginLeft: 34, marginBottom: 5 }}>
                    {/* Impact */}
                    <View style={{ width: '33%', marginBottom: 8 }}>
                      <Text style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>IMPACT</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: 4, 
                          backgroundColor: getImpactColor(impact),
                          marginRight: 4
                        }} />
                        <Text style={{ 
                          fontSize: 10, 
                          color: '#374151',
                          fontWeight: 'bold'
                        }}>
                          {impact}
                        </Text>
                      </View>
                    </View>
                    
                    {/* Complexity */}
                    <View style={{ width: '33%', marginBottom: 8 }}>
                      <Text style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>COMPLEXITY</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: 4, 
                          backgroundColor: getComplexityColor(complexity),
                          marginRight: 4
                        }} />
                        <Text style={{ 
                          fontSize: 10, 
                          color: '#374151',
                          fontWeight: 'bold'
                        }}>
                          {complexity}
                        </Text>
                      </View>
                    </View>
                    
                    {/* Timeframe */}
                    <View style={{ width: '33%', marginBottom: 8 }}>
                      <Text style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>TIMEFRAME</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: 4, 
                          backgroundColor: getTimeframeColor(timeframe),
                          marginRight: 4
                        }} />
                        <Text style={{ 
                          fontSize: 10, 
                          color: '#374151',
                          fontWeight: 'bold'
                        }}>
                          {timeframe}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </KeepTogether>
            );
          })
        ) : (
          <Text style={{ fontSize: 12, lineHeight: 1.5 }}>
            No opportunities have been identified yet. Please complete the AI assessment to generate opportunities.
          </Text>
        )}
      </PaginatedSection>
    </PageContainer>
  );
};

// Add more opportunity details page for opportunities 2-5
const OpportunityDetailPages = ({ opportunities }: { opportunities: AIOpportunity[] }) => {
  if (!opportunities || !Array.isArray(opportunities) || opportunities.length <= 1) {
    console.log('[PDF Debug] No additional opportunities to render in detail pages');
    return null;
  }
  
  console.log('[PDF Debug] OpportunityDetailPages - opportunities count:', opportunities.length);
  
  // Helper function to determine the color based on score or rating
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981'; // Green for high scores
    if (score >= 60) return '#F59E0B'; // Amber for medium scores
    return '#EF4444'; // Red for low scores
  };
  
  const getImpactColor = (impact: string) => {
    if (impact === 'High') return '#10B981'; // Green
    if (impact === 'Medium') return '#F59E0B'; // Amber
    return '#EF4444'; // Red
  };
  
  const getComplexityColor = (complexity: string) => {
    if (complexity === 'Low') return '#10B981'; // Green
    if (complexity === 'Medium') return '#F59E0B'; // Amber
    return '#EF4444'; // Red
  };
  
  const getTimeframeColor = (timeframe: string) => {
    if (timeframe === 'Short-term') return '#10B981'; // Green
    if (timeframe === 'Medium-term') return '#F59E0B'; // Amber
    return '#EF4444'; // Red
  };
  
  // Create a page for each opportunity (skipping the first which is shown on the main opportunities page)
  return (
    <>
      {opportunities.slice(1).map((opportunity, index) => {
        const pageNumber = index + 4; // Start at page 4 (after Top Opportunities)
        
        console.log(`[PDF Debug] Processing opportunity ${index + 2} for detail page:`, {
          id: opportunity.id || 'no-id',
          title: opportunity.title?.slice(0, 30) || 'no-title',
          hasPainPointRelevances: !!opportunity.painPointRelevances,
          painPointRelevancesIsArray: Array.isArray(opportunity.painPointRelevances),
          painPointRelevancesCount: Array.isArray(opportunity.painPointRelevances) ? opportunity.painPointRelevances.length : 0
        });
        
        // Ensure all opportunity properties are valid strings/numbers
        const title = typeof opportunity.title === 'string' ? opportunity.title : '';
        const description = typeof opportunity.description === 'string' ? opportunity.description : '';
        const category = typeof opportunity.category === 'string' ? opportunity.category : '';
        const impact = typeof opportunity.impact === 'string' ? opportunity.impact : 'Medium';
        const complexity = typeof opportunity.complexity === 'string' ? opportunity.complexity : 'Medium';
        const timeframe = typeof opportunity.timeframe === 'string' ? opportunity.timeframe : 'Medium-term';
        
        // Safe number handling
        const combinedScore = typeof opportunity.combinedScore === 'number' ? opportunity.combinedScore : 0;
        const validationScore = typeof opportunity.validationScore === 'number' ? opportunity.validationScore : 0;
        const feasibilityScore = typeof opportunity.feasibilityScore === 'number' ? opportunity.feasibilityScore : 0;
        
        // Ensure arrays are valid
        const painPointRelevances = Array.isArray(opportunity.painPointRelevances) ? opportunity.painPointRelevances : [];
        const keyBenefits = Array.isArray(opportunity.keyBenefits) ? opportunity.keyBenefits : [];
        const implementationSteps = Array.isArray(opportunity.implementationSteps) ? opportunity.implementationSteps : [];
        const technicalChallenges = Array.isArray(opportunity.technicalChallenges) ? opportunity.technicalChallenges : [];
        const mitigationStrategies = Array.isArray(opportunity.mitigationStrategies) ? opportunity.mitigationStrategies : [];
        const riskFactors = Array.isArray(opportunity.riskFactors) ? opportunity.riskFactors : [];
        const resourceRequirements = Array.isArray(opportunity.resourceRequirements) ? opportunity.resourceRequirements : [];
        
        return (
          <PageContainer key={index} pageNumber={pageNumber} title={null}>
            {/* Header with opportunity title and category */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <Text style={{ ...styles.sectionTitle, flex: 1 }}>
                {title}
              </Text>
              {category && (
                <View style={{ 
                  backgroundColor: '#E2E8F0', 
                  borderRadius: 15, 
                  paddingVertical: 4, 
                  paddingHorizontal: 12 
                }}>
                  <Text style={{ fontSize: 12, color: '#4A5568' }}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Strategic Assessment Section */}
            <PaginatedSection title="Strategic Assessment" showContinuationText={false}>
              <View style={{ 
                backgroundColor: '#F8FAFC', 
                borderRadius: 8, 
                padding: 15, 
                marginBottom: 15,
                borderWidth: 1,
                borderColor: '#E2E8F0'
              }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
                  {/* Impact Score */}
                  <View style={{ width: '33%', marginBottom: 10 }}>
                    <Text style={{ fontSize: 10, color: '#64748B', marginBottom: 4 }}>IMPACT</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ 
                        width: 10, 
                        height: 10, 
                        borderRadius: 5, 
                        backgroundColor: getImpactColor(impact),
                        marginRight: 5
                      }} />
                      <Text style={{ 
                        fontSize: 12, 
                        color: getImpactColor(impact),
                        fontWeight: 'bold'
                      }}>
                        {impact}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Complexity Score */}
                  <View style={{ width: '33%', marginBottom: 10 }}>
                    <Text style={{ fontSize: 10, color: '#64748B', marginBottom: 4 }}>COMPLEXITY</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ 
                        width: 10, 
                        height: 10, 
                        borderRadius: 5, 
                        backgroundColor: getComplexityColor(complexity),
                        marginRight: 5
                      }} />
                      <Text style={{ 
                        fontSize: 12, 
                        color: getComplexityColor(complexity),
                        fontWeight: 'bold'
                      }}>
                        {complexity}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Timeframe Score */}
                  <View style={{ width: '33%', marginBottom: 10 }}>
                    <Text style={{ fontSize: 10, color: '#64748B', marginBottom: 4 }}>TIMEFRAME</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ 
                        width: 10, 
                        height: 10, 
                        borderRadius: 5, 
                        backgroundColor: getTimeframeColor(timeframe),
                        marginRight: 5
                      }} />
                      <Text style={{ 
                        fontSize: 12, 
                        color: getTimeframeColor(timeframe),
                        fontWeight: 'bold'
                      }}>
                        {timeframe}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Combined Score */}
                  {combinedScore > 0 && (
                    <View style={{ width: '33%', marginBottom: 10 }}>
                      <Text style={{ fontSize: 10, color: '#64748B', marginBottom: 4 }}>COMBINED SCORE</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ 
                          width: 10, 
                          height: 10, 
                          borderRadius: 5, 
                          backgroundColor: getScoreColor(combinedScore),
                          marginRight: 5
                        }} />
                        <Text style={{ 
                          fontSize: 12, 
                          color: getScoreColor(combinedScore),
                          fontWeight: 'bold'
                        }}>
                          {Math.round(combinedScore)}%
                        </Text>
                      </View>
                    </View>
                  )}
                  
                  {/* Validation Score */}
                  {validationScore > 0 && (
                    <View style={{ width: '33%', marginBottom: 10 }}>
                      <Text style={{ fontSize: 10, color: '#64748B', marginBottom: 4 }}>VALIDATION</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ 
                          width: 10, 
                          height: 10, 
                          borderRadius: 5, 
                          backgroundColor: getScoreColor(validationScore),
                          marginRight: 5
                        }} />
                        <Text style={{ 
                          fontSize: 12, 
                          color: getScoreColor(validationScore),
                          fontWeight: 'bold'
                        }}>
                          {Math.round(validationScore)}%
                        </Text>
                      </View>
                    </View>
                  )}
                  
                  {/* Feasibility Score */}
                  {feasibilityScore > 0 && (
                    <View style={{ width: '33%', marginBottom: 10 }}>
                      <Text style={{ fontSize: 10, color: '#64748B', marginBottom: 4 }}>FEASIBILITY</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ 
                          width: 10, 
                          height: 10, 
                          borderRadius: 5, 
                          backgroundColor: getScoreColor(feasibilityScore),
                          marginRight: 5
                        }} />
                        <Text style={{ 
                          fontSize: 12, 
                          color: getScoreColor(feasibilityScore),
                          fontWeight: 'bold'
                        }}>
                          {Math.round(feasibilityScore)}%
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
              
              {/* Description */}
              <View style={{ marginBottom: 15 }}>
                <Text style={{ fontSize: 12, lineHeight: 1.5 }}>{description}</Text>
              </View>
            </PaginatedSection>
            
            {/* Benefits Section */}
            {keyBenefits.length > 0 && (
              <PaginatedSection title="Key Benefits" showContinuationText={false}>
                <View style={{ marginLeft: 10 }}>
                  {keyBenefits.map((benefit, i) => (
                    <View key={i} style={{ flexDirection: 'row', marginBottom: 5 }}>
                      <Text style={{ fontSize: 12, marginRight: 8 }}>•</Text>
                      <Text style={{ fontSize: 12, flex: 1 }}>{benefit}</Text>
                    </View>
                  ))}
                </View>
              </PaginatedSection>
            )}
            
            {/* Implementation Steps */}
            {implementationSteps.length > 0 && (
              <PaginatedSection title="Implementation Steps" showContinuationText={implementationSteps.length > 3}>
                <View style={{ marginLeft: 10 }}>
                  {implementationSteps.map((step, i) => (
                    <KeepTogether key={i}>
                      <View style={{ marginBottom: 10 }}>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 3 }}>{i + 1}. {step.split(':')[0]}</Text>
                        {step.includes(':') && (
                          <Text style={{ fontSize: 12, marginLeft: 15 }}>{step.split(':')[1]}</Text>
                        )}
                      </View>
                    </KeepTogether>
                  ))}
                </View>
              </PaginatedSection>
            )}
            
            {/* Other sections can be added similarly... */}
          </PageContainer>
        );
      })}
    </>
  );
};

// Define NextSteps component
const NextStepsActionPlan = ({ companyData }: { companyData: CompanyData }) => (
  <PageContainer pageNumber={companyData.aiOpportunities.length + 3} title="Next Steps & Action Plan">
    <PaginatedSection title="Overview" showContinuationText={false}>
      <Text style={styles.text}>
        Based on our analysis of your business needs and the identified AI opportunities, 
        we recommend the following action plan to begin your AI transformation journey.
      </Text>
    </PaginatedSection>
    
    <PaginatedSection title="Recommended Approach" showContinuationText={false}>
      <Text style={styles.text}>{companyData.recommendedApproach}</Text>
    </PaginatedSection>
    
    <PaginatedSection title="Next Steps" showContinuationText={companyData.nextSteps?.length > 3}>
      <View style={styles.numberedList}>
        {companyData.nextSteps && companyData.nextSteps.map((step: string, index: number) => (
          <KeepTogether key={index}>
            <View style={styles.numberedItem}>
              <Text style={styles.number}>{index + 1}.</Text>
              <Text style={styles.bulletText}>{step}</Text>
            </View>
          </KeepTogether>
        ))}
      </View>
    </PaginatedSection>
    
    <PaginatedSection title="Timeline" showContinuationText={false}>
      <View style={styles.calloutBox}>
        <Text style={styles.calloutText}>
          We recommend a phased approach to implementation, starting with high-impact, 
          low-complexity opportunities to achieve quick wins and build momentum.
        </Text>
      </View>
      
      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <Text style={styles.subsectionTitle}>Phase 1: Foundation (3 Months)</Text>
          <View style={styles.bulletPoint}>
            <View style={styles.bullet} />
            <Text style={styles.bulletText}>Assessment and planning</Text>
          </View>
          <View style={styles.bulletPoint}>
            <View style={styles.bullet} />
            <Text style={styles.bulletText}>Initial data infrastructure setup</Text>
          </View>
        </View>
        <View style={styles.column}>
          <Text style={styles.subsectionTitle}>Phase 2: Implementation (6 Months)</Text>
          <View style={styles.bulletPoint}>
            <View style={styles.bullet} />
            <Text style={styles.bulletText}>Deploy first AI solutions</Text>
          </View>
          <View style={styles.bulletPoint}>
            <View style={styles.bullet} />
            <Text style={styles.bulletText}>Train teams and iterate</Text>
          </View>
        </View>
      </View>
    </PaginatedSection>
  </PageContainer>
);

// Define WhyHawkenAI component
const WhyHawkenAI = () => (
  <PageContainer pageNumber={7} title="Why HawkenAI?">
    <PaginatedSection title="Our Advantage" showContinuationText={false}>
      <Text style={styles.text}>
        Partnering with HawkenAI for your AI transformation journey offers several unique advantages.
      </Text>
      
      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <Text style={styles.subsectionTitle}>Industry Expertise</Text>
          <View style={styles.bulletPoint}>
            <View style={styles.bullet} />
            <Text style={styles.bulletText}>Specialized knowledge across multiple industries</Text>
          </View>
          <View style={styles.bulletPoint}>
            <View style={styles.bullet} />
            <Text style={styles.bulletText}>Deep understanding of industry-specific challenges</Text>
          </View>
          
          <Text style={{...styles.subsectionTitle, marginTop: 20}}>End-to-End Implementation</Text>
          <View style={styles.bulletPoint}>
            <View style={styles.bullet} />
            <Text style={styles.bulletText}>From strategy to deployment and beyond</Text>
          </View>
          <View style={styles.bulletPoint}>
            <View style={styles.bullet} />
            <Text style={styles.bulletText}>Seamless integration with existing systems</Text>
          </View>
        </View>
        <View style={styles.column}>
          <Text style={styles.subsectionTitle}>Proven Methodology</Text>
          <View style={styles.bulletPoint}>
            <View style={styles.bullet} />
            <Text style={styles.bulletText}>Data-driven approach to AI implementation</Text>
          </View>
          <View style={styles.bulletPoint}>
            <View style={styles.bullet} />
            <Text style={styles.bulletText}>Rigorous validation and testing processes</Text>
          </View>
          
          <Text style={{...styles.subsectionTitle, marginTop: 20}}>Ongoing Support</Text>
          <View style={styles.bulletPoint}>
            <View style={styles.bullet} />
            <Text style={styles.bulletText}>Continuous optimization of AI solutions</Text>
          </View>
          <View style={styles.bulletPoint}>
            <View style={styles.bullet} />
            <Text style={styles.bulletText}>Training and knowledge transfer to your team</Text>
          </View>
        </View>
      </View>
    </PaginatedSection>
      
    <PaginatedSection title="Our Commitment" showContinuationText={false}>
      <View style={styles.calloutBox}>
        <Text style={styles.calloutText}>
          Let's work together to leverage the power of AI and transform your business for the future.
        </Text>
      </View>
      
      <Text style={styles.text}>
        With HawkenAI as your partner, you'll benefit from our cutting-edge AI expertise and practical business
        experience. Our team will work alongside yours to ensure a successful transformation that delivers
        measurable results and positions your company for long-term success in an increasingly AI-driven world.
      </Text>
      
      <View style={styles.contactInfo}>
        <Text style={styles.contactTitle}>Ready to get started?</Text>
        <Text style={styles.contactText}>Contact us at info@hawkenai.com or visit www.hawkenai.com</Text>
      </View>
    </PaginatedSection>
  </PageContainer>
);

// Add the BusinessLetter component
const BusinessLetter = ({ 
  companyData, 
  industryInsights,
  businessChallenges
}: DashboardPDFProps) => {
  // Format date as Month DD, YYYY
  const today = new Date();
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const formattedDate = `${months[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`;
  
  // Extract information for the letter
  const industry = companyData.industry || "your industry";
  const businessContext = companyData.businessContext || "";
  const businessChallengesList = Array.isArray(businessChallenges) 
    ? businessChallenges.map(c => {
        if (typeof c === 'string') return c;
        // Handle different possible structures
        return c.description || c.name || '';
      }) 
    : [];
  const strategies = companyData.aiOpportunities || [];
  
  // Extract up to 3 key business challenges
  const keyBusinessChallenges = businessChallengesList
    .slice(0, 3)
    .map(challenge => challenge.trim())
    .filter(challenge => challenge);
  
  // Helper function for formatting challenges
  const formatChallenges = (challenges: string[]) => {
    if (!challenges || challenges.length === 0) return "address your strategic objectives";
    if (challenges.length === 1) return challenges[0];
    
    // Format list with oxford comma for more than 2 items
    if (challenges.length > 2) {
      const lastItem = challenges[challenges.length - 1];
      const precedingItems = challenges.slice(0, -1).join(", ");
      return `${precedingItems}, and ${lastItem}`;
    }
    
    // Just two items
    return `${challenges[0]} and ${challenges[1]}`;
  };
  
  const challengesText = formatChallenges(keyBusinessChallenges);
  
  // Get top 2 high-impact strategies for personalization
  const highImpactStrategies = strategies
    .filter((s: AIOpportunity) => s.impact === "High")
    .sort((a: AIOpportunity, b: AIOpportunity) => (b.combinedScore || 0) - (a.combinedScore || 0))
    .slice(0, 2);
  
  // Generate the first paragraph - introduction
  const getIntroductionParagraph = () => {
    return `Thank you for considering HawkenAI as your partner in your AI journey. We are excited about the opportunity to help ${companyData.companyName} implement transformative AI solutions that could deliver significant business impact and competitive advantage in the ${industry} sector.`;
  };
  
  // Generate the second paragraph - value proposition
  const getValuePropositionParagraph = () => {
    return `Our team is uniquely positioned to assist you in creating an AI-powered solution that will reclaim valuable time, streamline operations, and enable comprehensive business transformation. By leveraging large language models and other AI capabilities, we can help you solve complex problems, enhance decision-making processes, and unlock new opportunities for growth and innovation.`;
  };
  
  // Generate the third paragraph - expertise
  const getExpertiseParagraph = () => {
    return `We specialize in innovative AI software that delivers significant, measurable results. Our solutions are designed to integrate seamlessly with your existing systems and processes, minimizing disruption while maximizing impact. With our expertise in a full-service AI consultancy, we can provide tailored recommendations that address your most pressing needs.`;
  };
  
  // Generate the closing paragraph - next steps
  const getClosingParagraph = () => {
    return `Please find below our detailed proposal outlining our understanding of your needs, our proposed approach, and how we can help you achieve your objectives. The solution will naturally evolve with your feedback and based on conversations with your team.`;
  };
  
  // HawkenAI signature info
  const signatureInfo = {
    name: "John Bohlmann",
    title: "Founder & CEO, HawkenAI",
    contact: "(949) 209-9708 | john@hawken.ai"
  };
  
  return (
    <Page size="A4" style={businessLetterStyles.page}>
      <View style={businessLetterStyles.header}>
        <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 10 }}>
          {companyData.companyName}'s AI Transformation Plan
        </Text>
        <Text style={businessLetterStyles.date}>{formattedDate}</Text>
      </View>
      
      <Text style={businessLetterStyles.greeting}>Dear {companyData.companyName} Leadership Team,</Text>
      
      <Text style={businessLetterStyles.paragraph}>
        {getIntroductionParagraph()}
      </Text>
      
      <Text style={businessLetterStyles.paragraph}>
        {getValuePropositionParagraph()}
      </Text>
      
      <Text style={businessLetterStyles.paragraph}>
        {getExpertiseParagraph()}
      </Text>
      
      <Text style={businessLetterStyles.paragraph}>
        {getClosingParagraph()}
      </Text>
      
      <Text style={businessLetterStyles.paragraph}>Sincerely,</Text>
      
      {/* Add signature info */}
      <Text style={businessLetterStyles.name}>{signatureInfo.name}</Text>
      <Text style={businessLetterStyles.title}>{signatureInfo.title}</Text>
      <Text style={businessLetterStyles.contact}>{signatureInfo.contact}</Text>
    </Page>
  );
};

// New component to handle PDF data and rendering
export const PreloadedPDF = ({ 
  companyData, 
  industryInsights, 
  businessChallenges,
  pdfOptions = { useCache: true } 
}: DashboardPDFProps) => {
  console.log(`[PDF] PreloadedPDF component initializing for ${companyData.companyName}`);
  
  // Use our consolidated data hook to fetch and process all data
  const {
    isLoading,
    error
  } = usePDFData(
    companyData,
    businessChallenges,
    industryInsights,
    pdfOptions
  );
  
  // Show loading indicator while data is being fetched
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">Preparing Your PDF</h2>
        <p className="text-gray-600">Loading comprehensive data for {companyData.companyName}...</p>
      </div>
    );
  }
  
  // Show error if data fetching failed
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p><strong>Error:</strong> {error.message}</p>
        </div>
        <p>The PDF will be shown with limited personalization.</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  // When data is ready, render the actual PDF with proper pagination
  return (
    <PDFViewer style={{ width: '100%', height: '100vh' }}>
      <Document>
        <BusinessLetter 
          companyData={companyData} 
          industryInsights={industryInsights} 
          businessChallenges={businessChallenges}
        />
        <CoverLetter companyData={companyData} />
        <TableOfContents />
        
        <ExecutiveSummary 
          companyData={companyData} 
          businessChallenges={businessChallenges} 
          pdfOptions={pdfOptions}
          preloadedData={null}
          industryInsights={industryInsights}
        />
        
        <TopOpportunities 
          companyData={companyData} 
          businessChallenges={businessChallenges} 
          pdfOptions={pdfOptions} 
        />
        
        <OpportunityDetailPages opportunities={companyData.aiOpportunities} />
        
        <NextStepsActionPlan companyData={companyData} />
        <WhyHawkenAI />
      </Document>
    </PDFViewer>
  );
};

export const DashboardPDF = ({ 
  companyData, 
  industryInsights, 
  businessChallenges,
  pdfOptions = { useCache: true } 
}: DashboardPDFProps) => {
  console.log('[PDF] DashboardPDF component rendering initiated', {
    company: companyData?.companyName,
    industry: companyData?.industry,
    challengesCount: businessChallenges?.length || 0,
    useCache: pdfOptions?.useCache
  });

  if (!companyData) {
    console.warn('[PDF] Company data is not available, cannot render PDF');
    return <Text>Company data is not available.</Text>; // Handle case where companyData is null
  }
  
  // Use the PreloadedPDF component instead of rendering directly
  return (
    <PreloadedPDF 
      companyData={companyData}
      industryInsights={industryInsights}
      businessChallenges={businessChallenges}
      pdfOptions={pdfOptions}
    />
  );
}

/**
 * Reusable page container component that ensures consistent styling across all pages
 * Used for pagination and content overflow management
 */
const PageContainer = ({ 
  children, 
  pageNumber, 
  title = null,
  showHeader = true
}: { 
  children: React.ReactNode, 
  pageNumber: number,
  title?: string | null,
  showHeader?: boolean
}) => {
  return (
    <Page size="A4" style={styles.page}>
      {/* Background image */}
      <View style={styles.backgroundContainer} fixed>
        <Image src="/images/subsection.png" style={styles.backgroundImageStyle} />
      </View>
      
      {/* Content container with consistent padding */}
      <View style={chapterStyles.textContainer}>
        {/* Conditional section title - only shown on first page or when explicitly requested */}
        {showHeader && title && (
          <Text style={chapterStyles.title}>{title}</Text>
        )}
        
        {/* Main content */}
        <View style={{ width: '100%' }}>
          {children}
        </View>
      </View>
      
      {/* Consistent footer on every page */}
      <FooterWithPageNumber pageNumber={pageNumber} fixed />
    </Page>
  );
};

/**
 * A paginated section component that properly handles content overflow
 * across multiple pages while maintaining consistent styling
 * 
 * @param title - Section title displayed at the top
 * @param children - Content to display in the section
 * @param avoidBreak - When true, prevent page breaks within this section
 * @param showContinuationText - When true, shows "(Continued on next page...)" only when necessary
 */
const PaginatedSection = ({ 
  title, 
  children, 
  avoidBreak = false,
  showContinuationText = false
}: {
  title: string,
  children: React.ReactNode,
  avoidBreak?: boolean,
  showContinuationText?: boolean
}) => {
  return (
    <View 
      style={styles.sectionContainer} 
      wrap={!avoidBreak} 
      break={avoidBreak ? false : undefined}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
      
      {/* 
        Only render the continuation text if specifically requested
      */}
      {showContinuationText && (
        <Text
          style={styles.continuedSection}
          render={({ pageNumber, totalPages, subPageNumber, subPageTotalPages }) => {
            // Only show continuation text if:
            // 1. This section spans multiple pages AND
            // 2. We're not on the last subpage of this section AND
            // 3. We're not at the end of the document
            return (subPageTotalPages > 1 && 
                  subPageNumber < subPageTotalPages && 
                  pageNumber < totalPages) 
              ? '(continued...)' 
              : '';
          }}
        />
      )}
    </View>
  );
};

/**
 * A component that prevents page breaks within its content
 * Useful for keeping related content together on the same page
 */
const KeepTogether = ({ 
  children 
}: {
  children: React.ReactNode
}) => {
  return (
    <View wrap={false} style={{ display: 'flex', marginBottom: 4 }}>
      {children}
    </View>
  );
}; 