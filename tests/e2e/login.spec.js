// @ts-check
const { test, expect } = require('@playwright/test');
const dotenv = require('dotenv');
const path = require('path');

// Load test environment variables
dotenv.config({ path: path.join(__dirname, '.env.test') });

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page before each test
    await page.goto('/login');
  });

  test('Login page should load correctly', async ({ page }) => {
    // Verify login page elements are visible
    await expect(page.locator('h1')).toContainText('Sign in to your account');
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Should show error with invalid credentials', async ({ page }) => {
    // Try logging in with invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Wait for the error message to appear
    await expect(page.locator('.text-red-600')).toBeVisible();
    await expect(page.locator('.text-red-600')).toContainText('Invalid email or password');
  });

  test('Should login successfully with valid credentials', async ({ page }) => {
    // Use test credentials from environment variables
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;
    
    if (!testEmail || !testPassword) {
      throw new Error('Test credentials not found in environment variables');
    }
    
    // Fill login form with test credentials
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    
    // Submit form and wait for navigation
    await page.click('button[type="submit"]');
    
    // Wait for redirection to dashboard page
    await page.waitForURL('/dashboard');
    
    // Verify we're on the dashboard page
    await expect(page.url()).toContain('/dashboard');
  });

  test('Should navigate to signup page', async ({ page }) => {
    // Click on the "create an account" link
    await page.click('text=create an account');
    
    // Wait for navigation to signup page
    await page.waitForURL('/signup');
    
    // Verify we're on the signup page
    await expect(page.url()).toContain('/signup');
  });

  test('Should navigate to password reset page', async ({ page }) => {
    // Click on the "Forgot password?" link
    await page.click('text=Forgot password?');
    
    // Wait for navigation to reset password page
    await page.waitForURL('/reset-password');
    
    // Verify we're on the reset password page
    await expect(page.url()).toContain('/reset-password');
  });
});