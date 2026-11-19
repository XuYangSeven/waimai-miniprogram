export type StreakState = {
  streakDays: number
  lastCompletedDate: string | null
  completedOn: string
}

function toUtcDay(value: string): number {
  return Math.floor(new Date(`${value}T00:00:00Z`).getTime() / 86_400_000)
}

export function updateStreak({ streakDays, lastCompletedDate, completedOn }: StreakState) {
  if (!lastCompletedDate) {
    return {
      streakDays: 1,
      lastCompletedDate: completedOn,
    }
  }

  const lastDay = toUtcDay(lastCompletedDate)
  const currentDay = toUtcDay(completedOn)
  const dayDiff = currentDay - lastDay

  if (dayDiff <= 0) {
    return {
      streakDays,
      lastCompletedDate,
    }
  }

  if (dayDiff === 1) {
    return {
      streakDays: streakDays + 1,
      lastCompletedDate: completedOn,
    }
  }

  return {
    streakDays: 1,
    lastCompletedDate: completedOn,
  }
}
