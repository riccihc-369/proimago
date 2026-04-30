import type {
  CameraCapabilitiesInfo,
  CameraControlSupport,
  CameraNumericCapability,
  CameraSettingsInfo,
  CameraTrackInfo,
} from '../types'

export interface CameraControlResult {
  error?: string
  ok: boolean
}

export interface CameraConstraintSet extends MediaTrackConstraintSet {
  exposureCompensation?: number
  focusMode?: string
  torch?: boolean
  zoom?: number
}

export function readCameraTrackInfo(track: MediaStreamTrack): CameraTrackInfo {
  const settings = readTrackSettings(track)
  const capabilities = readTrackCapabilities(track)

  return {
    label: track.label || null,
    facingMode: settings?.facingMode ?? null,
    capabilities,
    settings,
    controlSupport: buildCameraControlSupport(capabilities, settings),
  }
}

export function readTrackCapabilities(
  track: MediaStreamTrack,
): CameraCapabilitiesInfo | null {
  if (typeof track.getCapabilities !== 'function') {
    return null
  }

  try {
    const capabilities = track.getCapabilities() as Record<string, unknown>

    return {
      zoom: getNumericCapability(capabilities.zoom),
      torch: typeof capabilities.torch === 'boolean' ? capabilities.torch : null,
      focusMode: getStringArray(capabilities.focusMode),
      focusDistance: getNumericCapability(capabilities.focusDistance),
      exposureMode: getStringArray(capabilities.exposureMode),
      exposureCompensation: getNumericCapability(capabilities.exposureCompensation),
      whiteBalanceMode: getStringArray(capabilities.whiteBalanceMode),
      width: getNumericCapability(capabilities.width),
      height: getNumericCapability(capabilities.height),
      frameRate: getNumericCapability(capabilities.frameRate),
    }
  } catch {
    return null
  }
}

export function readTrackSettings(track: MediaStreamTrack): CameraSettingsInfo | null {
  if (typeof track.getSettings !== 'function') {
    return null
  }

  try {
    const settings = track.getSettings() as Record<string, unknown>

    return {
      zoom: getNumberValue(settings.zoom),
      torch: getBooleanValue(settings.torch),
      focusMode: getStringValue(settings.focusMode),
      focusDistance: getNumberValue(settings.focusDistance),
      exposureMode: getStringValue(settings.exposureMode),
      exposureCompensation: getNumberValue(settings.exposureCompensation),
      whiteBalanceMode: getStringValue(settings.whiteBalanceMode),
      width: getNumberValue(settings.width),
      height: getNumberValue(settings.height),
      frameRate: getNumberValue(settings.frameRate),
      facingMode: getStringValue(settings.facingMode),
    }
  } catch {
    return null
  }
}

export function buildCameraControlSupport(
  capabilities: CameraCapabilitiesInfo | null,
  settings: CameraSettingsInfo | null,
): CameraControlSupport {
  return {
    supportsZoom: Boolean(capabilities?.zoom),
    zoomMin: capabilities?.zoom?.min,
    zoomMax: capabilities?.zoom?.max,
    zoomStep: capabilities?.zoom?.step,
    currentZoom: settings?.zoom ?? undefined,
    supportsTorch: capabilities?.torch === true,
    torchOn: settings?.torch ?? undefined,
    supportsExposureCompensation: Boolean(capabilities?.exposureCompensation),
    exposureMin: capabilities?.exposureCompensation?.min,
    exposureMax: capabilities?.exposureCompensation?.max,
    exposureStep: capabilities?.exposureCompensation?.step,
    currentExposure: settings?.exposureCompensation ?? undefined,
    supportsFocusMode: Boolean(capabilities?.focusMode?.length),
    supportedFocusModes: capabilities?.focusMode ?? undefined,
    currentFocusMode: settings?.focusMode ?? undefined,
    supportsFocusDistance: Boolean(capabilities?.focusDistance),
    focusDistanceMin: capabilities?.focusDistance?.min,
    focusDistanceMax: capabilities?.focusDistance?.max,
    focusDistanceStep: capabilities?.focusDistance?.step,
    currentFocusDistance: settings?.focusDistance ?? undefined,
    supportsExposureMode: Boolean(capabilities?.exposureMode?.length),
    supportedExposureModes: capabilities?.exposureMode ?? undefined,
    currentExposureMode: settings?.exposureMode ?? undefined,
    supportsWhiteBalanceMode: Boolean(capabilities?.whiteBalanceMode?.length),
    supportedWhiteBalanceModes: capabilities?.whiteBalanceMode ?? undefined,
    currentWhiteBalanceMode: settings?.whiteBalanceMode ?? undefined,
    facingMode: settings?.facingMode ?? undefined,
    width: settings?.width ?? undefined,
    height: settings?.height ?? undefined,
    frameRate: settings?.frameRate ?? undefined,
  }
}

export async function applyAdvancedConstraint(
  track: MediaStreamTrack | null,
  constraintSet: CameraConstraintSet,
): Promise<CameraControlResult> {
  if (!track || typeof track.applyConstraints !== 'function') {
    return {
      ok: false,
      error:
        'Controllo non disponibile in questo browser. PROimago puo comunque suggerire come usare la lente o cambiare angolo.',
    }
  }

  try {
    await track.applyConstraints({
      advanced: [constraintSet],
    })

    return { ok: true }
  } catch (caughtError) {
    return {
      ok: false,
      error: getConstraintErrorMessage(caughtError),
    }
  }
}

function getConstraintErrorMessage(caughtError: unknown) {
  if (caughtError instanceof DOMException) {
    if (caughtError.name === 'OverconstrainedError') {
      return 'Il controllo richiesto non e supportato dalla camera attiva.'
    }

    if (caughtError.name === 'NotReadableError') {
      return 'La camera non puo applicare questo controllo in questo momento.'
    }
  }

  return 'Impossibile applicare il controllo camera richiesto.'
}

function getNumericCapability(value: unknown): CameraNumericCapability | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const maybeRange = value as Record<string, unknown>
  if (
    typeof maybeRange.min !== 'number' ||
    typeof maybeRange.max !== 'number' ||
    typeof maybeRange.step !== 'number'
  ) {
    return null
  }

  return {
    min: maybeRange.min,
    max: maybeRange.max,
    step: maybeRange.step,
  }
}

function getStringArray(value: unknown): string[] | null {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }

  if (typeof value === 'string') {
    return [value]
  }

  return null
}

function getStringValue(value: unknown) {
  return typeof value === 'string' ? value : null
}

function getNumberValue(value: unknown) {
  return typeof value === 'number' ? value : null
}

function getBooleanValue(value: unknown) {
  return typeof value === 'boolean' ? value : null
}
