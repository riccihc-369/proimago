import type { PhotoCategory, PhotoCategoryId } from '../types'

export const PHOTO_CATEGORIES: PhotoCategory[] = [
  {
    id: 'auto',
    label: 'Auto',
    description:
      'Scegli tu la scena: PROimago aiuta a valorizzarla con regole generali. TODO: collegare una futura auto-classificazione con object detection.',
    priorityRules: ['general_composition', 'exposure_balance', 'subject_balance'],
  },
  {
    id: 'architecture',
    label: 'Architettura',
    shortLabel: 'Arch.',
    description:
      'Privilegia verticali corrette, spigoli allineati, griglia e controllo della deformazione.',
    priorityRules: ['vertical_alignment', 'edge_alignment', 'wide_angle_control'],
  },
  {
    id: 'monuments',
    label: 'Monumenti',
    shortLabel: 'Monumenti',
    description:
      'Privilegia respiro attorno al soggetto, scala leggibile, sommita non tagliata e contesto.',
    priorityRules: ['breathing_space', 'top_clearance', 'scale_reference'],
  },
  {
    id: 'portrait',
    label: 'Ritratto',
    description:
      'Privilegia volto sul terzo superiore, poco spazio sopra la testa e sfondo piu pulito.',
    priorityRules: ['upper_third_subject', 'headroom_control', 'clean_background'],
  },
  {
    id: 'landscape',
    label: 'Panorama',
    shortLabel: 'Panorama',
    description:
      "Privilegia orizzonte sui terzi, profondita, elemento di primo piano e stabilita dell'orizzonte.",
    priorityRules: ['horizon_thirds', 'foreground_anchor', 'depth_layers'],
  },
  {
    id: 'plants',
    label: 'Piante / Natura',
    shortLabel: 'Natura',
    description:
      'Privilegia isolamento del soggetto, texture leggibili e sfondo semplice.',
    priorityRules: ['subject_isolation', 'texture_light', 'background_simplicity'],
  },
  {
    id: 'animals',
    label: 'Animali',
    shortLabel: 'Animali',
    description:
      'Privilegia soggetto completo, spazio nella direzione del movimento e sfondo meno caotico.',
    priorityRules: ['movement_space', 'subject_integrity', 'background_cleanup'],
  },
  {
    id: 'product',
    label: 'Prodotto',
    description:
      'Privilegia prodotto dominante, bordi puliti, sfondo neutro e variazione tra catalogo e lifestyle.',
    priorityRules: ['frame_fill', 'edge_cleanup', 'neutral_background'],
  },
  {
    id: 'interiors',
    label: 'Interni',
    shortLabel: 'Interni',
    description:
      'Privilegia verticali corrette, diagonali della stanza e controllo della luce dalle finestre.',
    priorityRules: ['vertical_alignment', 'room_diagonals', 'window_light_balance'],
  },
  {
    id: 'food',
    label: 'Food',
    shortLabel: 'Food',
    description:
      'Privilegia luce morbida, piatto leggibile, sfondo non sporco e angoli top-down o 45 gradi.',
    priorityRules: ['soft_light', 'plate_readability', 'background_cleanup'],
  },
  {
    id: 'street',
    label: 'Street',
    shortLabel: 'Street',
    description:
      'Privilegia gesto, linee guida, profondita e soggetto fuori dal centro.',
    priorityRules: ['leading_lines', 'subject_timing', 'off_center_subject'],
  },
  {
    id: 'detail',
    label: 'Dettaglio / Texture',
    shortLabel: 'Dettaglio',
    description:
      'Privilegia riempimento del frame, pattern leggibile, parallelismo e bordi puliti.',
    priorityRules: ['frame_fill', 'surface_parallelism', 'pattern_clarity'],
  },
  {
    id: 'technical_documentation',
    label: 'Documentazione tecnica',
    shortLabel: 'Tecnica',
    description:
      "Privilegia chiarezza, elemento completo, contesto sufficiente e inclinazione minima.",
    priorityRules: ['full_subject', 'readability', 'scale_reference'],
  },
]

export const PHOTO_CATEGORY_BY_ID: Record<PhotoCategoryId, PhotoCategory> =
  PHOTO_CATEGORIES.reduce<Record<PhotoCategoryId, PhotoCategory>>((accumulator, category) => {
    accumulator[category.id] = category
    return accumulator
  }, {} as Record<PhotoCategoryId, PhotoCategory>)

export function getNextPhotoCategoryId(currentId: PhotoCategoryId): PhotoCategoryId {
  const currentIndex = PHOTO_CATEGORIES.findIndex((category) => category.id === currentId)
  if (currentIndex === -1) {
    return PHOTO_CATEGORIES[0].id
  }

  return PHOTO_CATEGORIES[(currentIndex + 1) % PHOTO_CATEGORIES.length].id
}
