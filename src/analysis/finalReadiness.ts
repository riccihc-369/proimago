import type { PhotoCategoryId, ShootingConditions } from '../types'

export interface FinalReadinessSummary {
  baseScoreLabel: string
  finalReadinessLabel: 'Pronto' | 'Usabile' | 'Rimandabile'
  finalReadinessTone: 'good' | 'warn' | 'bad'
  finalReadinessReason: string
}

interface FinalReadinessContext {
  categoryId?: PhotoCategoryId
  highlightClipping?: number
  shadowClipping?: number
}

export function getFinalReadinessSummary(
  baseScore: number,
  shootingConditions: ShootingConditions,
  context: FinalReadinessContext = {},
): FinalReadinessSummary {
  const baseScoreLabel = `Base ${Math.round(baseScore)}`

  if (shootingConditions.finalShotReadiness === 'good') {
    return {
      baseScoreLabel,
      finalReadinessLabel: 'Pronto',
      finalReadinessTone: 'good',
      finalReadinessReason:
        baseScore >= 72
          ? 'Base e condizioni sono allineate per lo scatto finale.'
          : 'Condizioni buone: puoi rifinire ancora leggermente la composizione.',
    }
  }

  if (shootingConditions.finalShotReadiness === 'usable') {
    return {
      baseScoreLabel,
      finalReadinessLabel: 'Usabile',
      finalReadinessTone: 'warn',
      finalReadinessReason: getUsableReason(baseScore, shootingConditions, context),
    }
  }

  return {
    baseScoreLabel,
    finalReadinessLabel: 'Rimandabile',
    finalReadinessTone: 'bad',
    finalReadinessReason: getRimandabileReason(baseScore, shootingConditions, context),
  }
}

function getUsableReason(
  baseScore: number,
  shootingConditions: ShootingConditions,
  context: FinalReadinessContext,
) {
  const highlightReason = getHighlightReason(context, false)
  if (highlightReason) {
    return highlightReason
  }

  if (shootingConditions.lowLight) {
    return baseScore >= 72
      ? 'Composizione buona: migliora luce prima dello scatto finale.'
      : 'Base buona, ma luce non ideale.'
  }

  if (shootingConditions.harshLight) {
    return 'Base buona, ma controlla riflessi e contrasto prima dello scatto finale.'
  }

  if (shootingConditions.artificialLightLikely || shootingConditions.colorReliability !== 'good') {
    return 'Base buona, ma controlla colore e dominante prima dello scatto finale.'
  }

  if (shootingConditions.stabilityHint !== 'good') {
    return 'Base buona, ma conviene stabilizzare meglio il telefono.'
  }

  return 'Buona base di preview: rifinisci ancora un poco prima dello scatto finale.'
}

function getRimandabileReason(
  baseScore: number,
  shootingConditions: ShootingConditions,
  context: FinalReadinessContext,
) {
  const highlightReason = getHighlightReason(context, true)
  if (highlightReason) {
    return baseScore >= 72
      ? `Buona base, ma non ancora scatto finale. ${highlightReason}`
      : highlightReason
  }

  if (shootingConditions.lowLight) {
    return baseScore >= 72
      ? 'Buona base, ma non ancora scatto finale. Scena troppo scura.'
      : 'Scatto finale rimandabile: scena troppo scura.'
  }

  if (shootingConditions.stabilityHint === 'unstable') {
    return baseScore >= 72
      ? 'Buona base, ma non ancora scatto finale. Stabilita ancora insufficiente.'
      : 'Scatto finale rimandabile: stabilita ancora insufficiente.'
  }

  if (shootingConditions.colorReliability === 'low') {
    return 'Scatto finale rimandabile: colore poco affidabile.'
  }

  if (shootingConditions.harshLight) {
    return 'Scatto finale rimandabile: luce troppo dura o contrastata.'
  }

  return 'Buona base, ma non ancora scatto finale.'
}

function getHighlightReason(context: FinalReadinessContext, isRimandabile: boolean) {
  const highlightClipping = context.highlightClipping ?? 0
  const reflectiveCategory =
    context.categoryId === 'product' ||
    context.categoryId === 'food' ||
    context.categoryId === 'portrait'
  const architectureCategory =
    context.categoryId === 'architecture' || context.categoryId === 'interiors'

  if (highlightClipping >= 4 && highlightClipping >= (reflectiveCategory ? 6 : 8)) {
    if (context.categoryId === 'product') {
      return isRimandabile
        ? 'Scatto finale rimandabile: riflessi troppo forti, etichetta o superficie possono perdere dettaglio.'
        : 'Base buona, ma riflessi troppo forti: etichetta o superficie possono perdere dettaglio.'
    }

    if (reflectiveCategory) {
      return isRimandabile
        ? 'Scatto finale rimandabile: riflessi troppo forti o alte luci bruciate.'
        : 'Base buona, ma riflessi troppo forti sulle zone chiare.'
    }

    if (architectureCategory) {
      return isRimandabile
        ? 'Scatto finale rimandabile: dettagli chiari persi nelle alte luci.'
        : 'Base buona, ma alcune zone chiare stanno perdendo dettaglio.'
    }

    return isRimandabile
      ? 'Scatto finale rimandabile: alte luci bruciate.'
      : 'Base buona, ma le alte luci sono ancora troppo spinte.'
  }

  if (context.shadowClipping && context.shadowClipping >= 18) {
    return isRimandabile
      ? 'Scatto finale rimandabile: ombre troppo chiuse.'
      : 'Base buona, ma le ombre stanno chiudendo troppo dettaglio.'
  }

  return null
}
