import { createContext, useContext, useState, useCallback } from 'react'
import { type MarketCode, MARKETS, DEFAULT_MARKET, buildMarketContext } from '@shared/markets'
import { trpc } from '@/lib/trpc'

interface MarketContextValue {
  market: MarketCode
  setMarket: (m: MarketCode) => void
  marketConfig: typeof MARKETS[MarketCode]
  getPromptContext: () => string
}

const MarketContext = createContext<MarketContextValue>(null!)

export function MarketProvider({ children }: { children: React.ReactNode }) {
  const [market, setMarketState] = useState<MarketCode>(() => {
    return (localStorage.getItem('majorka_market') as MarketCode) || DEFAULT_MARKET
  })

  const updateProfile = trpc.profile.update.useMutation()

  const setMarket = useCallback((m: MarketCode) => {
    setMarketState(m)
    localStorage.setItem('majorka_market', m)
    // Sync to server (fire-and-forget)
    updateProfile.mutate({ country: m })
  }, [updateProfile])

  const getPromptContext = useCallback(() => buildMarketContext(market), [market])

  return (
    <MarketContext.Provider value={{ market, setMarket, marketConfig: MARKETS[market], getPromptContext }}>
      {children}
    </MarketContext.Provider>
  )
}

export const useMarket = () => useContext(MarketContext)

/** Read stored market without React context (for use outside components) */
export function getStoredMarket(): MarketCode {
  try {
    return (localStorage.getItem('majorka_market') as MarketCode) || DEFAULT_MARKET
  } catch {
    return DEFAULT_MARKET
  }
}
