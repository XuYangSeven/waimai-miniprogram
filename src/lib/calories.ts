export type CalorieItem = {
  estimatedCalories: number
  quantity: number
}

export function calculateTotalCalories(items: CalorieItem[]): number {
  return items.reduce((sum, item) => sum + item.estimatedCalories * item.quantity, 0)
}
