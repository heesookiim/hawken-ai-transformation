# AI Transformation Plan Generator UI

This is the UI component for the AI Transformation Plan Generator, built with Next.js and shadcn/ui.

## Features

- Modern, responsive UI built with Next.js and Tailwind CSS
- Interactive data visualization using Recharts
- Company analysis data dashboard
- AI strategy visualization and comparison
- Industry insights and business patterns display

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend server running (see main project README)

### Installation

1. Navigate to the UI directory and install dependencies:

```bash
cd ui
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The UI will be available at http://localhost:3000.

### Building for Production

Build the UI for production:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Usage

1. Enter the company name and URL on the homepage
2. If the company already has a generated analysis, you'll be taken directly to its dashboard
3. If no analysis exists, a new one will be generated (this may take several minutes)
4. Explore the generated AI strategies, industry insights, and business patterns
5. Use the interactive charts to analyze the proposed strategies

## Project Structure

- `/src/app/page.tsx` - Homepage with company input form
- `/src/app/dashboard/[company]/page.tsx` - Dashboard page for company analysis
- `/src/lib/api.ts` - API service for communication with the backend
- `/src/components/ui/` - UI components from shadcn

## Technology Stack

- Next.js 14
- React 19
- Tailwind CSS
- shadcn/ui components
- Recharts for data visualization
- Axios for API communication
