ai-transformation-proposal-generator/
├── client/                 # React frontend
├── server/                 # Express backend
│   ├── src/
│   │   ├── api/            # API routes
│   │   ├── ai/             # AI analysis modules
│   │   │   ├── analyzer.ts # Main AI analysis pipeline
│   │   │   ├── engines/    # Different analysis engines
│   │   │   └── models.ts   # AI model interfaces
│   │   ├── scraper/        # Web scraping functionality
│   │   ├── pdf/            # PDF generation
│   │   └── email/          # Email service
│   ├── package.json
│   └── tsconfig.json
├── shared/                 # Shared types and utilities
└── package.json 