import { describe, expect, it } from 'vitest'
import type { CartItem, ProgressStats } from '../types'
import { buildResultStats, createWaitingOrder } from './orderFlow'

describe('order flow helpers', () => {
  it('creates a waiting order snapshot from the cart', () => {
    const order = createWaitingOrder({
      riderName: '阿宇',
      riderAvatar: 'https://example.com/rider.jpg',
      riderRating: 4.9,
      totalSeconds: 120,
      displayMinutes: 2,
      totalDistanceKm: 3.6,
      merchantName: '深夜脆脆炸鸡屋',
      addressLabel: '家',
      addressLine: '福田区深南大道 1008 号 9 楼',
      remark: '别按门铃',
      routeStops: [],
    })

    expect(order.totalSeconds).toBe(120)
    expect(order.riderName).toBe('阿宇')
  })

  it('builds result stats and updates cumulative progress', () => {
    const cart: CartItem[] = [
      {
        productId: 'crispy-combo',
        merchantId: 'night-crispy-club',
        name: '香辣炸鸡双拼套餐',
        description: '鸡腿堡 + 小份炸鸡 + 冰可乐',
        image: 'https://example.com/item.jpg',
        unitPrice: 32,
        estimatedCalories: 860,
        quantity: 1,
      },
    ]

    const progress: ProgressStats = {
      totalInterceptedOrders: 0,
      totalAvoidedCalories: 0,
      totalSavedAmount: 0,
      streakDays: 0,
      lastCompletedDate: null,
      todayInterceptedCount: 0,
      todayInterceptedDate: null,
    }

    const result = buildResultStats({
      cart,
      progress,
      completedOn: '2026-08-08',
      packagingFee: 3,
      deliveryFee: 4,
      waitedSeconds: 120,
    })

    expect(result.session).toEqual({
      avoidedCalories: 860,
      savedAmount: 36,
      waitedSeconds: 120,
    })

    expect(result.progress).toEqual({
      totalInterceptedOrders: 1,
      totalAvoidedCalories: 860,
      totalSavedAmount: 36,
      streakDays: 1,
      lastCompletedDate: '2026-08-08',
      todayInterceptedCount: 1,
      todayInterceptedDate: '2026-08-08',
    })
  })

  it('increments today intercepted count when another order completes on the same day', () => {
    const cart: CartItem[] = [
      {
        productId: 'crispy-combo',
        merchantId: 'night-crispy-club',
        name: '香辣炸鸡双拼套餐',
        description: '鸡腿堡 + 小份炸鸡 + 冰可乐',
        image: 'https://example.com/item.jpg',
        unitPrice: 32,
        estimatedCalories: 860,
        quantity: 1,
      },
    ]

    const progress: ProgressStats = {
      totalInterceptedOrders: 2,
      totalAvoidedCalories: 1200,
      totalSavedAmount: 48,
      streakDays: 3,
      lastCompletedDate: '2026-08-08',
      todayInterceptedCount: 1,
      todayInterceptedDate: '2026-08-08',
    }

    const result = buildResultStats({
      cart,
      progress,
      completedOn: '2026-08-08',
      packagingFee: 3,
      deliveryFee: 4,
      waitedSeconds: 120,
    })

    expect(result.progress.todayInterceptedCount).toBe(2)
    expect(result.progress.todayInterceptedDate).toBe('2026-08-08')
    expect(result.progress.streakDays).toBe(3)
  })

  it('resets today intercepted count when an order completes on a new day', () => {
    const cart: CartItem[] = [
      {
        productId: 'crispy-combo',
        merchantId: 'night-crispy-club',
        name: '香辣炸鸡双拼套餐',
        description: '鸡腿堡 + 小份炸鸡 + 冰可乐',
        image: 'https://example.com/item.jpg',
        unitPrice: 32,
        estimatedCalories: 860,
        quantity: 1,
      },
    ]

    const progress: ProgressStats = {
      totalInterceptedOrders: 2,
      totalAvoidedCalories: 1200,
      totalSavedAmount: 48,
      streakDays: 3,
      lastCompletedDate: '2026-08-07',
      todayInterceptedCount: 4,
      todayInterceptedDate: '2026-08-07',
    }

    const result = buildResultStats({
      cart,
      progress,
      completedOn: '2026-08-08',
      packagingFee: 3,
      deliveryFee: 4,
      waitedSeconds: 120,
    })

    expect(result.progress.todayInterceptedCount).toBe(1)
    expect(result.progress.todayInterceptedDate).toBe('2026-08-08')
    expect(result.progress.streakDays).toBe(4)
  })
})
