import { test, expect } from '@playwright/test';

test.describe('Authorized User Workflows', () => {
  test('should login successfully and access protected routes', async ({ page }) => {
    // INTERCEPT: Mock Supabase Auth if we are hitting the mock URL
    await page.route('**/auth/v1/token*', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'fake-token',
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'fake-refresh-token',
            user: {
              id: 'fake-user-id',
              email: 'tonym415@gmail.com',
              user_metadata: { username: 'Tony' },
              aud: 'authenticated',
              role: 'authenticated'
            }
          })
        });
      } else {
        await route.continue();
      }
    });

    // Mock the profile fetch as well
    await page.route('**/rest/v1/profiles*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'fake-user-id',
          username: 'Tony',
          rating: 1200,
          hearts: 5,
          xp: 100,
          streak: 1
        })
      });
    });

    await page.goto('/');

    // Open login modal
    const loginTrigger = page.locator('button:has-text("Login")');
    await expect(loginTrigger).toBeVisible();
    await loginTrigger.click();

    // Fill credentials
    await page.fill('[data-testid="email-input"]', 'tonym415@gmail.com');
    await page.fill('[data-testid="password-input"]', 'Hawk2Zeus');
    
    // Submit
    await page.click('[data-testid="auth-submit-btn"]');

    // Wait for login success (modal should close)
    await expect(page.locator('.modal-card')).toBeHidden({ timeout: 15000 });

    // Verify authenticated UI elements
    // The "Knight's Path" should now be visible in the SideNav
    const academyLink = page.locator('nav.sidenav a:has-text("Knight\'s Path")');
    await expect(academyLink).toBeVisible({ timeout: 10000 });

    // Navigate to Academy
    await academyLink.click();
    await expect(page).toHaveURL(/.*academy/);
    await expect(page.locator('h1')).toContainText("The Academy");
    await expect(page.locator('.view-subtitle')).toContainText("Knight's Path");

    // Verify War Room (Profile)
    const profileLink = page.locator('nav.sidenav a:has-text("War Room")');
    await expect(profileLink).toBeVisible();
    await profileLink.click();
    await expect(page).toHaveURL(/.*profile/);
  });
});
