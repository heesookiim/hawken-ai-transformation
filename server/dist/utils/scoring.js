/**
 * Calculate strategy opportunity score based on multiple factors:
 * - Impact (30%)
 * - Complexity (15%)
 * - Timeframe (10%)
 * - Pain point relevance (15%)
 * - Business challenge relevance (20%)
 * - Quick win bonus (10% potential)
 *
 * @param strategy Strategy object containing required properties
 * @returns A score between 0-100
 */
export function calculateOpportunityScore(strategy) {
    // Impact scoring (highest weight)
    const impactScores = {
        'High': 100,
        'Medium': 60,
        'Low': 20
    };
    // Complexity scoring (inverse - lower complexity is better)
    const complexityScores = {
        'High': 20,
        'Medium': 60,
        'Low': 100
    };
    // Timeframe scoring (shorter timeframe is better)
    const timeframeScores = {
        'Short-term': 100,
        'Medium-term': 60,
        'Long-term': 20
    };
    // Calculate weighted score
    const impactScore = impactScores[strategy.impact] || 0;
    const complexityScore = complexityScores[strategy.complexity] || 0;
    const timeframeScore = timeframeScores[strategy.timeframe] || 0;
    // Calculate pain point relevance score (if available)
    let painPointRelevanceScore = 0;
    if (strategy.painPointRelevances && strategy.painPointRelevances.length > 0) {
        // Take the top 3 most relevant pain points
        const topRelevances = strategy.painPointRelevances.slice(0, 3);
        // Average their scores (0-10 scale) and convert to 0-100 scale
        painPointRelevanceScore = (topRelevances.reduce((sum, rel) => sum + rel.relevanceScore, 0) / topRelevances.length) * 10;
    }
    // Calculate business challenge relevance score (if available)
    let businessChallengeRelevanceScore = 0;
    if (strategy.businessChallengeRelevances && strategy.businessChallengeRelevances.length > 0) {
        // Take the top 3 most relevant business challenges
        const topRelevances = strategy.businessChallengeRelevances.slice(0, 3);
        // Average their scores (0-10 scale) and convert to 0-100 scale
        businessChallengeRelevanceScore = (topRelevances.reduce((sum, rel) => sum + rel.relevanceScore, 0) / topRelevances.length) * 10;
    }
    // Quick win bonus (high impact + low complexity + short timeframe)
    let quickWinBonus = 0;
    if (impactScore > 80 && complexityScore > 80 && timeframeScore > 80) {
        quickWinBonus = 10; // 10% bonus for true "quick wins"
    }
    // Weights: 30% impact, 15% complexity, 10% timeframe, 15% pain point relevance, 20% business challenge relevance, 10% quick win bonus
    return ((impactScore * 0.30) +
        (complexityScore * 0.15) +
        (timeframeScore * 0.10) +
        (painPointRelevanceScore * 0.15) +
        (businessChallengeRelevanceScore * 0.20) +
        quickWinBonus);
}
/**
 * Calculate a combined score that considers both feasibility and opportunity
 * - 60% weight on feasibility
 * - 40% weight on opportunity score (which includes pain point relevance)
 *
 * @param strategy Strategy object containing required properties
 * @returns A score between 0-100
 */
export function calculateCombinedScore(strategy) {
    const opportunityScore = calculateOpportunityScore(strategy);
    const feasibilityScore = strategy.feasibilityScore || 0;
    // Combined score weighs feasibility (60%) and opportunity (40%)
    return (feasibilityScore * 0.6) + (opportunityScore * 0.4);
}
