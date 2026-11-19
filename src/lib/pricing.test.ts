import { describe, expect, it } from 'vitest'
import { calculatePricing } from './pricing'

describe('calculatePricing', () => {
  it('adds subtotal, packaging fee, and delivery fee before discount', () => {
    const summary = calculatePricing({
      items: [
        { unitPrice: 18, quantity: 2 },
        { unitPrice: 12, quantity: 1 },
      ],
      packagingFee: 3,
      deliveryFee: 4,
    })

    expect(summary).toEqual({
      subtotal: 48,
      discount: 3,
      total: 52,
      amountToNextDiscount: 2,
      nextDiscountLabel: '满 50 减 8',
    })
  })

  it('applies the highest matching discount tier', () => {
    const summary = calculatePricing({
      items: [{ unitPrice: 42, quantity: 2 }],
      packagingFee: 2,
      deliveryFee: 3,
    })

    expect(summary).toEqual({
      subtotal: 84,
      discount: 12,
      total: 77,
      amountToNextDiscount: 0,
      nextDiscountLabel: null,
    })
  })
})
