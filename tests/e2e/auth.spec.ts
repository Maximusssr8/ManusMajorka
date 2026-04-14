import { test, expect } from '@playwright/test'

// Smoke: unauthenticated login happy path — sign-in page renders the primary auth affordance.
test('sign-in page loads with OAuth affordance', async ({ page }) => {
  await page.goto('/sign-in')
  await expect(page).toHaveTitle(/Majorka/i)
  const googleBtn = page
    .locator('button, a')
    .filter({ hasText: /google|continue with|sign in/i })
    .first()
  await expect(googleBtn).toBeVisible({ timeout: 10000 })
})
