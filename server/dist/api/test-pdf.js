import { Router } from 'express';
import { generatePDF } from '../pdf/generator';
import path from 'path';
import fs from 'fs';
const router = Router();
// Sample proposal data for testing
const sampleProposalData = {
    id: 'test-proposal-123',
    companyName: 'HawkenIO',
    companyUrl: 'https://www.hawkenio.com',
    industry: 'Technology',
    businessContext: 'AI-driven solutions for enterprise',
    aiOpportunities: [
        {
            id: 'opp-1',
            title: 'Smart Automation Platform',
            description: 'Implement an AI-powered workflow automation system to streamline operations.',
            impact: 'High',
            complexity: 'Medium',
            timeframe: '3-6 months',
            keyBenefits: ['Improved efficiency', 'Cost reduction', 'Enhanced accuracy'],
            implementationSteps: [
                'Conduct process audit',
                'Define automation scope',
                'Build MVP',
                'Pilot and refine',
                'Full deployment'
            ]
        },
        {
            id: 'opp-2',
            title: 'Predictive Analytics Dashboard',
            description: 'Create a predictive analytics platform to forecast market trends and business outcomes.',
            impact: 'High',
            complexity: 'High',
            timeframe: '6-9 months',
            keyBenefits: ['Better decision making', 'Competitive advantage', 'Risk reduction'],
            implementationSteps: [
                'Data sources assessment',
                'Model development',
                'Dashboard creation',
                'Integration with existing systems',
                'User training'
            ]
        }
    ],
    recommendedApproach: 'Start with quick wins while laying foundation for advanced features.',
    nextSteps: [
        'Stakeholder workshop',
        'Technical feasibility assessment',
        'Pilot project selection',
        'Resource allocation'
    ],
    imagePrompts: [
        'AI transformation roadmap diagram',
        'Strategic opportunity matrix showing impact vs complexity',
        'Implementation timeline with key milestones'
    ]
};
router.get('/sample-pdf', async (req, res) => {
    try {
        // Generate PDF with sample data
        console.log('Generating sample PDF');
        const pdfBuffer = await generatePDF(sampleProposalData);
        // Create a unique filename
        const tempDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        const filename = `sample-proposal-${Date.now()}.pdf`;
        const pdfPath = path.join(tempDir, filename);
        // Write PDF to file
        fs.writeFileSync(pdfPath, pdfBuffer);
        console.log(`PDF saved to ${pdfPath}`);
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="HawkenIO-AI-Strategy-Proposal.pdf"`);
        // Send PDF as response
        res.send(pdfBuffer);
    }
    catch (error) {
        console.error('Error generating sample PDF:', error);
        res.status(500).json({
            error: 'Failed to generate sample PDF',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
export default router;
