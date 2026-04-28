import type { CompositionMode, FrameAnalysis, Suggestion } from '../types'

export function createSuggestion(
  mode: CompositionMode,
  analysis: FrameAnalysis,
): Suggestion {
  if (analysis.score === 0) {
    return buildSuggestion(
      'camera-start',
      'Avvia la camera per ricevere suggerimenti compositivi in tempo reale.',
      'info',
      0,
      0,
    )
  }

  const sharedSuggestion = getSharedSuggestion(analysis)
  if (sharedSuggestion) {
    return sharedSuggestion
  }

  switch (mode) {
    case 'Architettura':
      return getArchitectureSuggestion(analysis)
    case 'Ritratto':
      return getPortraitSuggestion(analysis)
    case 'Prodotto':
      return getProductSuggestion(analysis)
    case 'Paesaggio':
      return getLandscapeSuggestion(analysis)
    default:
      return buildSuggestion(
        'good-base',
        'Buona base compositiva: prova un piccolo passo laterale.',
        'good',
        24,
        2400,
      )
  }
}

function getSharedSuggestion(analysis: FrameAnalysis): Suggestion | null {
  if (analysis.isTooDark) {
    return buildSuggestion(
      'too-dark',
      'La scena e scura: cerca piu luce o cambia angolo.',
      'warning',
      100,
      0,
    )
  }

  if (analysis.isTooFlat) {
    return buildSuggestion(
      'low-contrast',
      'Contrasto basso: avvicinati a un soggetto piu definito.',
      'improve',
      84,
    )
  }

  if (analysis.isTopTooEmpty) {
    return buildSuggestion(
      'high-empty-space',
      "Abbassa leggermente l'inquadratura: c'e troppo vuoto sopra.",
      'improve',
      74,
    )
  }

  if (analysis.isTooCentral) {
    return buildSuggestion(
      'too-central',
      'Sposta il soggetto verso un terzo laterale.',
      'improve',
      68,
    )
  }

  return null
}

function getArchitectureSuggestion(analysis: FrameAnalysis): Suggestion {
  if (analysis.dominantPoint.x < 0.22 || analysis.dominantPoint.x > 0.78) {
    return buildSuggestion(
      'architecture-grid-align',
      'Allinea gli spigoli principali alla griglia.',
      'improve',
      58,
    )
  }

  if (analysis.dominantPoint.y > 0.68) {
    return buildSuggestion(
      'architecture-vertical',
      'Tieni il telefono piu verticale.',
      'improve',
      60,
    )
  }

  return buildSuggestion(
    'architecture-lens',
    'Riduci il grandangolo se deforma troppo.',
    'info',
    38,
    2400,
  )
}

function getPortraitSuggestion(analysis: FrameAnalysis): Suggestion {
  if (analysis.dominantPoint.y > 0.52) {
    return buildSuggestion(
      'portrait-upper-third',
      'Porta il volto o soggetto verso il terzo superiore.',
      'improve',
      62,
    )
  }

  return buildSuggestion(
    'portrait-headroom',
    'Riduci lo spazio sopra la testa.',
    'info',
    40,
    2400,
  )
}

function getProductSuggestion(analysis: FrameAnalysis): Suggestion {
  if (analysis.dominantSpread < 0.24) {
    return buildSuggestion(
      'product-fill-frame',
      'Avvicinati: il soggetto dovrebbe occupare piu spazio.',
      'improve',
      64,
    )
  }

  return buildSuggestion(
    'product-clean-edges',
    "Pulisci i bordi dell'inquadratura.",
    'info',
    42,
    2400,
  )
}

function getLandscapeSuggestion(analysis: FrameAnalysis): Suggestion {
  if (analysis.dominantPoint.y > 0.62 || analysis.dominantPoint.y < 0.38) {
    return buildSuggestion(
      'landscape-third-horizon',
      "Prova a mettere l'orizzonte su una linea dei terzi.",
      'improve',
      58,
    )
  }

  return buildSuggestion(
    'landscape-foreground',
    'Cerca un elemento di primo piano.',
    'info',
    36,
    2400,
  )
}

function buildSuggestion(
  id: string,
  message: string,
  severity: Suggestion['severity'],
  priority: number,
  holdMs = 2000,
): Suggestion {
  return {
    id,
    message,
    severity,
    priority,
    holdMs,
  }
}
