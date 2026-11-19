import type { CartItem, SelectedOption } from '../types'

type CartItemKey = Pick<CartItem, 'productId' | 'merchantId' | 'selectedOptions'>

function selectedOptionsKey(options?: SelectedOption[]): string {
  if (!options || options.length === 0) return ''
  return options.map((o) => `${o.optionId}:${o.choiceLabel}`).sort().join('|')
}

function isSameCartItem(cartItem: CartItem, target: CartItemKey) {
  return cartItem.productId === target.productId &&
    cartItem.merchantId === target.merchantId &&
    selectedOptionsKey(cartItem.selectedOptions) === selectedOptionsKey(target.selectedOptions)
}

export function createInitialCartState(): CartItem[] {
  return []
}

export function addCartItem(cart: CartItem[], nextItem: CartItem): CartItem[] {
  const existingIndex = cart.findIndex((item) => isSameCartItem(item, nextItem))

  if (existingIndex === -1) {
    return [...cart, nextItem]
  }

  return cart.map((item, index) =>
    index === existingIndex
      ? {
          ...item,
          quantity: item.quantity + nextItem.quantity,
        }
      : item,
  )
}

export function setCartItemQuantity(cart: CartItem[], target: CartItemKey, quantity: number): CartItem[] {
  if (quantity <= 0) {
    return removeCartItem(cart, target)
  }

  return cart.map((item) =>
    isSameCartItem(item, target)
      ? {
          ...item,
          quantity,
        }
      : item,
  )
}

export function incrementCartItemQuantity(cart: CartItem[], target: CartItemKey): CartItem[] {
  const currentItem = cart.find((item) => isSameCartItem(item, target))

  if (!currentItem) {
    return cart
  }

  return setCartItemQuantity(cart, target, currentItem.quantity + 1)
}

export function decrementCartItemQuantity(cart: CartItem[], target: CartItemKey): CartItem[] {
  const currentItem = cart.find((item) => isSameCartItem(item, target))

  if (!currentItem) {
    return cart
  }

  return setCartItemQuantity(cart, target, currentItem.quantity - 1)
}

export function removeCartItem(cart: CartItem[], target: CartItemKey): CartItem[] {
  return cart.filter((item) => !isSameCartItem(item, target))
}

export function getCartItemCount(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.quantity, 0)
}

export function getCartSubtotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
}
