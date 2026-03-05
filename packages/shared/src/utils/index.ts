import type { ReputationLabel, CargoItem, GoodId } from '../types/index.js'
import { REPUTATION_THRESHOLDS } from '../constants/index.js'

export function getReputationLabel(score: number): ReputationLabel {
  if (score >= REPUTATION_THRESHOLDS.allied)   return 'Allied'
  if (score >= REPUTATION_THRESHOLDS.friendly) return 'Friendly'
  if (score >= REPUTATION_THRESHOLDS.neutral)  return 'Neutral'
  if (score >= REPUTATION_THRESHOLDS.wary)     return 'Wary'
  return 'Hostile'
}

export function getTotalCargo(cargo: CargoItem[]): number {
  return cargo.reduce((sum, item) => sum + item.quantity, 0)
}

export function getCargoItem(cargo: CargoItem[], goodId: GoodId): CargoItem | undefined {
  return cargo.find(item => item.goodId === goodId)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
