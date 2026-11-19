import { describe, expect, it } from 'vitest'
import { mockMerchants } from '../data/mockMerchants'
import { createInitialState, getActiveTab, getDisplayedMerchants, getInitialScreen, getMerchantById, getSelectedCategory, shouldShowCartBar, shouldShowTabBar } from './appState'

describe('app state helpers', () => {
  it('returns home merchants by default', () => {
    const state = createInitialState()

    expect(state.screen).toEqual({ name: 'home' })
    expect(getDisplayedMerchants(state)).toHaveLength(mockMerchants.length)
    expect(getSelectedCategory(state)).toBeNull()
  })

  it('filters merchants for the selected categories screen', () => {
    const state = createInitialState({ screen: { name: 'categories', categoryId: 'milk-tea' } })

    expect(getSelectedCategory(state)).toBe('milk-tea')
    expect(getDisplayedMerchants(state).map((merchant) => merchant.id)).toEqual([
      'bubble-lab',
      'night-jasmine-tea',
      'sweet-lab-24h',
    ])
  })

  it('finds the active merchant on the merchant screen', () => {
    const state = createInitialState({ screen: { name: 'merchant', merchantId: 'charcoal-bbq' } })

    expect(getMerchantById(state, 'charcoal-bbq')?.name).toBe('楼下炭火烧烤档')
  })

  it('prefers the waiting screen over the welcome screen when restoring an order', () => {
    expect(getInitialScreen({
      hasSeenIntro: false,
      waitingOrder: {
        startedAt: 1,
        totalSeconds: 7,
        displayMinutes: 24,
        totalDistanceKm: 3.6,
        merchantName: '深夜脆脆炸鸡屋',
        addressLabel: '家',
        addressLine: '福田区深南大道 1008 号 9 楼',
        remark: '别按门铃',
        riderName: '阿宇',
        riderAvatar: 'avatar',
        riderRating: 4.9,
        routeStops: [],
      },
    })).toEqual({ name: 'waiting' })
  })

  it('returns the welcome screen for first-time visitors without a waiting order', () => {
    expect(getInitialScreen({ hasSeenIntro: false, waitingOrder: null })).toEqual({ name: 'welcome' })
  })

  it('returns the home screen once the intro has been seen', () => {
    expect(getInitialScreen({ hasSeenIntro: true, waitingOrder: null })).toEqual({ name: 'home' })
  })

  it('derives the active tab for tab screens only', () => {
    expect(getActiveTab({ name: 'home' })).toBe('home')
    expect(getActiveTab({ name: 'categories' })).toBe('categories')
    expect(getActiveTab({ name: 'profile' })).toBe('profile')
    expect(getActiveTab({ name: 'merchant', merchantId: 'charcoal-bbq' })).toBeNull()
  })

  it('shows the tab bar on app shell screens and merchant screens', () => {
    expect(shouldShowTabBar({ name: 'home' })).toBe(true)
    expect(shouldShowTabBar({ name: 'categories' })).toBe(true)
    expect(shouldShowTabBar({ name: 'profile' })).toBe(true)
    expect(shouldShowTabBar({ name: 'merchant', merchantId: 'charcoal-bbq' })).toBe(true)
    expect(shouldShowTabBar({ name: 'welcome' })).toBe(false)
    expect(shouldShowTabBar({ name: 'waiting' })).toBe(false)
  })

  it('hides the cart bar on welcome waiting and result screens', () => {
    expect(shouldShowCartBar({ name: 'welcome' })).toBe(false)
    expect(shouldShowCartBar({ name: 'waiting' })).toBe(false)
    expect(shouldShowCartBar({ name: 'result', avoidedCalories: 860, savedAmount: 36, waitedSeconds: 7 })).toBe(false)
    expect(shouldShowCartBar({ name: 'home' })).toBe(true)
    expect(shouldShowCartBar({ name: 'merchant', merchantId: 'charcoal-bbq' })).toBe(true)
  })
})
