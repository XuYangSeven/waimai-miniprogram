export type CategoryId = 'fried-chicken' | 'milk-tea' | 'bbq' | 'burger' | 'dessert' | 'rice-noodles' | 'noodles' | 'snacks'

export type AppTab = 'home' | 'categories' | 'profile'

export type ProductOptionChoice = {
  label: string
  priceDelta: number
}

export type ProductOption = {
  id: string
  name: string
  multiSelect?: boolean
  choices: ProductOptionChoice[]
}

export type SelectedOption = {
  optionId: string
  choiceLabel: string
}

export type Product = {
  id: string
  name: string
  description: string
  price: number
  estimatedCalories: number
  monthlySales: number
  image: string
  tag?: string
  options?: ProductOption[]
}

export type Merchant = {
  id: string
  categoryId: CategoryId
  name: string
  coverImage: string
  rating: number
  monthlySales: number
  deliveryTime: string
  minimumOrderPrice: number
  deliveryFee: number
  promotionText: string
  announcement: string
  featuredTags: string[]
  products: Product[]
}

export type CartItem = {
  productId: string
  merchantId: string
  name: string
  description: string
  image: string
  unitPrice: number
  estimatedCalories: number
  quantity: number
  selectedOptions?: SelectedOption[]
}

export type OrderHistoryItem = {
  id: string
  merchantName: string
  orderedAt: string
  addressLabel: string
  addressLine: string
  totalAmount: number
  totalItems: number
  itemsSummary: string
}

export type SavedAddress = {
  addressLabel: string
  addressLine: string
  remark: string
}

export type CheckoutDraft = {
  addressLabel: string
  addressLine: string
  deliveryEta: string
  remark: string
}

export type WaitingRouteStop = {
  id: string
  label: string
  status: 'done' | 'current' | 'upcoming'
}

export type WaitingOrder = {
  startedAt: number
  totalSeconds: number
  displayMinutes: number
  totalDistanceKm: number
  merchantName: string
  addressLabel: string
  addressLine: string
  remark: string
  riderName: string
  riderAvatar: string
  riderRating: number
  routeStops: WaitingRouteStop[]
}

export type ProgressStats = {
  totalInterceptedOrders: number
  totalAvoidedCalories: number
  totalSavedAmount: number
  streakDays: number
  lastCompletedDate: string | null
  todayInterceptedCount: number
  todayInterceptedDate: string | null
}

export type Screen =
  | { name: 'welcome' }
  | { name: 'home' }
  | { name: 'categories'; categoryId?: CategoryId }
  | { name: 'profile' }
  | { name: 'merchant'; merchantId: string }
  | { name: 'checkout' }
  | { name: 'mock-pay' }
  | { name: 'waiting' }
  | { name: 'result'; avoidedCalories: number; savedAmount: number; waitedSeconds: number }
