import { useEffect, useRef, useState } from 'react'
import type {
  CameraCapabilitiesSummary,
  CameraNumericCapability,
  CameraStatus,
  CameraTrackInfo,
  SnapshotCapturePayload,
  SnapshotItem,
} from '../types'

interface UseCameraResult {
  status: CameraStatus
  error: string | null
  isSupported: boolean
  cameraInfo: CameraTrackInfo | null
  startCamera: (videoElement: HTMLVideoElement | null) => Promise<void>
  stopCamera: () => void
  captureSnapshot: (
    videoElement: HTMLVideoElement | null,
    payload: SnapshotCapturePayload,
  ) => SnapshotItem | null
}

const CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  },
}

export function useCamera(): UseCameraResult {
  const streamRef = useRef<MediaStream | null>(null)
  const videoElementRef = useRef<HTMLVideoElement | null>(null)
  const [status, setStatus] = useState<CameraStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [cameraInfo, setCameraInfo] = useState<CameraTrackInfo | null>(null)

  const isSupported =
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)

  useEffect(() => {
    return () => {
      stopTracks(streamRef.current)
      clearVideoElement(videoElementRef.current)
    }
  }, [])

  const stopCamera = () => {
    stopTracks(streamRef.current)
    clearVideoElement(videoElementRef.current)
    streamRef.current = null
    setCameraInfo(null)
    setError(null)
    setStatus('idle')
  }

  const startCamera = async (videoElement: HTMLVideoElement | null) => {
    if (!isSupported) {
      setError('Camera non supportata da questo browser.')
      return
    }

    setError(null)
    setStatus('requesting')
    videoElementRef.current = videoElement

    try {
      stopTracks(streamRef.current)
      const stream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS)
      streamRef.current = stream
      setCameraInfo(readCameraTrackInfo(stream))

      if (!videoElement) {
        stopTracks(stream)
        streamRef.current = null
        setError('Video non pronto. Riprova tra un istante.')
        setStatus('idle')
        return
      }

      videoElement.srcObject = stream
      await videoElement.play()
      setStatus('ready')
    } catch (caughtError) {
      stopTracks(streamRef.current)
      streamRef.current = null
      setCameraInfo(null)
      setStatus('idle')
      setError(getCameraErrorMessage(caughtError))
    }
  }

  const captureSnapshot = (
    videoElement: HTMLVideoElement | null,
    payload: SnapshotCapturePayload,
  ): SnapshotItem | null => {
    if (!videoElement || videoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      setError('Video non ancora pronto per lo snapshot.')
      return null
    }

    const width = videoElement.videoWidth
    const height = videoElement.videoHeight
    if (!width || !height) {
      setError('Camera disponibile, ma frame non ancora leggibile.')
      return null
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')

    if (!context) {
      setError('Impossibile creare lo snapshot della camera.')
      return null
    }

    context.drawImage(videoElement, 0, 0, width, height)
    return {
      id: `${Date.now()}`,
      dataUrl: canvas.toDataURL('image/jpeg', 0.88),
      timestamp: Date.now(),
      categoryId: payload.categoryId,
      brightness: payload.brightness,
      contrast: payload.contrast,
      saturation: payload.saturation,
      colorTemperatureHint: payload.colorTemperatureHint,
      score: payload.score,
      suggestion: payload.suggestion,
      renderingAdvice: payload.renderingAdvice,
    }
  }

  return {
    status,
    error,
    isSupported,
    cameraInfo,
    startCamera,
    stopCamera,
    captureSnapshot,
  }
}

function getCameraErrorMessage(caughtError: unknown): string {
  if (caughtError instanceof DOMException) {
    if (caughtError.name === 'NotAllowedError') {
      return "Permesso camera negato. Consenti l'accesso nelle impostazioni del browser."
    }

    if (caughtError.name === 'NotFoundError' || caughtError.name === 'OverconstrainedError') {
      return 'Camera posteriore non disponibile su questo dispositivo.'
    }

    if (caughtError.name === 'NotReadableError') {
      return "La camera e occupata da un'altra app o non e accessibile."
    }
  }

  return 'Impossibile avviare la camera. Controlla permessi e disponibilita del dispositivo.'
}

function readCameraTrackInfo(stream: MediaStream): CameraTrackInfo | null {
  const track = stream.getVideoTracks()[0]
  if (!track) {
    return null
  }

  const settings = typeof track.getSettings === 'function' ? track.getSettings() : {}

  return {
    label: track.label || null,
    facingMode: typeof settings.facingMode === 'string' ? settings.facingMode : null,
    capabilities: readTrackCapabilities(track),
  }
}

function readTrackCapabilities(track: MediaStreamTrack): CameraCapabilitiesSummary {
  if (typeof track.getCapabilities !== 'function') {
    return {
      supported: false,
      zoom: null,
      focusMode: null,
      exposureMode: null,
      torch: null,
      error: 'Capabilities non esposte dal browser.',
    }
  }

  try {
    const capabilities = track.getCapabilities() as Record<string, unknown>
    return {
      supported: true,
      zoom: getNumericCapability(capabilities.zoom),
      focusMode: getStringArray(capabilities.focusMode),
      exposureMode: getStringArray(capabilities.exposureMode),
      torch: typeof capabilities.torch === 'boolean' ? capabilities.torch : null,
    }
  } catch {
    return {
      supported: false,
      zoom: null,
      focusMode: null,
      exposureMode: null,
      torch: null,
      error: 'Impossibile leggere le capabilities della camera.',
    }
  }
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

function stopTracks(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop())
}

function clearVideoElement(videoElement: HTMLVideoElement | null) {
  if (!videoElement) {
    return
  }

  videoElement.pause()
  videoElement.srcObject = null
}
