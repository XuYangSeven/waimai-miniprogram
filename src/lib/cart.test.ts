import { describe, expect, it } from 'vitest'
import {
  addCartItem,
  createInitialCartState,
  decrementCartItemQuantity,
  getCartItemCount,
  getCartSubtotal,
  incrementCartItemQuantity,
  removeCartItem,
  setCartItemQuantity,
} from './cart'

describe('cart helpers', () => {
  it('adds a new product to an empty cart', () => {
    const cart = addCartItem(createInitialCartState(), {
      productId: 'crispy-combo',
      merchantId: 'night-crispy-club',
      name: '香辣炸鸡双拼套餐',
      description: '鸡腿堡 + 小份炸鸡 + 冰可乐',
      image: 'https://example.com/item.jpg',
      unitPrice: 32,
      estimatedCalories: 860,
      quantity: 1,
    })

    expect(cart).toHaveLength(1)
    expect(getCartItemCount(cart)).toBe(1)
    expect(getCartSubtotal(cart)).toBe(32)
  })

  it('merges quantity when the same product and option is added twice', () => {
    const cart = addCartItem(
      [
        {
          productId: 'brown-sugar-boba',
          merchantId: 'bubble-lab',
          name: '黑糖珍珠鲜奶',
          description: '厚奶底 + 手工珍珠',
          image: 'https://example.com/tea.jpg',
          unitPrice: 18,
          estimatedCalories: 410,
          quantity: 1,
          selectedOptions: [{ optionId: 'sweetness', choiceLabel: '半糖' }],
        },
      ],
      {
        productId: 'brown-sugar-boba',
        merchantId: 'bubble-lab',
        name: '黑糖珍珠鲜奶',
        description: '厚奶底 + 手工珍珠',
        image: 'https://example.com/tea.jpg',
        unitPrice: 18,
        estimatedCalories: 410,
        quantity: 1,
        selectedOptions: [{ optionId: 'sweetness', choiceLabel: '半糖' }],
      },
    )

    expect(cart).toHaveLength(1)
    expect(cart[0].quantity).toBe(2)
    expect(getCartItemCount(cart)).toBe(2)
    expect(getCartSubtotal(cart)).toBe(36)
  })

  it('keeps separate lines for different options', () => {
    const cart = addCartItem(
      [
        {
          productId: 'brown-sugar-boba',
          merchantId: 'bubble-lab',
          name: '黑糖珍珠鲜奶',
          description: '厚奶底 + 手工珍珠',
          image: 'https://example.com/tea.jpg',
          unitPrice: 18,
          estimatedCalories: 410,
          quantity: 1,
          selectedOptions: [{ optionId: 'sweetness', choiceLabel: '全糖' }],
        },
      ],
      {
        productId: 'brown-sugar-boba',
        merchantId: 'bubble-lab',
        name: '黑糖珍珠鲜奶',
        description: '厚奶底 + 手工珍珠',
        image: 'https://example.com/tea.jpg',
        unitPrice: 18,
        estimatedCalories: 410,
        quantity: 1,
        selectedOptions: [{ optionId: 'sweetness', choiceLabel: '三分糖' }],
      },
    )

    expect(cart).toHaveLength(2)
    expect(getCartItemCount(cart)).toBe(2)
  })

  it('increments quantity for an existing cart line', () => {
    const cart = incrementCartItemQuantity(
      [
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
      ],
      {
        productId: 'crispy-combo',
        merchantId: 'night-crispy-club',
      },
    )

    expect(cart[0].quantity).toBe(2)
    expect(getCartItemCount(cart)).toBe(2)
    expect(getCartSubtotal(cart)).toBe(64)
  })

  it('decrements quantity without removing the line when more than one item exists', () => {
    const cart = decrementCartItemQuantity(
      [
        {
          productId: 'crispy-combo',
          merchantId: 'night-crispy-club',
          name: '香辣炸鸡双拼套餐',
          description: '鸡腿堡 + 小份炸鸡 + 冰可乐',
          image: 'https://example.com/item.jpg',
          unitPrice: 32,
          estimatedCalories: 860,
          quantity: 2,
        },
      ],
      {
        productId: 'crispy-combo',
        merchantId: 'night-crispy-club',
      },
    )

    expect(cart).toHaveLength(1)
    expect(cart[0].quantity).toBe(1)
    expect(getCartItemCount(cart)).toBe(1)
  })

  it('removes the target cart line', () => {
    const cart = removeCartItem(
      [
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
        {
          productId: 'cola',
          merchantId: 'night-crispy-club',
          name: '可乐',
          description: '冰可乐',
          image: 'https://example.com/cola.jpg',
          unitPrice: 6,
          estimatedCalories: 140,
          quantity: 1,
        },
      ],
      {
        productId: 'crispy-combo',
        merchantId: 'night-crispy-club',
      },
    )

    expect(cart).toHaveLength(1)
    expect(cart[0].productId).toBe('cola')
  })

  it('removes a cart line when quantity is set to zero', () => {
    const cart = setCartItemQuantity(
      [
        {
          productId: 'brown-sugar-boba',
          merchantId: 'bubble-lab',
          name: '黑糖珍珠鲜奶',
          description: '厚奶底 + 手工珍珠',
          image: 'https://example.com/tea.jpg',
          unitPrice: 18,
          estimatedCalories: 410,
          quantity: 1,
          selectedOptions: [{ optionId: 'sweetness', choiceLabel: '半糖' }],
        },
      ],
      {
        productId: 'brown-sugar-boba',
        merchantId: 'bubble-lab',
        selectedOptions: [{ optionId: 'sweetness', choiceLabel: '半糖' }],
      },
      0,
    )

    expect(cart).toEqual([])
  })
})
