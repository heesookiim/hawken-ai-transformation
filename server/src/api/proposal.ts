import { Router } from 'express';
import { generateProposal } from '../ai/analyzer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.post('/generate', async (req, res) => {
  try {
    const { companyUrl, companyName } = req.body;
    
    if (!companyUrl || !companyName) {
      return res.status(400).json({ error: 'Company URL and name are required' });
    }

    // Generate the proposal content
    console.log(`API: Generating proposal for ${companyName} (${companyUrl})`);
    const proposalData = await generateProposal(companyUrl, companyName);
    
    // Save the results to a JSON file
    const resultsDir = path.join(__dirname, '../../test-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    const filename = `${companyName.toLowerCase().replace(/\s+/g, '-')}-analysis.json`;
    fs.writeFileSync(
      path.join(resultsDir, filename), 
      JSON.stringify(proposalData, null, 2)
    );
    
    console.log(`API: Proposal saved to ${filename}`);
    
    // Return the data to the client
    res.status(200).json(proposalData);
  } catch (error) {
    console.error('Error generating proposal:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to generate proposal',
      message: errorMessage
    });
  }
});

// Add a new endpoint to retrieve saved analysis data
router.get('/analysis/:company', (req, res) => {
  try {
    const company = req.params.company;
    const resultsDir = path.join(__dirname, '../../test-results');
    const filePath = path.join(resultsDir, `${company}-analysis.json`);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Analysis not found for the specified company' });
    }
    
    const data = fs.readFileSync(filePath, 'utf8');
    res.status(200).json(JSON.parse(data));
  } catch (error) {
    console.error('Error retrieving analysis:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Failed to retrieve analysis',
      message: errorMessage
    });
  }
});

export default router; 