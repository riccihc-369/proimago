export type PhotoCategoryId =
  | 'auto'
  | 'architecture'
  | 'monuments'
  | 'portrait'
  | 'landscape'
  | 'plants'
  | 'animals'
  | 'product'
  | 'interiors'
  | 'food'
  | 'street'
  | 'detail'
  | 'technical_documentation'

export interface PhotoCategory {
  id: PhotoCategoryId
  label: string
  shortLabel?: string
  description: string
  priorityRules?: string[]
}

export type CameraStatus = 'idle' | 'requesting' | 'ready'

export type HudState = 'idle' | 'controls' | 'detail'

export type DetailPanelId = 'category' | 'snapshots' | 'tools'

export type SuggestionSeverity = 'info' | 'improve' | 'warning' | 'good'

export type SuggestionFamily =
  | 'composition'
  | 'light'
  | 'color'
  | 'framing'
  | 'category'

export type ColorTemperatureHint = 'cool' | 'neutral' | 'warm'

export interface Point {
  x: number
  y: number
}

export interface DetectedSubject {
  id: string
  label: string
  confidence: number
  center: Point
  bounds?: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface FrameAnalysis {
  brightness: number
  contrast: number
  saturation: number
  colorTemperatureHint?: ColorTemperatureHint
  dominantWeight: number
  topEmptySpace: number
  score: number
  dominantPoint: Point
  dominantSpread: number
  // TODO: Populate detectedSubjects from MediaPipe/object detection in V0.2.
  detectedSubjects?: DetectedSubject[]
}

export interface Suggestion {
  id: string
  text: string
  severity: SuggestionSeverity
  family: SuggestionFamily
  priority: number
  holdMs?: number
}

export interface RenderingAdvice {
  family?: SuggestionFamily
  note?: string
  colorTemperatureHint?: ColorTemperatureHint
}

export interface SnapshotCapturePayload {
  categoryId: PhotoCategoryId
  brightness: number
  contrast: number
  saturation: number
  colorTemperatureHint?: ColorTemperatureHint
  score: number
  suggestion: Suggestion
  renderingAdvice?: RenderingAdvice
}

export interface SnapshotItem {
  id: string
  dataUrl: string
  timestamp: number
  categoryId: PhotoCategoryId
  brightness: number
  contrast: number
  saturation: number
  colorTemperatureHint?: ColorTemperatureHint
  score: number
  suggestion: Suggestion
  renderingAdvice?: RenderingAdvice
}

export interface CameraNumericCapability {
  min: number
  max: number
  step: number
}

export interface CameraCapabilitiesSummary {
  supported: boolean
  zoom: CameraNumericCapability | null
  focusMode: string[] | null
  exposureMode: string[] | null
  torch: boolean | null
  error?: string
}

export interface CameraTrackInfo {
  label: string | null
  facingMode: string | null
  capabilities: CameraCapabilitiesSummary | null
}
