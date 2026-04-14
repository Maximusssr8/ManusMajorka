import { test, expect } from '@playwright/test'
import { mockAuthSession } from './helpers'

// Smoke: /app/store-builder loads without throwing.
test('store builder page loads', async ({ page }) => {
  await mockAuthSession(page)
  await page.goto('/app/store-builder')
  await page.waitForLoadState('domcontentloaded')

  const heading = page
    .locator('h1, h2')
    .filter({ hasText: /store|builder|website|shop/i })
    .first()

  await expect(heading).toBeAttached({ timeout: 15000 })
})
