export type PricingItem = {
  unitPrice: number
  quantity: number
}

export type PricingInput = {
  items: PricingItem[]
  packagingFee: number
  deliveryFee: number
}

export type PricingSummary = {
  subtotal: number
  discount: number
  total: number
  amountToNextDiscount: number
  nextDiscountLabel: string | null
}

const DISCOUNT_TIERS = [
  { threshold: 30, discount: 3 },
  { threshold: 50, discount: 8 },
  { threshold: 80, discount: 12 },
]

export function calculatePricing({ items, packagingFee, deliveryFee }: PricingInput): PricingSummary {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const matchedTier = [...DISCOUNT_TIERS].reverse().find((tier) => subtotal >= tier.threshold)
  const nextTier = DISCOUNT_TIERS.find((tier) => subtotal < tier.threshold) ?? null
  const discount = matchedTier?.discount ?? 0
  const total = subtotal + packagingFee + deliveryFee - discount

  return {
    subtotal,
    discount,
    total,
    amountToNextDiscount: nextTier ? nextTier.threshold - subtotal : 0,
    nextDiscountLabel: nextTier ? `满 ${nextTier.threshold} 减 ${nextTier.discount}` : null,
  }
}
