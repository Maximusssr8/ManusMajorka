import { Page } from '@playwright/test'

export const ADMIN_EMAIL = 'maximusmajorka@gmail.com'
export const BASE_URL = 'http://127.0.0.1:3000'

// Inject a fake auth session into localStorage to bypass OAuth
// This simulates a logged-in Supabase session without real OAuth
export async function mockAuthSession(page: Page, email = 'test@example.com') {
  await page.goto('/')
  
  // Inject a mock Supabase session
  await page.evaluate((email) => {
    const mockSession = {
      access_token: 'mock-token-' + Date.now(),
      refresh_token: 'mock-refresh',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: {
        id: 'mock-user-id-123',
        email: email,
        aud: 'authenticated',
        role: 'authenticated',
        app_metadata: { provider: 'google' },
        user_metadata: { full_name: 'Test User', name: 'Test User' },
        created_at: new Date().toISOString(),
      }
    }
    
    // Supabase stores session in localStorage
    localStorage.setItem(
      'sb-ievekuazsjbdrltsdksn-auth-token',
      JSON.stringify({ currentSession: mockSession, expiresAt: mockSession.expires_at })
    )
    
    // Also set onboarding as completed so we don't get redirected
    localStorage.setItem('majorka_onboarding_complete', 'true')
    localStorage.setItem('majorka_user_profile', JSON.stringify({
      name: 'Test User', niche: 'fitness', experience: 'beginner', market: 'AU'
    }))
  }, email)
}

// Wait for a response in the AI tool chat
export async function waitForAIResponse(page: Page, timeoutMs = 45000): Promise<string> {
  // Wait for the response area to have content
  await page.waitForFunction(() => {
    const responseEl = document.querySelector('[data-testid="ai-response"]') ||
      document.querySelector('.ai-response') ||
      document.querySelector('[class*="prose"]') ||
      document.querySelector('[class*="response"]')
    return responseEl && responseEl.textContent && responseEl.textContent.trim().length > 50
  }, { timeout: timeoutMs })
  
  const responseEl = page.locator('[data-testid="ai-response"]').first()
    .or(page.locator('.ai-response').first())
    .or(page.locator('[class*="prose"]').first())
  
  return await responseEl.textContent() || ''
}
