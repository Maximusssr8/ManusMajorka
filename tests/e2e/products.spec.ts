import { test, expect } from '@playwright/test'
import { mockAuthSession } from './helpers'

// Smoke: /app/products loads and exposes at least one filter control.
test('products page renders with filter controls', async ({ page }) => {
  await mockAuthSession(page)
  await page.goto('/app/products')
  await page.waitForLoadState('domcontentloaded')

  // Any filter affordance — input, select, or button with filter-ish text.
  const anyFilter = page
    .locator('input, select, button')
    .filter({ hasText: /filter|category|price|sort|search/i })
    .first()
    .or(page.locator('input[type="search"], input[placeholder*="search" i]').first())

  await expect(anyFilter).toBeAttached({ timeout: 15000 })
})
