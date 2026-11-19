export type WaitingStage = 'preparing' | 'rider_assigned' | 'delivering' | 'arriving'

export type WaitingStatus = {
  stage: WaitingStage
  progress: number
  remainingMinutes: number
  remainingDistanceKm: number
  stageLabel: string
  routeStatus: string
}

export function getWaitingStage({
  totalSeconds,
  remainingSeconds,
}: {
  totalSeconds: number
  remainingSeconds: number
}): WaitingStage {
  const progress = (totalSeconds - remainingSeconds) / totalSeconds

  if (progress < 0.2) {
    return 'preparing'
  }

  if (progress < 0.4) {
    return 'rider_assigned'
  }

  if (progress < 0.75) {
    return 'delivering'
  }

  return 'arriving'
}

export function getWaitingStatus({
  totalSeconds,
  remainingSeconds,
  totalDistanceKm,
}: {
  totalSeconds: number
  remainingSeconds: number
  totalDistanceKm: number
}): WaitingStatus {
  const stage = getWaitingStage({ totalSeconds, remainingSeconds })
  const progress = Number(((totalSeconds - remainingSeconds) / totalSeconds).toFixed(1))
  const remainingMinutes = Math.max(1, Math.ceil(remainingSeconds / 60))
  const remainingDistanceKm = Number((totalDistanceKm * (remainingSeconds / totalSeconds)).toFixed(1))

  const stageLabel = {
    preparing: '商家正在备餐',
    rider_assigned: '骑手已接单',
    delivering: '骑手正在赶来',
    arriving: '马上送达',
  }[stage]

  return {
    stage,
    progress,
    remainingMinutes,
    remainingDistanceKm,
    stageLabel,
    routeStatus: `骑手距你还有 ${remainingDistanceKm.toFixed(1)} km`,
  }
}
