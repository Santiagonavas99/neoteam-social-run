const clamp = (value: number, max: number) =>
  Number.isFinite(value) ? Math.min(max, Math.max(0, value)) : 0

export const percentToProbability = (percent: number) => clamp(percent, 100) / 100

export const probabilityToPercent = (probability: number) => Math.round(clamp(probability, 1) * 100)
