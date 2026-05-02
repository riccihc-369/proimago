import type { FrameAnalysis, PhotoCategory, ShootingConditions } from '../types'

export function analyzeShootingConditions(
  frameAnalysis: FrameAnalysis,
  category: PhotoCategory,
): ShootingConditions {
  const sharpnessPriority = needsSharpnessPriority(category.id)
  const lowLightThreshold = sharpnessPriority ? 34 : 30
  const unstableSharpnessThreshold = sharpnessPriority ? 42 : 32
  const acceptableSharpnessThreshold = sharpnessPriority ? 58 : 48

  const lowLight =
    frameAnalysis.brightness < lowLightThreshold ||
    (frameAnalysis.brightness < lowLightThreshold + 6 &&
      frameAnalysis.sharpness < acceptableSharpnessThreshold)

  const harshLight =
    frameAnalysis.contrast > 66 ||
    (frameAnalysis.brightness > 78 && frameAnalysis.contrast > 52)

  const artificialLightLikely =
    frameAnalysis.colorTemperatureHint === 'warm'
      ? frameAnalysis.brightness < 60 || frameAnalysis.saturation > 62
      : frameAnalysis.colorTemperatureHint === 'cool'
        ? frameAnalysis.brightness < 64 || frameAnalysis.contrast > 48
        : false

  const colorReliability = getColorReliability(
    frameAnalysis,
    lowLight,
    harshLight,
    artificialLightLikely,
  )

  const stabilityHint =
    frameAnalysis.sharpness < unstableSharpnessThreshold ||
    (lowLight && frameAnalysis.sharpness < acceptableSharpnessThreshold - 4)
      ? 'unstable'
      : frameAnalysis.sharpness < acceptableSharpnessThreshold || lowLight
        ? 'acceptable'
        : 'good'

  const finalShotReadiness =
    stabilityHint === 'unstable' ||
    (lowLight && frameAnalysis.score < 62) ||
    colorReliability === 'low' ||
    (harshLight && frameAnalysis.score < 72)
      ? 'not_ideal'
      : lowLight ||
          harshLight ||
          artificialLightLikely ||
          stabilityHint === 'acceptable' ||
          frameAnalysis.score < 72
        ? 'usable'
        : 'good'

  return {
    lowLight,
    harshLight,
    artificialLightLikely,
    colorReliability,
    stabilityHint,
    finalShotReadiness,
  }
}

export function getShootingConditionAdvice(
  conditions: ShootingConditions,
  category: PhotoCategory,
) {
  switch (category.id) {
    case 'plants':
      if (conditions.lowLight || conditions.artificialLightLikely) {
        return 'Per piante e natura, la luce naturale laterale rendera meglio colori e texture.'
      }
      if (conditions.stabilityHint !== 'good') {
        return 'La scena sembra poco nitida: stabilizza il telefono o aumenta la luce.'
      }
      return getGenericConditionAdvice(conditions)

    case 'architecture':
    case 'interiors':
      if (conditions.harshLight) {
        return 'Bilancia zone luminose e ombre prima dello scatto finale.'
      }
      if (conditions.artificialLightLikely) {
        return 'Controlla la dominante colore: pareti e materiali potrebbero risultare falsati.'
      }
      return getGenericConditionAdvice(conditions)

    case 'product':
    case 'food':
      if (conditions.harshLight || conditions.artificialLightLikely) {
        return 'Cerca luce morbida laterale: migliora volume e colore.'
      }
      if (conditions.colorReliability === 'low') {
        return 'I colori potrebbero risultare poco fedeli.'
      }
      return getGenericConditionAdvice(conditions)

    case 'technical_documentation':
      if (conditions.lowLight) {
        return 'Per documentazione tecnica, privilegia leggibilita: aggiungi luce o avvicinati.'
      }
      if (conditions.stabilityHint !== 'good') {
        return 'Prima dello scatto finale, stabilizza il telefono.'
      }
      return getGenericConditionAdvice(conditions)

    default:
      return getGenericConditionAdvice(conditions)
  }
}

function getColorReliability(
  frameAnalysis: FrameAnalysis,
  lowLight: boolean,
  harshLight: boolean,
  artificialLightLikely: boolean,
) {
  if (
    (artificialLightLikely && harshLight) ||
    frameAnalysis.saturation < 14 ||
    frameAnalysis.saturation > 84 ||
    (lowLight && frameAnalysis.colorTemperatureHint !== 'neutral')
  ) {
    return 'low' as const
  }

  if (
    artificialLightLikely ||
    lowLight ||
    harshLight ||
    frameAnalysis.saturation < 22 ||
    frameAnalysis.saturation > 72
  ) {
    return 'medium' as const
  }

  return 'good' as const
}

function needsSharpnessPriority(categoryId: PhotoCategory['id']) {
  return (
    categoryId === 'plants' ||
    categoryId === 'detail' ||
    categoryId === 'product' ||
    categoryId === 'food' ||
    categoryId === 'technical_documentation'
  )
}

function getGenericConditionAdvice(conditions: ShootingConditions) {
  if (conditions.finalShotReadiness === 'not_ideal') {
    if (conditions.lowLight) {
      return 'Le condizioni sono ancora deboli: prova con piu luce prima dello scatto finale.'
    }

    if (conditions.harshLight) {
      return 'La luce e poco controllata: aspetta o cambia angolo prima dello scatto finale.'
    }

    return 'Prima dello scatto finale, migliora stabilita e affidabilita della luce.'
  }

  if (conditions.artificialLightLikely || conditions.colorReliability !== 'good') {
    return 'Controlla colori e dominante: la luce attuale potrebbe non essere affidabile.'
  }

  if (conditions.stabilityHint !== 'good') {
    return 'La base e usabile, ma conviene stabilizzare meglio il telefono.'
  }

  return 'Le condizioni sembrano abbastanza affidabili per uno scatto finale.'
}
