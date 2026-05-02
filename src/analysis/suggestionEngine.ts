import type {
  CameraStatus,
  FrameAnalysis,
  LensAdvice,
  PhotoCategory,
  Suggestion,
  SuggestionFamily,
} from '../types'

export function createSuggestion(
  category: PhotoCategory,
  analysis: FrameAnalysis,
  cameraStatus?: CameraStatus,
): Suggestion {
  if (cameraStatus !== 'ready' || analysis.score === 0) {
    return buildSuggestion(
      'camera-start',
      'Scegli cosa vuoi rappresentare e avvia la camera per iniziare.',
      'info',
      'category',
      0,
      0,
    )
  }

  const sharpnessSuggestion = getSharpnessSuggestion(category, analysis)
  const generalSuggestion = getGeneralSuggestion(category, analysis)
  const categorySuggestion = getCategorySuggestion(category, analysis)
  const cameraAdviceSuggestion = getCameraAdviceSuggestion(category, analysis)

  const prioritizedSuggestion = pickHighestPrioritySuggestion(
    sharpnessSuggestion,
    generalSuggestion,
    categorySuggestion,
    cameraAdviceSuggestion,
  )

  if (prioritizedSuggestion) {
    return prioritizedSuggestion
  }

  return buildSuggestion(
    `good-${category.id}`,
    'Buona base compositiva: prova un piccolo passo laterale per rifinire lo scatto.',
    'good',
    'composition',
    24,
    2400,
  )
}

function getSharpnessSuggestion(
  category: PhotoCategory,
  analysis: FrameAnalysis,
): Suggestion | null {
  const isCriticalCategory = needsSharpnessPriority(category.id)
  const warningThreshold = isCriticalCategory ? 36 : 28
  const improveThreshold = isCriticalCategory ? 54 : 44

  if (analysis.sharpness <= warningThreshold) {
    return buildSuggestion(
      `sharpness-warning-${category.id}`,
      'La scena sembra poco nitida: stabilizza il telefono prima di scattare.',
      'warning',
      'framing',
      isCriticalCategory ? 96 : 92,
      3200,
    )
  }

  if (analysis.sharpness <= improveThreshold) {
    return buildSuggestion(
      `sharpness-improve-${category.id}`,
      "Tieni fermo il telefono e lascia stabilizzare l'inquadratura.",
      'improve',
      'framing',
      isCriticalCategory ? 82 : 72,
      2800,
    )
  }

  return null
}

function getGeneralSuggestion(
  category: PhotoCategory,
  analysis: FrameAnalysis,
): Suggestion | null {
  if (analysis.highlightClipping >= 8 && category.id !== 'product') {
    return buildSuggestion(
      'general-highlights-clipped',
      'Le alte luci sono troppo forti: cambia angolo o riduci i riflessi diretti.',
      'warning',
      'light',
      98,
      2600,
    )
  }

  if (analysis.brightness > 84 && analysis.contrast < 30) {
    return buildSuggestion(
      'general-bright-scene',
      'La scena sembra troppo forte o bruciata: cambia angolo o riduci i riflessi diretti.',
      'warning',
      'light',
      98,
      2600,
    )
  }

  if (analysis.brightness < 28) {
    return buildSuggestion(
      'general-low-light',
      'La scena e scura: cerca piu luce o cambia angolo prima di scattare.',
      'warning',
      'light',
      100,
      0,
    )
  }

  if (analysis.contrast < 22) {
    return buildSuggestion(
      'general-low-contrast',
      'Contrasto basso: cerca luce laterale, uno sfondo piu leggibile o un soggetto piu definito.',
      'improve',
      'light',
      88,
    )
  }

  if (analysis.saturation < 14) {
    return buildSuggestion(
      'general-low-saturation',
      'Saturazione bassa: cerca luce migliore o un angolo con colori piu ricchi.',
      'improve',
      'color',
      34,
    )
  }

  if (analysis.saturation > 82) {
    return buildSuggestion(
      'general-high-saturation',
      'I colori sono troppo aggressivi: evita luce artificiale o sfondi cromaticamente invadenti.',
      'improve',
      'color',
      30,
    )
  }

  if (isTooCentral(analysis) && !allowsCenteredComposition(category.id)) {
    return buildSuggestion(
      'general-third-balance',
      'Sposta il soggetto verso un terzo laterale.',
      'improve',
      'composition',
      74,
    )
  }

  return null
}

function getCameraAdviceSuggestion(
  category: PhotoCategory,
  analysis: FrameAnalysis,
): Suggestion | null {
  const advice = getLensAdvice(category, analysis)
  if (!advice) {
    return null
  }

  return buildSuggestion(
    `camera-${category.id}-${advice.id}`,
    advice.text,
    advice.severity ?? 'info',
    'camera',
    advice.priority,
    2600,
  )
}

function getCategorySuggestion(
  category: PhotoCategory,
  analysis: FrameAnalysis,
): Suggestion | null {
  switch (category.id) {
    case 'architecture':
      return getArchitectureSuggestion(analysis)
    case 'monuments':
      return getMonumentsSuggestion(analysis)
    case 'portrait':
      return getPortraitSuggestion(analysis)
    case 'landscape':
      return getLandscapeSuggestion(analysis)
    case 'plants':
      return getPlantsSuggestion(analysis)
    case 'animals':
      return getAnimalsSuggestion(analysis)
    case 'product':
      return getProductSuggestion(analysis)
    case 'interiors':
      return getInteriorsSuggestion(analysis)
    case 'food':
      return getFoodSuggestion(analysis)
    case 'street':
      return getStreetSuggestion(analysis)
    case 'detail':
      return getDetailSuggestion(analysis)
    case 'technical_documentation':
      return getTechnicalDocumentationSuggestion(analysis)
    case 'auto':
      return getAutoSuggestion(analysis)
    default:
      return null
  }
}

function getAutoSuggestion(analysis: FrameAnalysis): Suggestion {
  // TODO: Sostituire questa logica con una futura auto-classificazione della scena in V0.2.
  if (analysis.topEmptySpace > 62) {
    return buildSuggestion(
      'auto-top-space',
      "Riduci lo spazio vuoto in alto se non aiuta la scena.",
      'improve',
      'framing',
      62,
    )
  }

  if (analysis.dominantSpread < 0.24) {
    return buildSuggestion(
      'auto-step-closer',
      'Avvicinati leggermente per dare piu presenza al soggetto principale.',
      'improve',
      'framing',
      56,
    )
  }

  if (analysis.colorTemperatureHint === 'warm' && analysis.saturation > 70) {
    return buildSuggestion(
      'auto-color-balance',
      'La dominante calda e forte: prova una luce piu neutra o uno sfondo meno acceso.',
      'improve',
      'color',
      48,
    )
  }

  return buildSuggestion(
    'auto-balance',
    'PROimago consiglia come valorizzare la scena scelta: prova un piccolo aggiustamento laterale.',
    'good',
    'category',
    24,
    2400,
  )
}

function getLensAdvice(
  category: PhotoCategory,
  analysis: FrameAnalysis,
): LensAdvice | null {
  switch (category.id) {
    case 'architecture':
      if (analysis.dominantSpread > 0.33) {
        return buildLensAdvice(
          'architecture-1x',
          'Arretra e usa 1x per mantenere proporzioni piu credibili.',
          52,
          'improve',
        )
      }

      if (analysis.dominantPoint.y > 0.62) {
        return buildLensAdvice(
          'architecture-05x-vertical',
          'Se devi usare 0.5x, tieni il telefono perfettamente verticale.',
          46,
        )
      }

      return buildLensAdvice(
        'architecture-ultrawide',
        'Evita il grandangolo estremo se deforma gli spigoli.',
        42,
      )
    case 'interiors':
      if (analysis.dominantSpread > 0.32) {
        return buildLensAdvice(
          'interiors-1x',
          'Arretra e usa 1x per mantenere proporzioni piu credibili.',
          50,
          'improve',
        )
      }

      if (analysis.dominantPoint.y > 0.62) {
        return buildLensAdvice(
          'interiors-05x-vertical',
          'Se devi usare 0.5x, tieni il telefono perfettamente verticale.',
          44,
        )
      }

      return buildLensAdvice(
        'interiors-ultrawide',
        'Evita il grandangolo estremo se deforma gli spigoli.',
        40,
      )
    case 'portrait':
      if (analysis.dominantSpread > 0.34) {
        return buildLensAdvice(
          'portrait-avoid-wide',
          'Evita il grandangolo vicino al volto: puo deformare i lineamenti.',
          50,
          'improve',
        )
      }

      return buildLensAdvice(
        'portrait-2x',
        'Usa 2x se disponibile per isolare meglio il volto.',
        42,
      )
    case 'product':
      if (analysis.dominantSpread < 0.28 || analysis.backgroundClutter > 58) {
        return buildLensAdvice(
          'product-2x',
          'Se il prodotto e piccolo, avvicinati o usa 2x se disponibile.',
          50,
          'improve',
        )
      }

      if (analysis.highlightClipping >= 6) {
        return buildLensAdvice(
          'product-side-light',
          'Per oggetti lucidi, evita luce diretta frontale.',
          48,
          'improve',
        )
      }

      if (analysis.brightness < 38) {
        return buildLensAdvice(
          'product-flash',
          'Evita flash diretto: cerca luce laterale morbida.',
          48,
          'improve',
        )
      }

      return buildLensAdvice(
        'product-1x-2x',
        'Usa 1x o 2x per ridurre deformazioni del prodotto.',
        44,
      )
    case 'plants':
      if (analysis.contrast > 72 || analysis.brightness > 74) {
        return buildLensAdvice(
          'plants-side-light',
          'Evita luce frontale troppo dura: cerca luce laterale.',
          44,
          'improve',
        )
      }

      return buildLensAdvice(
        'plants-normal-2x',
        'Avvicinati con lente normale o 2x per isolare texture e foglie.',
        40,
      )
    case 'technical_documentation':
      if (analysis.brightness < 34 || analysis.sharpness < 46) {
        return buildLensAdvice(
          'technical-torch',
          'Usa la luce continua solo se il dettaglio e poco leggibile.',
          48,
          'improve',
        )
      }

      return buildLensAdvice(
        'technical-front',
        "Mantieni la lente stabile e frontale rispetto all'elemento tecnico.",
        44,
      )
    case 'landscape':
      if (analysis.dominantSpread < 0.24) {
        return buildLensAdvice(
          'landscape-foreground',
          'Cerca un primo piano se usi 0.5x.',
          42,
        )
      }

      return buildLensAdvice(
        'landscape-wide',
        'Il grandangolo va bene se aggiunge profondita, ma evita bordi deformati.',
        38,
      )
    case 'animals':
      if (analysis.dominantSpread < 0.26 || analysis.dominantWeight < 42) {
        return buildLensAdvice(
          'animals-zoom',
          "Usa zoom invece di avvicinarti troppo all'animale.",
          46,
          'improve',
        )
      }

      return buildLensAdvice(
        'animals-space',
        "Lascia spazio nella direzione dello sguardo o del movimento.",
        40,
      )
    default:
      return null
  }
}

function getArchitectureSuggestion(analysis: FrameAnalysis): Suggestion {
  if (analysis.dominantPoint.y > 0.66) {
    return buildSuggestion(
      'architecture-vertical',
      'Tieni il telefono piu verticale.',
      'improve',
      'framing',
      68,
    )
  }

  if (isTooCentral(analysis) || isEdgeHeavy(analysis)) {
    return buildSuggestion(
      'architecture-grid',
      'Allinea gli spigoli principali alla griglia.',
      'improve',
      'composition',
      64,
    )
  }

  if (analysis.dominantSpread < 0.24) {
    return buildSuggestion(
      'architecture-wide-angle',
      'Arretra invece di usare troppo grandangolo.',
      'info',
      'framing',
      58,
    )
  }

  return buildSuggestion(
    'architecture-light',
    'Cerca luce laterale per leggere meglio volumi e materiali.',
    'info',
    'light',
    50,
  )
}

function getMonumentsSuggestion(analysis: FrameAnalysis): Suggestion {
  if (analysis.dominantSpread > 0.34) {
    return buildSuggestion(
      'monuments-space',
      'Lascia piu respiro attorno al monumento.',
      'improve',
      'framing',
      62,
    )
  }

  if (analysis.dominantPoint.y < 0.36) {
    return buildSuggestion(
      'monuments-top',
      'Evita di tagliare la sommita.',
      'warning',
      'framing',
      72,
    )
  }

  if (analysis.topEmptySpace > 62) {
    return buildSuggestion(
      'monuments-scale',
      'Inserisci un elemento di scala.',
      'info',
      'category',
      50,
    )
  }

  return buildSuggestion(
    'monuments-light',
    'Prova una luce laterale per dare piu profondita.',
    'info',
    'light',
    46,
  )
}

function getPortraitSuggestion(analysis: FrameAnalysis): Suggestion {
  if (analysis.dominantPoint.y > 0.54) {
    return buildSuggestion(
      'portrait-eyes',
      'Porta volto o occhi verso il terzo superiore.',
      'improve',
      'composition',
      66,
    )
  }

  if (analysis.topEmptySpace > 60) {
    return buildSuggestion(
      'portrait-headroom',
      'Riduci lo spazio sopra la testa.',
      'improve',
      'framing',
      64,
    )
  }

  if (analysis.brightness < 42 || analysis.contrast < 28) {
    return buildSuggestion(
      'portrait-soft-light',
      'Cerca luce morbida sul volto.',
      'improve',
      'light',
      58,
    )
  }

  return buildSuggestion(
    'portrait-background',
    'Evita colori troppo aggressivi dietro al soggetto.',
    analysis.saturation > 72 ? 'improve' : 'info',
    'color',
    46,
  )
}

function getLandscapeSuggestion(analysis: FrameAnalysis): Suggestion {
  if (analysis.dominantPoint.y > 0.62 || analysis.dominantPoint.y < 0.38) {
    return buildSuggestion(
      'landscape-horizon',
      "Prova a mettere l'orizzonte su una linea dei terzi.",
      'improve',
      'composition',
      64,
    )
  }

  if (analysis.dominantSpread < 0.24) {
    return buildSuggestion(
      'landscape-foreground',
      'Cerca un elemento di primo piano.',
      'improve',
      'category',
      58,
    )
  }

  if (analysis.topEmptySpace > 62) {
    return buildSuggestion(
      'landscape-sky',
      'Riduci cielo vuoto se non aggiunge atmosfera.',
      'improve',
      'framing',
      54,
    )
  }

  return buildSuggestion(
    'landscape-light',
    'Cerca luce laterale per dare profondita al paesaggio.',
    'info',
    'light',
    46,
  )
}

function getPlantsSuggestion(analysis: FrameAnalysis): Suggestion {
  if (analysis.dominantSpread < 0.24) {
    return buildSuggestion(
      'plants-step-closer',
      'Avvicinati alla pianta e semplifica lo sfondo.',
      'improve',
      'framing',
      60,
    )
  }

  if (analysis.contrast < 30) {
    return buildSuggestion(
      'plants-light',
      'Cerca luce laterale sulle texture.',
      'info',
      'light',
      54,
    )
  }

  if (isEdgeHeavy(analysis)) {
    return buildSuggestion(
      'plants-crop',
      'Evita di tagliare la foglia principale.',
      'warning',
      'framing',
      62,
    )
  }

  return buildSuggestion(
    'plants-isolation',
    "Sposta leggermente l'inquadratura per isolare meglio il soggetto.",
    'improve',
    'composition',
    44,
  )
}

function getAnimalsSuggestion(analysis: FrameAnalysis): Suggestion {
  if (isTooCentral(analysis)) {
    return buildSuggestion(
      'animals-space',
      "Lascia spazio nella direzione dello sguardo dell'animale.",
      'improve',
      'composition',
      62,
    )
  }

  if (analysis.dominantSpread < 0.24) {
    return buildSuggestion(
      'animals-zoom',
      'Usa piu zoom invece di avvicinarti troppo.',
      'info',
      'framing',
      58,
    )
  }

  if (isEdgeHeavy(analysis)) {
    return buildSuggestion(
      'animals-crop',
      'Evita di tagliare zampe, orecchie o coda.',
      'warning',
      'framing',
      70,
    )
  }

  return buildSuggestion(
    'animals-background',
    "Semplifica lo sfondo dietro l'animale.",
    'improve',
    'category',
    44,
  )
}

function getProductSuggestion(analysis: FrameAnalysis): Suggestion {
  if (analysis.highlightClipping >= 10) {
    return buildSuggestion(
      'product-specular-hotspots',
      'Riflesso troppo forte: sposta la luce lateralmente o inclina leggermente il prodotto.',
      'warning',
      'light',
      92,
      3200,
    )
  }

  if (analysis.highlightClipping >= 7 && analysis.contrast >= 52) {
    return buildSuggestion(
      'product-label-legibility',
      "L'etichetta perde leggibilita: riduci il riflesso frontale.",
      'warning',
      'light',
      88,
      3200,
    )
  }

  if (analysis.highlightClipping >= 6) {
    return buildSuggestion(
      'product-glossy-surface',
      'Per oggetti lucidi, evita luce diretta frontale.',
      'improve',
      'light',
      82,
      3000,
    )
  }

  if (analysis.backgroundClutter > 72 && analysis.dominantWeight < 48) {
    return buildSuggestion(
      'product-surface-cleanup',
      'Pulisci la superficie attorno al prodotto.',
      'warning',
      'category',
      72,
    )
  }

  if (analysis.backgroundClutter > 62) {
    return buildSuggestion(
      'product-background-dominance',
      'Semplifica lo sfondo: il prodotto deve dominare.',
      'warning',
      'category',
      70,
    )
  }

  if (analysis.contrast > 72 && analysis.brightness > 62) {
    return buildSuggestion(
      'product-reflections',
      "Evita riflessi diretti sull'etichetta.",
      'improve',
      'light',
      66,
    )
  }

  if (analysis.brightness < 48 || analysis.contrast < 28) {
    return buildSuggestion(
      'product-soft-side-light',
      'Usa luce laterale morbida per mantenere volume e colore.',
      'improve',
      'light',
      68,
    )
  }

  if (analysis.dominantSpread < 0.24 || analysis.dominantWeight < 42) {
    return buildSuggestion(
      'product-fill',
      'Se il prodotto e piccolo, avvicinati o usa 2x se disponibile.',
      'improve',
      'framing',
      64,
    )
  }

  if (isEdgeHeavy(analysis) || analysis.backgroundClutter > 54) {
    return buildSuggestion(
      'product-edges',
      'Riduci elementi secondari ai bordi.',
      'improve',
      'framing',
      60,
    )
  }

  if (analysis.saturation > 72 || analysis.colorTemperatureHint !== 'neutral') {
    return buildSuggestion(
      'product-color',
      'Controlla la luce: il colore del prodotto deve restare credibile.',
      'improve',
      'color',
      56,
    )
  }

  return buildSuggestion(
    'product-background',
    'Pulisci la superficie e riduci elementi ai bordi.',
    'info',
    'category',
    46,
  )
}

function getInteriorsSuggestion(analysis: FrameAnalysis): Suggestion {
  if (analysis.dominantPoint.y > 0.66) {
    return buildSuggestion(
      'interiors-vertical',
      'Tieni il telefono piu verticale.',
      'improve',
      'framing',
      64,
    )
  }

  if (analysis.dominantSpread < 0.24) {
    return buildSuggestion(
      'interiors-wide-angle',
      "Evita il grandangolo estremo se deforma gli angoli.",
      'info',
      'framing',
      58,
    )
  }

  if (analysis.dominantPoint.x > 0.38 && analysis.dominantPoint.x < 0.62) {
    return buildSuggestion(
      'interiors-diagonal',
      'Cerca una diagonale della stanza.',
      'info',
      'composition',
      46,
    )
  }

  return buildSuggestion(
    'interiors-light-balance',
    'Bilancia luce finestra e zone scure.',
    'improve',
    'light',
    50,
  )
}

function getFoodSuggestion(analysis: FrameAnalysis): Suggestion {
  if (analysis.brightness < 42 || analysis.contrast < 26) {
    return buildSuggestion(
      'food-soft-light',
      'Cerca luce laterale morbida.',
      'improve',
      'light',
      62,
    )
  }

  if (analysis.dominantSpread < 0.24) {
    return buildSuggestion(
      'food-step-closer',
      'Avvicinati al piatto e riduci lo sfondo.',
      'improve',
      'framing',
      58,
    )
  }

  if (analysis.dominantPoint.y > 0.6 || analysis.dominantPoint.x > 0.62) {
    return buildSuggestion(
      'food-angle',
      "Prova una vista dall'alto o a 45 gradi.",
      'info',
      'category',
      50,
    )
  }

  return buildSuggestion(
    'food-shadows',
    'Evita ombre dure sul cibo.',
    analysis.contrast > 72 ? 'improve' : 'info',
    'light',
    44,
  )
}

function getStreetSuggestion(analysis: FrameAnalysis): Suggestion {
  if (analysis.dominantSpread < 0.24) {
    return buildSuggestion(
      'street-lines',
      'Cerca una linea guida nella strada.',
      'info',
      'composition',
      56,
    )
  }

  if (analysis.dominantPoint.x < 0.32 || analysis.dominantPoint.x > 0.68) {
    return buildSuggestion(
      'street-space',
      'Lascia spazio davanti al soggetto.',
      'improve',
      'framing',
      58,
    )
  }

  if (isTooCentral(analysis)) {
    return buildSuggestion(
      'street-third',
      'Sposta il soggetto su un terzo laterale.',
      'improve',
      'composition',
      54,
    )
  }

  return buildSuggestion(
    'street-timing',
    'Aspetta un gesto o un passaggio piu interessante.',
    'good',
    'category',
    38,
    2400,
  )
}

function getDetailSuggestion(analysis: FrameAnalysis): Suggestion {
  if (analysis.dominantSpread < 0.3) {
    return buildSuggestion(
      'detail-fill',
      'Avvicinati e riempi meglio il frame.',
      'improve',
      'framing',
      62,
    )
  }

  if (isTooCentral(analysis)) {
    return buildSuggestion(
      'detail-parallel',
      'Mantieni il telefono parallelo alla superficie.',
      'info',
      'framing',
      54,
    )
  }

  if (analysis.contrast < 32) {
    return buildSuggestion(
      'detail-light',
      'Cerca luce radente per far emergere la texture.',
      'info',
      'light',
      52,
    )
  }

  return buildSuggestion(
    'detail-edges',
    'Elimina elementi disturbanti ai bordi.',
    'improve',
    'framing',
    46,
  )
}

function getTechnicalDocumentationSuggestion(analysis: FrameAnalysis): Suggestion {
  if (isEdgeHeavy(analysis)) {
    return buildSuggestion(
      'technical-full',
      "Inquadra tutto l'elemento tecnico senza tagliarlo.",
      'warning',
      'framing',
      72,
    )
  }

  if (analysis.dominantSpread < 0.24) {
    return buildSuggestion(
      'technical-context',
      'Mantieni contesto sufficiente per capire dove si trova.',
      'info',
      'category',
      54,
    )
  }

  if (analysis.dominantPoint.y > 0.66 || isTooCentral(analysis)) {
    return buildSuggestion(
      'technical-readability',
      'Evita inclinazioni: la foto deve essere leggibile.',
      'improve',
      'framing',
      58,
    )
  }

  return buildSuggestion(
    'technical-scale',
    'Aggiungi un riferimento di scala se possibile.',
    'info',
    'category',
    42,
    2400,
  )
}

function buildLensAdvice(
  id: string,
  text: string,
  priority: number,
  severity?: LensAdvice['severity'],
): LensAdvice {
  return {
    id,
    text,
    priority,
    severity,
  }
}

function allowsCenteredComposition(categoryId: PhotoCategory['id']) {
  return categoryId === 'product' || categoryId === 'technical_documentation'
}

function needsSharpnessPriority(categoryId: PhotoCategory['id']) {
  return (
    categoryId === 'plants' ||
    categoryId === 'detail' ||
    categoryId === 'product' ||
    categoryId === 'technical_documentation'
  )
}

function isTooCentral(analysis: FrameAnalysis) {
  return getCenterDistance(analysis) < 0.16
}

function isEdgeHeavy(analysis: FrameAnalysis) {
  return (
    analysis.dominantPoint.x < 0.2 ||
    analysis.dominantPoint.x > 0.8 ||
    analysis.dominantPoint.y < 0.22 ||
    analysis.dominantPoint.y > 0.78
  )
}

function getCenterDistance(analysis: FrameAnalysis) {
  return Math.hypot(analysis.dominantPoint.x - 0.5, analysis.dominantPoint.y - 0.5)
}

function pickHighestPrioritySuggestion(
  ...candidates: Array<Suggestion | null>
) {
  return candidates.reduce<Suggestion | null>((selectedSuggestion, candidate) => {
    if (!candidate) {
      return selectedSuggestion
    }

    if (!selectedSuggestion || candidate.priority > selectedSuggestion.priority) {
      return candidate
    }

    return selectedSuggestion
  }, null)
}

function buildSuggestion(
  id: string,
  text: string,
  severity: Suggestion['severity'],
  family: SuggestionFamily,
  priority: number,
  holdMs = 2000,
): Suggestion {
  return {
    id,
    text,
    severity,
    family,
    priority,
    holdMs,
  }
}
