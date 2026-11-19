import { describe, expect, it } from 'vitest'
import { calculateTotalCalories } from './calories'

describe('calculateTotalCalories', () => {
  it('sums estimated calories across all cart items', () => {
    const total = calculateTotalCalories([
      { estimatedCalories: 420, quantity: 1 },
      { estimatedCalories: 380, quantity: 2 },
    ])

    expect(total).toBe(1180)
  })

  it('returns zero for an empty cart', () => {
    expect(calculateTotalCalories([])).toBe(0)
  })
})
