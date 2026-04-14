import { test, expect } from '@playwright/test'
import { mockAuthSession } from './helpers'

// Smoke: /app/ads-studio loads without throwing.
test('ads studio page loads', async ({ page }) => {
  await mockAuthSession(page)
  await page.goto('/app/ads-studio')
  await page.waitForLoadState('domcontentloaded')

  const heading = page
    .locator('h1, h2')
    .filter({ hasText: /ads|creative|campaign|studio/i })
    .first()

  await expect(heading).toBeAttached({ timeout: 15000 })
})
