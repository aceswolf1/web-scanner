import type { Source } from '~/types/api.types'

export type HealthTone = 'green' | 'amber' | 'red' | 'neutral'

export interface HealthResult {
  /** Score 0–100, or null when there is no scrape history to score. */
  score: number | null
  tone: HealthTone
  label: string
}

export interface HealthInputs {
  scrapeSuccessCount?: number | null
  scrapeFailCount?: number | null
  lastSuccessAt?: string | null
  lastScrapedAt?: string | null
  lastError?: string | null
}

const MS_DAY = 24 * 60 * 60 * 1000

/**
 * healthScore = round(successRate * 70 + recencyScore * 30)
 * - successRate from success/(success+fail); 0 when no attempts
 * - recency decays: full within 24h, half by 7d, zero after 30d
 * - lastError present without a recent success nudges tone toward red
 */
export function healthScore(
  source: HealthInputs | null | undefined,
  nowMs: number = Date.now(),
): HealthResult {
  if (!source) {
    return { score: null, tone: 'neutral', label: 'No data' }
  }

  const success = Math.max(0, source.scrapeSuccessCount ?? 0)
  const fail = Math.max(0, source.scrapeFailCount ?? 0)
  const attempts = success + fail

  if (attempts === 0 && !source.lastScrapedAt && !source.lastSuccessAt) {
    return { score: null, tone: 'neutral', label: 'Unscored' }
  }

  const successRate = attempts === 0 ? 0 : success / attempts
  const anchor =
    source.lastSuccessAt ??
    (source.lastError ? null : source.lastScrapedAt) ??
    null
  const recencyScore = computeRecency(anchor, nowMs)

  const raw = successRate * 70 + recencyScore * 30
  // If there is a standing lastError and no successful scrapes, cap the score.
  const capped =
    source.lastError && success === 0 ? Math.min(raw, 35) : raw
  const score = Math.max(0, Math.min(100, Math.round(capped)))

  return {
    score,
    tone: toneFor(score, Boolean(source.lastError) && success === 0),
    label: labelFor(score),
  }
}

function computeRecency(iso: string | null | undefined, nowMs: number): number {
  if (!iso) return 0
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return 0
  const age = Math.max(0, nowMs - then)
  if (age <= MS_DAY) return 1
  if (age <= 7 * MS_DAY) {
    // Linear from 1 at 1d to 0.5 at 7d
    const t = (age - MS_DAY) / (6 * MS_DAY)
    return 1 - t * 0.5
  }
  if (age <= 30 * MS_DAY) {
    // Linear from 0.5 at 7d to 0 at 30d
    const t = (age - 7 * MS_DAY) / (23 * MS_DAY)
    return 0.5 * (1 - t)
  }
  return 0
}

function toneFor(score: number, hardFail: boolean): HealthTone {
  if (hardFail && score < 40) return 'red'
  if (score >= 70) return 'green'
  if (score >= 40) return 'amber'
  return 'red'
}

function labelFor(score: number): string {
  if (score >= 70) return 'Healthy'
  if (score >= 40) return 'Degraded'
  return 'Unhealthy'
}

/** Convenience wrapper accepting a full Source. */
export function sourceHealth(source: Source | null | undefined): HealthResult {
  return healthScore(source)
}
