import { chromium } from 'playwright';

export interface ScrapedData {
  pageContent: string;
  title: string;
  metaDescription: string;
  links: string[];
  images: string[];
  products: string[];
  services: string[];
  aboutText: string;
  teamInfo: string[];
}

export async function scrapeCompanyWebsite(url: string): Promise<ScrapedData> {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Extract basic page info
    const pageContent = await page.content();
    const title = await page.title();
    const metaDescription = await page.$eval('meta[name="description"]', 
      (el) => el.getAttribute('content') || '', { timeout: 1000 }).catch(() => '');

    // Extract links
    const links = await page.$$eval('a', (links) => 
      links.map(link => link.href).filter(href => href && !href.startsWith('javascript:')));

    // Extract images
    const images = await page.$$eval('img', (imgs) => 
      imgs.map(img => img.src).filter(src => src && src.length > 0));

    // Look for about page content
    let aboutText = '';
    for (const link of links) {
      if (link.toLowerCase().includes('about')) {
        const aboutPage = await context.newPage();
        await aboutPage.goto(link, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
        aboutText = await aboutPage.$$eval('p', (paragraphs) => paragraphs.map(p => p.textContent).join(' ')).catch(() => '');
        await aboutPage.close();
        break;
      }
    }

    // Extract potential product/service information
    const products = await page.$$eval('.product, [class*="product"], [id*="product"]', 
      (els) => els.map(el => el.textContent?.trim()).filter(Boolean) as string[]).catch(() => []);
    
    const services = await page.$$eval('.service, [class*="service"], [id*="service"]', 
      (els) => els.map(el => el.textContent?.trim()).filter(Boolean) as string[]).catch(() => []);

    // Look for team info
    const teamInfo = await page.$$eval('.team, [class*="team"], [id*="team"]', 
      (els) => els.map(el => el.textContent?.trim()).filter(Boolean) as string[]).catch(() => []);

    return {
      pageContent,
      title,
      metaDescription,
      links,
      images,
      products,
      services,
      aboutText,
      teamInfo
    };
  } finally {
    await browser.close();
  }
} 