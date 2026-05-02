import { getFinalReadinessSummary } from './finalReadiness'
import type { SnapshotItem } from '../types'

export interface PreviewDecisionRank {
  previewId: string
  totalScore: number
}

export interface PreviewDecisionResult {
  bestPreviewId: string | null
  reason: string
  ranking: PreviewDecisionRank[]
}

export function decideBestPreview(previews: SnapshotItem[]): PreviewDecisionResult {
  if (previews.length === 0) {
    return {
      bestPreviewId: null,
      reason: 'Scatta qualche preview per confrontare luce, composizione e nitidezza.',
      ranking: [],
    }
  }

  const candidatePool = previews.some((preview) => preview.isFavorite)
    ? previews.filter((preview) => preview.isFavorite)
    : previews

  const ranking = candidatePool
    .map((preview) => ({
      previewId: preview.id,
      totalScore: scorePreview(preview),
    }))
    .sort((left, right) => right.totalScore - left.totalScore)

  const bestPreview = candidatePool.find((preview) => preview.id === ranking[0]?.previewId) ?? null

  return {
    bestPreviewId: bestPreview?.id ?? null,
    reason: bestPreview ? buildDecisionReason(bestPreview, previews !== candidatePool) : '',
    ranking,
  }
}

export function getReferencePreviewHint(preview: SnapshotItem) {
  if (preview.brightness < 32) {
    return 'Riprova migliorando la luce.'
  }

  if (preview.contrast < 26) {
    return 'Riprova cercando piu separazione dallo sfondo.'
  }

  if (preview.saturation < 20) {
    return 'Riprova con luce piu ricca o sfondo meno spento.'
  }

  if (preview.score < 58) {
    return 'Riprova correggendo composizione e taglio.'
  }

  return 'Riprova partendo da questa base e rifinendo piccoli aggiustamenti.'
}

function scorePreview(preview: SnapshotItem) {
  let total = preview.score * 1.12

  if (preview.finalShotReadiness === 'not_ideal') {
    total -= 20
  } else if (preview.finalShotReadiness === 'usable') {
    total -= 8
  }

  if (preview.brightness < 22) {
    total -= 18
  } else if (preview.brightness < 32) {
    total -= 8
  }

  if (preview.contrast < 20) {
    total -= 14
  } else if (preview.contrast < 30) {
    total -= 6
  }

  if (preview.saturation < 14 || preview.saturation > 82) {
    total -= 12
  } else if (preview.saturation < 22 || preview.saturation > 72) {
    total -= 5
  }

  if (typeof preview.sharpness === 'number') {
    if (preview.sharpness < 26) {
      total -= 16
    } else if (preview.sharpness < 42) {
      total -= 7
    }
  }

  if (preview.highlightClipping >= 10) {
    total -= 18
  } else if (preview.highlightClipping >= 6) {
    total -= 8
  }

  if (typeof preview.shadowClipping === 'number') {
    if (preview.shadowClipping >= 24) {
      total -= 9
    } else if (preview.shadowClipping >= 16) {
      total -= 4
    }
  }

  if (preview.shootingConditions.lowLight) {
    total -= 9
  }

  if (preview.isFavorite) {
    total += 4
  }

  return Math.round(total * 10) / 10
}

function buildDecisionReason(preview: SnapshotItem, fromFavorites: boolean) {
  const finalReadinessSummary = getFinalReadinessSummary(
    preview.score,
    preview.shootingConditions,
    {
      categoryId: preview.categoryId,
      highlightClipping: preview.highlightClipping,
      shadowClipping: preview.shadowClipping,
    },
  )
  const reasons: string[] = []

  if (preview.score >= 72 && preview.finalShotReadiness === 'not_ideal') {
    reasons.push('buona base, ma non ancora scatto finale')
  }

  if (preview.score >= 72) {
    reasons.push('composizione solida')
  }

  if (preview.brightness >= 32 && preview.brightness <= 74) {
    reasons.push('luce equilibrata')
  }

  if (preview.contrast >= 28) {
    reasons.push('contrasto leggibile')
  }

  if (typeof preview.sharpness === 'number' && preview.sharpness >= 48) {
    reasons.push('nitidezza affidabile')
  }

  if (preview.highlightClipping < 6) {
    reasons.push('alte luci piu controllate')
  }

  if (preview.finalShotReadiness === 'good') {
    reasons.push('condizioni piu affidabili')
  } else if (!preview.shootingConditions.lowLight && preview.finalShotReadiness === 'usable') {
    reasons.push('base gia usabile')
  }

  const conciseReason =
    reasons.slice(0, 2).join(' e ') || finalReadinessSummary.finalReadinessReason.toLowerCase()

  return fromFavorites
    ? `tra le preferite, ${conciseReason}`
    : conciseReason
}
