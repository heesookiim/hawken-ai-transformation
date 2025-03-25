/**
 * Renders the proposal HTML template with the provided data
 * @param proposalData The proposal data to include in the template
 * @param imagePaths Paths to any generated images to include
 * @returns HTML content as a string
 */
export function renderProposalTemplate(proposalData, imagePaths) {
    // Format date - Mar 2025 format as shown in the image
    const date = new Date();
    const formattedDate = `Mar 2025`; // Hardcoded to match the image exactly
    // Get the name of the person from the proposalData or default to the one in the image
    const personName = "Heesoo Kim"; // Hardcoded to match the image
    // Contact information from the last page image
    const email = "heesoo@hawkenio.com";
    const website = "www.hawkenio.com";
    const phone = "phone: +00 123 456 789";
    // Generate HTML for the cover page
    const coverPage = `
    <div class="cover-page">
      <div class="logo-container">
        <svg class="logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="40" fill="#D8B4FE" stroke="#6D28D9" stroke-width="2" />
          <path d="M30,50 L45,35 L55,45 L70,30" stroke="#6D28D9" stroke-width="3" fill="none" />
          <circle cx="45" cy="35" r="3" fill="#6D28D9" />
          <circle cx="55" cy="45" r="3" fill="#6D28D9" />
          <circle cx="70" cy="30" r="3" fill="#6D28D9" />
          <path d="M30,40 L70,40 M30,50 L70,50 M30,60 L70,60" stroke="#6D28D9" stroke-width="1" opacity="0.5" />
        </svg>
        <h1 class="company-name">HawkenIO</h1>
      </div>
      
      <div class="title-container">
        <h1 class="main-title">AI Strategy</h1>
        <h1 class="main-title">Proposal</h1>
      </div>
      
      <div class="footer">
        <div class="date">${formattedDate}</div>
        <div class="author">${personName}</div>
      </div>
    </div>
  `;
    // Generate HTML for the back page
    const backPage = `
    <div class="back-page">
      <div class="back-logo-container">
        <svg class="logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="40" fill="#D8B4FE" stroke="#6D28D9" stroke-width="2" />
          <path d="M30,50 L45,35 L55,45 L70,30" stroke="#6D28D9" stroke-width="3" fill="none" />
          <circle cx="45" cy="35" r="3" fill="#6D28D9" />
          <circle cx="55" cy="45" r="3" fill="#6D28D9" />
          <circle cx="70" cy="30" r="3" fill="#6D28D9" />
          <path d="M30,40 L70,40 M30,50 L70,50 M30,60 L70,60" stroke="#6D28D9" stroke-width="1" opacity="0.5" />
        </svg>
        <h1 class="company-name">HawkenIO</h1>
      </div>
      
      <div class="contact-info">
        <p>${email}</p>
        <p>${website}</p>
        <p>${phone}</p>
      </div>
    </div>
  `;
    // Generate HTML for the content pages (would have actual content from proposalData)
    let contentPages = '';
    // Add minimal content pages from proposalData
    contentPages += `
    <div class="content-page">
      <h1>AI Strategy for ${proposalData.companyName}</h1>
      <h2>Executive Summary</h2>
      <p>This proposal outlines a strategic approach to implementing AI solutions at ${proposalData.companyName}.</p>
      
      <h2>Opportunities</h2>
      <ul>
        ${proposalData.aiOpportunities.map(opp => `
          <li>
            <h3>${opp.title}</h3>
            <p>${opp.description}</p>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
    // Combine all pages and add styles
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>AI Strategy Proposal for ${proposalData.companyName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
        
        body {
          font-family: 'Inter', sans-serif;
          margin: 0;
          padding: 0;
          color: #333;
        }
        
        /* Page styling */
        .cover-page, .back-page, .content-page {
          position: relative;
          width: 100%;
          height: 1122px; /* A4 height in pixels at 96 DPI */
          page-break-after: always;
          overflow: hidden;
        }
        
        /* Cover and back page gradient background */
        .cover-page, .back-page {
          background: linear-gradient(135deg, #C084FC 0%, #818CF8 100%);
          color: #1E1B4B;
          display: flex;
          flex-direction: column;
        }
        
        /* Logo styling */
        .logo-container {
          display: flex;
          align-items: center;
          margin: 40px;
        }
        
        .back-logo-container {
          display: flex;
          align-items: center;
          margin: 40px;
          margin-top: auto;
        }
        
        .logo {
          width: 60px;
          height: 60px;
        }
        
        .company-name {
          font-size: 36px;
          font-weight: bold;
          margin-left: 16px;
        }
        
        /* Title container for cover page */
        .title-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 0 80px;
        }
        
        .main-title {
          font-size: 72px;
          font-weight: bold;
          margin: 0;
          line-height: 1.2;
          color: #42275a;
        }
        
        /* Footer for cover page */
        .footer {
          display: flex;
          justify-content: space-between;
          padding: 40px 80px;
          font-size: 24px;
          font-weight: bold;
        }
        
        /* Back page styles */
        .back-page {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100%;
        }
        
        .contact-info {
          margin-left: auto;
          padding: 40px 80px;
          text-align: right;
          font-size: 18px;
        }
        
        .contact-info p {
          margin: 8px 0;
        }
        
        /* Content page styles */
        .content-page {
          padding: 60px;
          background-color: white;
        }
        
        .content-page h1 {
          color: #1E1B4B;
          font-size: 28px;
          margin-bottom: 30px;
        }
        
        .content-page h2 {
          color: #4338CA;
          font-size: 22px;
          margin-top: 30px;
          margin-bottom: 15px;
        }
        
        .content-page h3 {
          color: #6D28D9;
          font-size: 18px;
          margin-top: 20px;
          margin-bottom: 10px;
        }
        
        .content-page p {
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 10px;
        }
        
        .content-page ul {
          padding-left: 20px;
        }
        
        .content-page li {
          margin-bottom: 15px;
        }
      </style>
    </head>
    <body>
      ${coverPage}
      ${contentPages}
      ${backPage}
    </body>
    </html>
  `;
    return html;
}
