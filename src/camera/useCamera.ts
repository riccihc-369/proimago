import { useEffect, useRef, useState } from 'react'
import {
  applyAdvancedConstraint,
  type CameraConstraintSet,
  type CameraControlResult,
  readCameraTrackInfo,
} from './cameraCapabilities'
import type {
  CameraStatus,
  CameraSettingsInfo,
  CameraTrackInfo,
  SnapshotCapturePayload,
  SnapshotCameraSettings,
  SnapshotItem,
} from '../types'

interface UseCameraResult {
  status: CameraStatus
  error: string | null
  isSupported: boolean
  cameraInfo: CameraTrackInfo | null
  startCamera: (videoElement: HTMLVideoElement | null) => Promise<void>
  stopCamera: () => void
  setZoom: (value: number) => Promise<CameraControlResult>
  setTorch: (on: boolean) => Promise<CameraControlResult>
  setExposureCompensation: (value: number) => Promise<CameraControlResult>
  setFocusMode: (mode: string) => Promise<CameraControlResult>
  resetCameraControls: () => Promise<CameraControlResult>
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
  const initialSettingsRef = useRef<CameraSettingsInfo | null>(null)
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
    initialSettingsRef.current = null
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
      const trackInfo = readActiveTrackInfo(stream)
      initialSettingsRef.current = trackInfo?.settings ?? null
      setCameraInfo(trackInfo)

      if (!videoElement) {
        stopTracks(stream)
        streamRef.current = null
        initialSettingsRef.current = null
        setError('Video non pronto. Riprova tra un istante.')
        setStatus('idle')
        return
      }

      videoElement.srcObject = stream
      await videoElement.play()
      const refreshedTrackInfo = readActiveTrackInfo(stream)
      if (refreshedTrackInfo) {
        initialSettingsRef.current = refreshedTrackInfo.settings ?? initialSettingsRef.current
        setCameraInfo(refreshedTrackInfo)
      }
      setStatus('ready')
    } catch (caughtError) {
      stopTracks(streamRef.current)
      streamRef.current = null
      initialSettingsRef.current = null
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
    const thumbnailDataUrl = createSnapshotThumbnail(canvas, width, height)
    const cameraSettings = payload.cameraSettings ?? getSnapshotCameraSettings(cameraInfo)
    const createdAt = Date.now()

    return {
      id: `${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
      imageDataUrl: canvas.toDataURL('image/jpeg', 0.75),
      thumbnailDataUrl,
      createdAt,
      categoryId: payload.categoryId,
      categoryLabel: payload.categoryLabel,
      score: payload.score,
      suggestionText: payload.suggestionText,
      suggestionFamily: payload.suggestionFamily,
      suggestionSeverity: payload.suggestionSeverity,
      brightness: payload.brightness,
      contrast: payload.contrast,
      saturation: payload.saturation,
      sharpness: payload.sharpness,
      colorTemperatureHint: payload.colorTemperatureHint,
      isFavorite: false,
      note: undefined,
      cameraSettings,
    }
  }

  const setZoom = async (value: number) => {
    if (!cameraInfo?.controlSupport.supportsZoom) {
      return getUnsupportedControlResult()
    }

    return applyCameraConstraint({ zoom: value })
  }

  const setTorch = async (on: boolean) => {
    if (!cameraInfo?.controlSupport.supportsTorch) {
      return getUnsupportedControlResult()
    }

    return applyCameraConstraint({ torch: on })
  }

  const setExposureCompensation = async (value: number) => {
    if (!cameraInfo?.controlSupport.supportsExposureCompensation) {
      return getUnsupportedControlResult()
    }

    return applyCameraConstraint({ exposureCompensation: value })
  }

  const setFocusMode = async (mode: string) => {
    if (!cameraInfo?.controlSupport.supportsFocusMode) {
      return getUnsupportedControlResult()
    }

    return applyCameraConstraint({ focusMode: mode })
  }

  const resetCameraControls = async () => {
    const initialSettings = initialSettingsRef.current
    const controlSupport = cameraInfo?.controlSupport

    if (!controlSupport || !initialSettings) {
      return {
        ok: false,
        error:
          'Nessun controllo camera disponibile da ripristinare in questo momento.',
      }
    }

    const resetConstraints: CameraConstraintSet = {}

    if (controlSupport.supportsZoom && typeof initialSettings.zoom === 'number') {
      resetConstraints.zoom = initialSettings.zoom
    }

    if (controlSupport.supportsTorch && typeof initialSettings.torch === 'boolean') {
      resetConstraints.torch = initialSettings.torch
    }

    if (
      controlSupport.supportsExposureCompensation &&
      typeof initialSettings.exposureCompensation === 'number'
    ) {
      resetConstraints.exposureCompensation = initialSettings.exposureCompensation
    }

    if (controlSupport.supportsFocusMode && typeof initialSettings.focusMode === 'string') {
      resetConstraints.focusMode = initialSettings.focusMode
    }

    if (Object.keys(resetConstraints).length === 0) {
      return {
        ok: false,
        error:
          'La camera non espone controlli ripristinabili in questo browser.',
      }
    }

    return applyCameraConstraint(resetConstraints)
  }

  async function applyCameraConstraint(constraintSet: CameraConstraintSet) {
    const track = getActiveTrack(streamRef.current)
    const result = await applyAdvancedConstraint(track, constraintSet)

    if (result.ok) {
      const refreshedTrackInfo = track ? readCameraTrackInfo(track) : null
      setCameraInfo(refreshedTrackInfo)
    }

    return result
  }

  return {
    status,
    error,
    isSupported,
    cameraInfo,
    startCamera,
    stopCamera,
    setZoom,
    setTorch,
    setExposureCompensation,
    setFocusMode,
    resetCameraControls,
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

function readActiveTrackInfo(stream: MediaStream | null) {
  const track = getActiveTrack(stream)
  if (!track) {
    return null
  }

  return readCameraTrackInfo(track)
}

function getActiveTrack(stream: MediaStream | null) {
  return stream?.getVideoTracks()[0] ?? null
}

function getUnsupportedControlResult(): CameraControlResult {
  return {
    ok: false,
    error:
      'Controllo non disponibile in questo browser. PROimago puo comunque suggerire come usare la lente o cambiare angolo.',
  }
}

function getSnapshotCameraSettings(
  cameraInfo: CameraTrackInfo | null,
): SnapshotCameraSettings | undefined {
  if (!cameraInfo) {
    return undefined
  }

  const settings = cameraInfo.settings
  const controlSupport = cameraInfo.controlSupport
  const snapshotSettings: SnapshotCameraSettings = {
    zoom:
      typeof controlSupport.currentZoom === 'number'
        ? controlSupport.currentZoom
        : typeof settings?.zoom === 'number'
          ? settings.zoom
          : undefined,
    facingMode: controlSupport.facingMode ?? settings?.facingMode ?? undefined,
    width:
      typeof controlSupport.width === 'number'
        ? Math.round(controlSupport.width)
        : typeof settings?.width === 'number'
          ? Math.round(settings.width)
          : undefined,
    height:
      typeof controlSupport.height === 'number'
        ? Math.round(controlSupport.height)
        : typeof settings?.height === 'number'
          ? Math.round(settings.height)
          : undefined,
    frameRate:
      typeof controlSupport.frameRate === 'number'
        ? controlSupport.frameRate
        : typeof settings?.frameRate === 'number'
          ? settings.frameRate
          : undefined,
  }

  return Object.values(snapshotSettings).some((value) => value !== undefined)
    ? snapshotSettings
    : undefined
}

function createSnapshotThumbnail(
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
) {
  if (!width || !height) {
    return undefined
  }

  const targetWidth = Math.min(width, 320)
  const targetHeight = Math.max(1, Math.round((height / width) * targetWidth))
  const thumbnailCanvas = document.createElement('canvas')
  thumbnailCanvas.width = targetWidth
  thumbnailCanvas.height = targetHeight
  const thumbnailContext = thumbnailCanvas.getContext('2d')

  if (!thumbnailContext) {
    return undefined
  }

  thumbnailContext.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight)
  return thumbnailCanvas.toDataURL('image/jpeg', 0.68)
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
