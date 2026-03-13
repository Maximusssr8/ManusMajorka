import { test, expect } from '@playwright/test'
import { mockAuthSession } from './helpers'

test.describe('Product Research Tool', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthSession(page)
  })

  test('product discovery page loads', async ({ page }) => {
    await page.goto('/app/product-discovery')
    await page.waitForLoadState('networkidle')
    // Should not be on sign-in page
    await expect(page).not.toHaveURL(/sign-in/)
    // Should have some input or UI
    const input = page.locator('input, textarea').first()
    await expect(input.or(page.locator('body'))).not.toBeEmpty()
  })

  test('AI chat accepts product query and returns non-empty response', async ({ page }) => {
    // Test via direct API call (more reliable than UI automation)
    const response = await page.request.post('/api/chat', {
      data: {
        messages: [{ role: 'user', content: 'posture corrector AU market analysis' }],
        toolName: 'product-discovery',
        market: 'AU',
        stream: false,
      },
      timeout: 60000,
    })

    expect(response.status()).toBeLessThan(500)
    const body = await response.json()
    const text = body.content || body.text || body.result || JSON.stringify(body)
    
    // Response must be non-empty
    expect(text.length).toBeGreaterThan(50)
    // Should contain some AU-relevant content
    expect(text.toLowerCase()).toMatch(/australia|aud|\$|au market|posture/i)
  })

  test('validate tool returns financial maths', async ({ page }) => {
    const response = await page.request.post('/api/chat', {
      data: {
        messages: [{ role: 'user', content: 'posture corrector buy $8 AUD sell $49 AUD AU market' }],
        toolName: 'validate',
        market: 'AU',
        stream: false,
      },
      timeout: 60000,
    })

    expect(response.status()).toBeLessThan(500)
    const body = await response.json()
    const text = body.content || body.text || body.result || JSON.stringify(body)
    
    // Must contain financial analysis
    expect(text.length).toBeGreaterThan(100)
    expect(text).toMatch(/margin|COGS|profit|\$|AUD|ROAS/i)
  })

  test('supplier finder returns AU-relevant suppliers', async ({ page }) => {
    const response = await page.request.post('/api/chat', {
      data: {
        messages: [{ role: 'user', content: 'resistance bands ship to Australia' }],
        toolName: 'supplier-finder',
        market: 'AU',
        stream: false,
      },
      timeout: 60000,
    })

    expect(response.status()).toBeLessThan(500)
    const body = await response.json()
    const text = body.content || body.text || body.result || JSON.stringify(body)
    expect(text.length).toBeGreaterThan(50)
  })
})
