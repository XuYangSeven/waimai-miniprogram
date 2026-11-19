import { describe, expect, it } from 'vitest'
import { updateStreak } from './streak'

describe('updateStreak', () => {
  it('increments the streak when the new completion is on the next day', () => {
    const result = updateStreak({
      streakDays: 3,
      lastCompletedDate: '2026-08-07',
      completedOn: '2026-08-08',
    })

    expect(result).toEqual({
      streakDays: 4,
      lastCompletedDate: '2026-08-08',
    })
  })

  it('does not increment the streak twice on the same day', () => {
    const result = updateStreak({
      streakDays: 4,
      lastCompletedDate: '2026-08-08',
      completedOn: '2026-08-08',
    })

    expect(result).toEqual({
      streakDays: 4,
      lastCompletedDate: '2026-08-08',
    })
  })

  it('resets the streak when days are skipped', () => {
    const result = updateStreak({
      streakDays: 4,
      lastCompletedDate: '2026-08-06',
      completedOn: '2026-08-08',
    })

    expect(result).toEqual({
      streakDays: 1,
      lastCompletedDate: '2026-08-08',
    })
  })
})
