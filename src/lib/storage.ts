import type { OrderHistoryItem, ProgressStats, SavedAddress, WaitingOrder } from '../types'

const PROGRESS_KEY = 'tonight-not-delivered-progress'
const WAITING_ORDER_KEY = 'tonight-not-delivered-waiting-order'
const HAS_SEEN_INTRO_KEY = 'tonight-not-delivered-has-seen-intro'
const SAVED_ADDRESS_KEY = 'tonight-not-delivered-saved-address'
const ORDER_HISTORY_KEY = 'tonight-not-delivered-order-history'

const defaultProgress: ProgressStats = {
  totalInterceptedOrders: 0,
  totalAvoidedCalories: 0,
  totalSavedAmount: 0,
  streakDays: 0,
  lastCompletedDate: null,
  todayInterceptedCount: 0,
  todayInterceptedDate: null,
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback
  }

  const rawValue = window.localStorage.getItem(key)

  if (!rawValue) {
    return fallback
  }

  try {
    return JSON.parse(rawValue) as T
  } catch {
    return fallback
  }
}

function readBoolean(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') {
    return fallback
  }

  const rawValue = window.localStorage.getItem(key)

  if (rawValue === null) {
    return fallback
  }

  return rawValue === 'true'
}

export function loadProgress(): ProgressStats {
  const storedProgress = readJson<Partial<ProgressStats>>(PROGRESS_KEY, {})

  return {
    ...defaultProgress,
    ...storedProgress,
  }
}

export function saveProgress(progress: ProgressStats) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
}

export function loadWaitingOrder(): WaitingOrder | null {
  return readJson<WaitingOrder | null>(WAITING_ORDER_KEY, null)
}

export function saveWaitingOrder(order: WaitingOrder | null) {
  if (typeof window === 'undefined') {
    return
  }

  if (!order) {
    window.localStorage.removeItem(WAITING_ORDER_KEY)
    return
  }

  window.localStorage.setItem(WAITING_ORDER_KEY, JSON.stringify(order))
}

export function loadHasSeenIntro() {
  return readBoolean(HAS_SEEN_INTRO_KEY, false)
}

export function saveHasSeenIntro(hasSeenIntro: boolean) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(HAS_SEEN_INTRO_KEY, String(hasSeenIntro))
}

export function loadSavedAddress(): SavedAddress {
  return readJson<SavedAddress>(SAVED_ADDRESS_KEY, {
    addressLabel: '家',
    addressLine: '',
    remark: '别按门铃',
  })
}

export function saveSavedAddress(address: SavedAddress) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(SAVED_ADDRESS_KEY, JSON.stringify(address))
}

export function loadOrderHistory() {
  return readJson<OrderHistoryItem[]>(ORDER_HISTORY_KEY, [])
}

export function saveOrderHistory(history: OrderHistoryItem[]) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(history))
}
