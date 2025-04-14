# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands
- Build: `npm run build` or `yarn build` (Next.js projects)
- Dev: `npm run dev` or `yarn dev` (Next.js projects)
- Start: `npm run start` or `yarn start` (for production builds)
- Lint: `npm run lint` or `yarn lint`

## Code Style Guidelines
- **JavaScript**: Modern ES6+ features, functional components for React
- **Formatting**: Consistent indentation with 2 spaces
- **Imports**: Group imports (1. React/Next, 2. External libraries, 3. Internal modules)
- **Naming**: camelCase for variables/functions, PascalCase for components/classes
- **Error Handling**: Use try/catch blocks with proper error logging
- **Component Structure**: Functional components with hooks, prefer composition
- **File Organization**: Group related files in directories
- **Path Aliases**: Use @/* as configured in jsconfig.json

## Best Practices
- Use TailwindCSS for styling
- Follow Next.js App Router conventions and best practices
- Keep components small and focused on a single responsibility

## database

Use Supabase for all database needs. You can use those credentials:

NEXT_PUBLIC_SUPABASE_URL=https://btzfgasugkycbavcwvnx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0emZnYXN1Z2t5Y2JhdmN3dm54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2MzcwOTIsImV4cCI6MjA2MDIxMzA5Mn0.FQtQXKvkBLVtmCqShLyg_y9EDPrufyWQnbD8EE25zSU

Assume you have access to two tables users and trips, and use any fields you deem necessary. Use Supabase auth for the login / signup, and the users table to store any additional fields for users