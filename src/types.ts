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

export type DetailPanelId = 'category' | 'tools'

export type SuggestionSeverity = 'info' | 'improve' | 'warning' | 'good'

export type SuggestionFamily =
  | 'composition'
  | 'light'
  | 'color'
  | 'framing'
  | 'camera'
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
  sharpness: number
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

export interface SnapshotCameraSettings {
  zoom?: number
  facingMode?: string
  width?: number
  height?: number
  frameRate?: number
}

export interface SnapshotCapturePayload {
  categoryId: PhotoCategoryId
  categoryLabel: string
  brightness: number
  contrast: number
  saturation: number
  sharpness?: number
  colorTemperatureHint?: ColorTemperatureHint
  score: number
  suggestionText: string
  suggestionFamily: SuggestionFamily
  suggestionSeverity: SuggestionSeverity
  cameraSettings?: SnapshotCameraSettings
}

export interface SnapshotItem {
  id: string
  imageDataUrl: string
  thumbnailDataUrl?: string
  createdAt: number
  categoryId: PhotoCategoryId
  categoryLabel: string
  score: number
  suggestionText: string
  suggestionFamily: SuggestionFamily
  suggestionSeverity: SuggestionSeverity
  brightness: number
  contrast: number
  saturation: number
  sharpness?: number
  colorTemperatureHint?: ColorTemperatureHint
  isFavorite: boolean
  note?: string
  cameraSettings?: SnapshotCameraSettings
}

export interface CameraNumericCapability {
  min: number
  max: number
  step: number
}

export interface CameraCapabilitiesInfo {
  zoom: CameraNumericCapability | null
  torch: boolean | null
  focusMode: string[] | null
  focusDistance: CameraNumericCapability | null
  exposureMode: string[] | null
  exposureCompensation: CameraNumericCapability | null
  whiteBalanceMode: string[] | null
  width: CameraNumericCapability | null
  height: CameraNumericCapability | null
  frameRate: CameraNumericCapability | null
}

export interface CameraSettingsInfo {
  zoom?: number | null
  torch?: boolean | null
  focusMode?: string | null
  focusDistance?: number | null
  exposureMode?: string | null
  exposureCompensation?: number | null
  whiteBalanceMode?: string | null
  width?: number | null
  height?: number | null
  frameRate?: number | null
  facingMode?: string | null
}

export interface CameraControlSupport {
  supportsZoom: boolean
  zoomMin?: number
  zoomMax?: number
  zoomStep?: number
  currentZoom?: number
  supportsTorch: boolean
  torchOn?: boolean
  supportsExposureCompensation: boolean
  exposureMin?: number
  exposureMax?: number
  exposureStep?: number
  currentExposure?: number
  supportsFocusMode: boolean
  supportedFocusModes?: string[]
  currentFocusMode?: string
  supportsFocusDistance: boolean
  focusDistanceMin?: number
  focusDistanceMax?: number
  focusDistanceStep?: number
  currentFocusDistance?: number
  supportsExposureMode: boolean
  supportedExposureModes?: string[]
  currentExposureMode?: string
  supportsWhiteBalanceMode: boolean
  supportedWhiteBalanceModes?: string[]
  currentWhiteBalanceMode?: string
  facingMode?: string
  width?: number
  height?: number
  frameRate?: number
}

export interface LensAdvice {
  id: string
  priority: number
  severity?: SuggestionSeverity
  text: string
}

export interface CameraTrackInfo {
  label: string | null
  facingMode: string | null
  capabilities: CameraCapabilitiesInfo | null
  settings: CameraSettingsInfo | null
  controlSupport: CameraControlSupport
}
