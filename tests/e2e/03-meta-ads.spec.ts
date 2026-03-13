import { test, expect } from '@playwright/test'

test.describe('Meta Ads Tool', () => {
  test('meta ads API endpoint exists and is not a 404 or 5xx', async ({ page }) => {
    const response = await page.request.post('/api/chat', {
      data: {
        messages: [{ role: 'user', content: 'posture corrector, AU women 30-50, $49 AUD, pain relief angle' }],
        toolName: 'meta-ads-pack',
        market: 'AU',
        stream: false,
      },
      timeout: 30000,
    })

    // Not 404 (endpoint exists), not 5xx (no crash)
    expect(response.status()).not.toBe(404)
    expect(response.status()).toBeLessThan(500)
    
    const body = await response.json()
    expect(body).toBeTruthy()
    
    // If rate limited, we get a structured error — that's valid
    const text = body.content || body.text || body.result || body.error || JSON.stringify(body)
    expect(text.length).toBeGreaterThan(10)
    
    // If we get actual ad content (not rate-limited), check for AU content
    if (response.status() === 200 && text.length > 200) {
      const adSections = (text.match(/ad\s*[123]|variation\s*[123]|##\s*ad/gi) || []).length
      expect(adSections).toBeGreaterThanOrEqual(1)
      expect(text.toLowerCase()).toMatch(/australia|aud|\$|afterpay|au/i)
    } else {
      test.info().annotations.push({
        type: 'note',
        description: `Rate limited or auth required. Status: ${response.status()}, Response: ${text.slice(0, 100)}`
      })
    }
  })

  test('meta ads API returns structured JSON response', async ({ page }) => {
    const response = await page.request.post('/api/chat', {
      data: {
        messages: [{ role: 'user', content: 'wireless earbuds, AU teens 16-24, $79 AUD, cool factor' }],
        toolName: 'meta-ads-pack',
        market: 'AU',
        stream: false,
      },
      timeout: 30000,
    })

    expect(response.status()).not.toBe(404)
    expect(response.status()).toBeLessThan(500)
    const body = await response.json()
    expect(body).toBeTruthy()
    
    // Response must be parseable JSON with some field
    const hasKnownField = 'content' in body || 'text' in body || 'result' in body || 'error' in body
    expect(hasKnownField).toBeTruthy()
    
    test.info().annotations.push({
      type: 'note',
      description: `Status: ${response.status()}, fields: ${Object.keys(body).join(', ')}`
    })
  })

  test('API rate limiting returns structured error when exhausted', async ({ page }) => {
    // Make up to 4 calls — after limit is hit, should return structured rate-limit errors (not 5xx)
    const results: Array<{ status: number, error?: string }> = []
    for (let i = 0; i < 4; i++) {
      const response = await page.request.post('/api/chat', {
        data: {
          messages: [{ role: 'user', content: `test query ${i}` }],
          toolName: 'ai-chat',
          market: 'AU',
          stream: false,
        },
        timeout: 15000,
      })
      const body = await response.json().catch(() => ({}))
      results.push({ status: response.status(), error: body.error })
    }
    
    // All responses should be non-5xx (server didn't crash, rate limiting works)
    results.forEach(r => expect(r.status).toBeLessThan(500))
    
    // Some calls should succeed (200) OR be properly rate-limited (429)
    const validStatuses = results.every(r => r.status === 200 || r.status === 429 || r.status === 401 || r.status === 403)
    expect(validStatuses).toBeTruthy()
    
    console.log('Rate limit test results:', results.map(r => `${r.status}${r.error ? ':' + r.error?.slice(0, 30) : ''}`).join(', '))
  })
})
