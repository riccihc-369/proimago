export type CompositionMode =
  | 'Auto'
  | 'Architettura'
  | 'Ritratto'
  | 'Prodotto'
  | 'Paesaggio'

export type AppMode = CompositionMode

export type CameraStatus = 'idle' | 'requesting' | 'ready'

export type SuggestionSeverity = 'info' | 'improve' | 'warning' | 'good'

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
  brightnessPercent: number
  contrast: number
  dominantPoint: Point
  dominantSpread: number
  isTooCentral: boolean
  topEmptyRatio: number
  isTopTooEmpty: boolean
  isTooDark: boolean
  isTooFlat: boolean
  score: number
  // TODO: Populate detectedSubjects from MediaPipe/object detection in V0.2.
  detectedSubjects?: DetectedSubject[]
}

export type AnalysisResult = FrameAnalysis

export interface Suggestion {
  id: string
  message: string
  severity: SuggestionSeverity
  priority: number
  holdMs?: number
}

export interface SnapshotCapturePayload {
  mode: CompositionMode
  score: number
  suggestion: Suggestion
}

export interface SnapshotItem {
  id: string
  dataUrl: string
  timestamp: number
  mode: CompositionMode
  score: number
  suggestion: Suggestion
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
