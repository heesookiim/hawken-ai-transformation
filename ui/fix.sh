#!/bin/bash
cat > src/app/dashboard/\[company\]/page.tsx << "EOF"
"use client";
export default function Dashboard() { return <div>Test</div>; }
EOF
