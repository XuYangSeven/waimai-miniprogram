import { mockMerchants } from '../data/mockMerchants'
import type { AppTab, CategoryId, Merchant, Screen, WaitingOrder } from '../types'

export type AppState = {
  screen: Screen
  merchants: Merchant[]
}

export function createInitialState(overrides: Partial<AppState> = {}): AppState {
  return {
    screen: { name: 'home' },
    merchants: mockMerchants,
    ...overrides,
  }
}

export function getInitialScreen({
  hasSeenIntro,
  waitingOrder,
}: {
  hasSeenIntro: boolean
  waitingOrder: WaitingOrder | null
}): Screen {
  if (waitingOrder) {
    return { name: 'waiting' }
  }

  if (!hasSeenIntro) {
    return { name: 'welcome' }
  }

  return { name: 'home' }
}

export function getSelectedCategory(state: AppState): CategoryId | null {
  return state.screen.name === 'categories' ? state.screen.categoryId ?? null : null
}

export function getDisplayedMerchants(state: AppState): Merchant[] {
  const selectedCategory = getSelectedCategory(state)

  if (!selectedCategory) {
    return state.merchants
  }

  return state.merchants.filter((merchant) => merchant.categoryId === selectedCategory)
}

export function getMerchantById(state: AppState, merchantId: string): Merchant | undefined {
  return state.merchants.find((merchant) => merchant.id === merchantId)
}

export function getActiveTab(screen: Screen): AppTab | null {
  if (screen.name === 'home' || screen.name === 'categories' || screen.name === 'profile') {
    return screen.name
  }

  return null
}

export function shouldShowTabBar(screen: Screen): boolean {
  return getActiveTab(screen) !== null || screen.name === 'merchant'
}

export function shouldShowCartBar(screen: Screen): boolean {
  return !['welcome', 'checkout', 'mock-pay', 'waiting', 'result'].includes(screen.name)
}
