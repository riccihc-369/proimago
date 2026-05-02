import type { ShootingConditions } from '../types'

export interface FinalReadinessSummary {
  baseScoreLabel: string
  finalReadinessLabel: 'Pronto' | 'Usabile' | 'Rimandabile'
  finalReadinessTone: 'good' | 'warn' | 'bad'
  finalReadinessReason: string
}

export function getFinalReadinessSummary(
  baseScore: number,
  shootingConditions: ShootingConditions,
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
      finalReadinessReason: getUsableReason(baseScore, shootingConditions),
    }
  }

  return {
    baseScoreLabel,
    finalReadinessLabel: 'Rimandabile',
    finalReadinessTone: 'bad',
    finalReadinessReason: getRimandabileReason(baseScore, shootingConditions),
  }
}

function getUsableReason(baseScore: number, shootingConditions: ShootingConditions) {
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

function getRimandabileReason(baseScore: number, shootingConditions: ShootingConditions) {
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
