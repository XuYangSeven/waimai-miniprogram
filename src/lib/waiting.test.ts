import { describe, expect, it } from 'vitest'
import { getWaitingStage, getWaitingStatus } from './waiting'

describe('getWaitingStage', () => {
  it('returns preparing at the beginning of the countdown', () => {
    expect(getWaitingStage({ totalSeconds: 300, remainingSeconds: 290 })).toBe('preparing')
  })

  it('returns rider_assigned in the first half of the countdown', () => {
    expect(getWaitingStage({ totalSeconds: 300, remainingSeconds: 210 })).toBe('rider_assigned')
  })

  it('returns delivering near the end of the countdown', () => {
    expect(getWaitingStage({ totalSeconds: 300, remainingSeconds: 110 })).toBe('delivering')
  })

  it('returns arriving in the last quarter of the countdown', () => {
    expect(getWaitingStage({ totalSeconds: 300, remainingSeconds: 60 })).toBe('arriving')
  })
})

describe('getWaitingStatus', () => {
  it('derives richer delivery status for the waiting screen', () => {
    expect(getWaitingStatus({ totalSeconds: 300, remainingSeconds: 180, totalDistanceKm: 3.6 })).toEqual({
      stage: 'delivering',
      progress: 0.4,
      remainingMinutes: 3,
      remainingDistanceKm: 2.2,
      stageLabel: '骑手正在赶来',
      routeStatus: '骑手距你还有 2.2 km',
    })
  })

  it('returns arrival-focused delivery details near completion', () => {
    expect(getWaitingStatus({ totalSeconds: 300, remainingSeconds: 30, totalDistanceKm: 3.6 })).toEqual({
      stage: 'arriving',
      progress: 0.9,
      remainingMinutes: 1,
      remainingDistanceKm: 0.4,
      stageLabel: '马上送达',
      routeStatus: '骑手距你还有 0.4 km',
    })
  })
})
