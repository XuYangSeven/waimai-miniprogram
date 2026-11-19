import { beforeEach, describe, expect, it } from 'vitest'
import { loadProgress, loadWaitingOrder, saveProgress, saveWaitingOrder } from './storage'

const progressKey = 'tonight-not-delivered-progress'
const waitingKey = 'tonight-not-delivered-waiting-order'

describe('storage helpers', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('returns default progress when nothing has been stored', () => {
    expect(loadProgress()).toEqual({
      totalInterceptedOrders: 0,
      totalAvoidedCalories: 0,
      totalSavedAmount: 0,
      streakDays: 0,
      lastCompletedDate: null,
      todayInterceptedCount: 0,
      todayInterceptedDate: null,
    })
  })

  it('fills missing today fields when loading an older stored progress shape', () => {
    window.localStorage.setItem(progressKey, JSON.stringify({
      totalInterceptedOrders: 3,
      totalAvoidedCalories: 2100,
      totalSavedAmount: 87,
      streakDays: 2,
      lastCompletedDate: '2026-08-08',
    }))

    expect(loadProgress()).toEqual({
      totalInterceptedOrders: 3,
      totalAvoidedCalories: 2100,
      totalSavedAmount: 87,
      streakDays: 2,
      lastCompletedDate: '2026-08-08',
      todayInterceptedCount: 0,
      todayInterceptedDate: null,
    })
  })

  it('persists progress in localStorage', () => {
    saveProgress({
      totalInterceptedOrders: 3,
      totalAvoidedCalories: 2100,
      totalSavedAmount: 87,
      streakDays: 2,
      lastCompletedDate: '2026-08-08',
      todayInterceptedCount: 2,
      todayInterceptedDate: '2026-08-08',
    })

    expect(window.localStorage.getItem(progressKey)).toContain('2100')
    expect(loadProgress()).toEqual({
      totalInterceptedOrders: 3,
      totalAvoidedCalories: 2100,
      totalSavedAmount: 87,
      streakDays: 2,
      lastCompletedDate: '2026-08-08',
      todayInterceptedCount: 2,
      todayInterceptedDate: '2026-08-08',
    })
  })

  it('removes waiting order storage when saving null', () => {
    window.localStorage.setItem(waitingKey, JSON.stringify({ startedAt: 1 }))
    saveWaitingOrder(null)
    expect(loadWaitingOrder()).toBeNull()
  })
})
