import dotenv from 'dotenv';
import { generateProposal } from '../ai/analyzer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
// Test companies to analyze
const testCompanies = [
    { name: 'Stripe', url: 'https://stripe.com', description: 'Payment processing platform for businesses' },
    { name: 'Notion', url: 'https://notion.so', description: 'All-in-one workspace for notes, tasks, wikis, and databases' },
    { name: 'Figma', url: 'https://figma.com', description: 'Collaborative interface design tool' }
];
async function runAnalysisTest() {
    // Create output directory
    const outputDir = path.join(__dirname, '../../test-results');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    for (const company of testCompanies) {
        console.log(`\n===== Testing Analysis for ${company.name} =====\n`);
        try {
            // Run the full analysis pipeline
            const startTime = Date.now();
            const proposalData = await generateProposal(company.url, company.name, company.description);
            const endTime = Date.now();
            // Log performance metrics
            console.log(`Analysis completed in ${(endTime - startTime) / 1000} seconds`);
            // Save the results to a JSON file
            const outputPath = path.join(outputDir, `${company.name.toLowerCase()}-analysis.json`);
            fs.writeFileSync(outputPath, JSON.stringify(proposalData, null, 2));
            console.log(`Analysis results saved to ${outputPath}`);
            // Log summary of results
            console.log('\nAnalysis Summary:');
            console.log(`Company: ${proposalData.companyName}`);
            console.log(`Industry: ${proposalData.industry}`);
            console.log(`Number of AI opportunities identified: ${proposalData.aiOpportunities.length}`);
            // Print titles and impact of opportunities
            console.log('\nAI Opportunities:');
            proposalData.aiOpportunities.forEach((opportunity, index) => {
                console.log(`${index + 1}. ${opportunity.title} - Impact: ${opportunity.impact}, Complexity: ${opportunity.complexity}`);
            });
        }
        catch (error) {
            console.error(`Error analyzing ${company.name}:`, error);
        }
    }
}
// Remove the require.main check since we're using ES modules
runAnalysisTest()
    .then(() => console.log('\nAnalysis tests completed'))
    .catch(err => console.error('Error in test process:', err));
export { runAnalysisTest };
