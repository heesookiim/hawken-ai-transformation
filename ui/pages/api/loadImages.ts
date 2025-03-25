import fs from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const introImagePath = path.join(process.cwd(), 'src/components/PDF/base64Images', 'introImage.txt');
  const sectionImagePath = path.join(process.cwd(), 'src/components/PDF/base64Images', 'sectionImage.txt');
  const subsectionImagePath = path.join(process.cwd(), 'src/components/PDF/base64Images', 'subsectionImage.txt');

  try {
    const introImage = await fs.promises.readFile(introImagePath, 'utf-8');
    const sectionImage = await fs.promises.readFile(sectionImagePath, 'utf-8');
    const subsectionImage = await fs.promises.readFile(subsectionImagePath, 'utf-8');

    res.status(200).json({
      introImage: introImage.trim(),
      sectionImage: sectionImage.trim(),
      subsectionImage: subsectionImage.trim(),
    });
  } catch (error) {
    console.error('Error loading images:', error);
    res.status(500).json({ error: 'Failed to load images' });
  }
} 