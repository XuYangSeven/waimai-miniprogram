import { calculateTotalCalories } from './calories'
import { calculatePricing } from './pricing'
import { updateStreak } from './streak'
import type { CartItem, ProgressStats, WaitingOrder } from '../types'

export function createWaitingOrder({
  riderName,
  riderAvatar,
  riderRating,
  totalSeconds,
  displayMinutes,
  totalDistanceKm,
  merchantName,
  addressLabel,
  addressLine,
  remark,
  routeStops,
}: Omit<WaitingOrder, 'startedAt'>): WaitingOrder {
  return {
    startedAt: Date.now(),
    totalSeconds,
    displayMinutes,
    totalDistanceKm,
    merchantName,
    addressLabel,
    addressLine,
    remark,
    riderName,
    riderAvatar,
    riderRating,
    routeStops,
  }
}

export function buildResultStats({
  cart,
  progress,
  completedOn,
  packagingFee,
  deliveryFee,
  waitedSeconds,
}: {
  cart: CartItem[]
  progress: ProgressStats
  completedOn: string
  packagingFee: number
  deliveryFee: number
  waitedSeconds: number
}) {
  const avoidedCalories = calculateTotalCalories(cart)
  const pricing = calculatePricing({
    items: cart.map((item) => ({ unitPrice: item.unitPrice, quantity: item.quantity })),
    packagingFee,
    deliveryFee,
  })

  const streak = updateStreak({
    streakDays: progress.streakDays,
    lastCompletedDate: progress.lastCompletedDate,
    completedOn,
  })

  const isSameDay = progress.todayInterceptedDate === completedOn
  const todayInterceptedCount = isSameDay ? progress.todayInterceptedCount + 1 : 1

  return {
    session: {
      avoidedCalories,
      savedAmount: pricing.total,
      waitedSeconds,
    },
    progress: {
      totalInterceptedOrders: progress.totalInterceptedOrders + 1,
      totalAvoidedCalories: progress.totalAvoidedCalories + avoidedCalories,
      totalSavedAmount: progress.totalSavedAmount + pricing.total,
      streakDays: streak.streakDays,
      lastCompletedDate: streak.lastCompletedDate,
      todayInterceptedCount,
      todayInterceptedDate: completedOn,
    },
  }
}
