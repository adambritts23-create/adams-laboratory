// Perfectly mixed ideal KF: one mole water consumes one mole iodine (2 F).
// Delivery is prescribed, not inferred from argon flow or oven temperature.
export const FARADAY = 96485.33212
export const WATER_MOLAR_MASS = 18.01528
export const KF_DEFAULTS = { massG: 0.5, waterPpm: 600, rateUgMin: 50, maxCurrentMa: 400 }
export function kfState(config, seconds) {
  for (const key of Object.keys(KF_DEFAULTS)) {
    if (!Number.isFinite(config[key]) || config[key] <= 0) throw new Error('All inputs must be positive numbers.')
  }
  if (config.waterPpm > 1e6) throw new Error('Water content cannot exceed 1,000,000 ppm by mass.')
  if (config.maxCurrentMa > 400) throw new Error('The instrument maximum is 400 mA.')
  if (!Number.isFinite(seconds) || seconds < 0) throw new Error('Time must be finite and nonnegative.')
  const totalUg = config.massG * config.waterPpm
  const capacityUgSec = config.maxCurrentMa / 1000 * WATER_MOLAR_MASS / (2 * FARADAY) * 1e6
  const deliverySeconds = totalUg / config.rateUgMin * 60
  const finishSeconds = Math.max(deliverySeconds, totalUg / capacityUgSec)
  const deliveredUg = Math.min(totalUg, seconds * config.rateUgMin / 60)
  const measuredUg = Math.min(deliveredUg, capacityUgSec * seconds)
  const residualUg = Math.max(0, deliveredUg - measuredUg)
  const currentMa = seconds >= finishSeconds ? 0 : seconds < deliverySeconds
    ? Math.min(config.maxCurrentMa, config.rateUgMin / 60 / capacityUgSec * config.maxCurrentMa)
    : config.maxCurrentMa
  return { totalUg, deliveredUg, measuredUg, residualUg, currentMa, deliverySeconds, finishSeconds,
    remainingUg: Math.max(0, totalUg - deliveredUg),
    chargeC: measuredUg / 1e6 / WATER_MOLAR_MASS * 2 * FARADAY,
    iodineUmol: measuredUg / WATER_MOLAR_MASS,
    recoveredPpm: measuredUg / config.massG,
    dutyPercent: currentMa / config.maxCurrentMa * 100,
    complete: seconds >= finishSeconds }
}
