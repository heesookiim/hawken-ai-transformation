import puppeteer from 'puppeteer';
import { renderProposalTemplate } from './template';
import path from 'path';
import fs from 'fs';
import { generateImages } from './images';
export async function generatePDF(proposalData) {
    // 1. Generate images for the proposal
    const imagePaths = await generateImages(proposalData.imagePrompts, proposalData.id);
    // 2. Render the HTML template with data and images
    const htmlContent = renderProposalTemplate(proposalData, imagePaths);
    // 3. Write HTML to a temporary file
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    const htmlPath = path.join(tempDir, `${proposalData.id}.html`);
    fs.writeFileSync(htmlPath, htmlContent);
    // 4. Use Puppeteer to convert HTML to PDF
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
            top: '20mm',
            right: '20mm',
            bottom: '20mm',
            left: '20mm'
        }
    });
    await browser.close();
    // 5. Clean up temporary files
    try {
        fs.unlinkSync(htmlPath);
        imagePaths.forEach(imagePath => {
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        });
    }
    catch (error) {
        console.error('Error cleaning up temporary files:', error);
    }
    return pdfBuffer;
}
