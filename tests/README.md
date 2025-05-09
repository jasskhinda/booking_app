# End-to-End Testing

This directory contains end-to-end tests for the Compassionate Rides booking application using Playwright.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

3. Configure test environment:
   - Create a test user in your Supabase database or use an existing one
   - Update the credentials in `tests/e2e/.env.test`

## Running Tests

Run all tests:
```bash
npm test
```

Run tests with UI:
```bash
npm run test:ui
```

Run a specific test file:
```bash
npx playwright test tests/e2e/login.spec.js
```

## Test Structure

- `tests/e2e/` - Contains all E2E test files
- `tests/e2e/login.spec.js` - Authentication tests
- `tests/e2e/.env.test` - Test environment variables
- `tests/e2e/setup.js` - Global setup for creating test users

## Adding New Tests

1. Create a new test file in `tests/e2e/` directory
2. Import required Playwright modules:
   ```javascript
   const { test, expect } = require('@playwright/test');
   ```
3. Write your tests using the Playwright API
4. Follow the existing patterns for consistent test structure

## Best Practices

- Keep tests independent of each other
- Use environment variables for sensitive data
- Test critical user flows first (login, booking, etc.)
- Add descriptive test names to make failures clear
- Use page objects for complex pages to improve maintainability