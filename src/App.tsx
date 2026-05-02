import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import './App.css'
import {
  analyzeFrame,
  EMPTY_FRAME_ANALYSIS,
  FRAME_ANALYSIS_INTERVAL_MS,
} from './analysis/frameAnalyzer'
import { PHOTO_CATEGORIES, PHOTO_CATEGORY_BY_ID } from './analysis/photoCategories'
import { getReferencePreviewHint } from './analysis/previewDecision'
import {
  analyzeShootingConditions,
  getShootingConditionAdvice,
} from './analysis/shootingConditions'
import { createSuggestion } from './analysis/suggestionEngine'
import { useStableSuggestion } from './analysis/useStableSuggestion'
import { useCamera } from './camera/useCamera'
import { CameraView } from './components/CameraView'
import { ControlPanel } from './components/ControlPanel'
import { OverlayGrid } from './components/OverlayGrid'
import type {
  CameraStatus,
  DetailPanelId,
  FrameAnalysis,
  HudState,
  PhotoCategoryId,
  SnapshotItem,
} from './types'

const HUD_IDLE_TIMEOUT_MS = 3000
const MAX_PREVIEWS = 24

function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const hudIdleTimerRef = useRef<number | null>(null)
  const [activeCategoryId, setActiveCategoryId] = useState<PhotoCategoryId>('auto')
  const [analysis, setAnalysis] = useState<FrameAnalysis>(EMPTY_FRAME_ANALYSIS)
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([])
  const [videoReady, setVideoReady] = useState(false)
  const [videoMetrics, setVideoMetrics] = useState({ width: 0, height: 0 })
  const [detailPanel, setDetailPanel] = useState<DetailPanelId | null>(null)
  const [areControlsVisible, setAreControlsVisible] = useState(true)
  const [selectedReferencePreviewId, setSelectedReferencePreviewId] = useState<string | null>(null)
  const [focusedPreviewId, setFocusedPreviewId] = useState<string | null>(null)

  const activeCategory = PHOTO_CATEGORY_BY_ID[activeCategoryId]
  const {
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
  } = useCamera()
  const cameraReady = status === 'ready' && videoReady
  const visibleAnalysis = cameraReady ? analysis : EMPTY_FRAME_ANALYSIS
  const hudState: HudState =
    detailPanel !== null ? 'detail' : cameraReady && !areControlsVisible ? 'idle' : 'controls'

  useEffect(() => {
    const video = videoRef.current
    if (!video) {
      return
    }

    const handleLoadedData = () => {
      setVideoReady(video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA)
      setVideoMetrics({
        width: video.videoWidth,
        height: video.videoHeight,
      })
    }

    const handleUnavailable = () => {
      setVideoReady(false)
      setVideoMetrics({ width: 0, height: 0 })
    }

    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('loadedmetadata', handleLoadedData)
    video.addEventListener('canplay', handleLoadedData)
    video.addEventListener('playing', handleLoadedData)
    video.addEventListener('resize', handleLoadedData)
    video.addEventListener('waiting', handleUnavailable)
    video.addEventListener('emptied', handleUnavailable)
    video.addEventListener('stalled', handleUnavailable)
    video.addEventListener('abort', handleUnavailable)

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('loadedmetadata', handleLoadedData)
      video.removeEventListener('canplay', handleLoadedData)
      video.removeEventListener('playing', handleLoadedData)
      video.removeEventListener('resize', handleLoadedData)
      video.removeEventListener('waiting', handleUnavailable)
      video.removeEventListener('emptied', handleUnavailable)
      video.removeEventListener('stalled', handleUnavailable)
      video.removeEventListener('abort', handleUnavailable)
    }
  }, [])

  const runAnalysis = useEffectEvent(() => {
    const video = videoRef.current
    const canvas = analysisCanvasRef.current

    if (!video || !canvas || !videoReady) {
      return
    }

    const nextAnalysis = analyzeFrame(video, canvas)
    setAnalysis(nextAnalysis)
  })

  useEffect(() => {
    if (status !== 'ready' || !videoReady) {
      return
    }

    runAnalysis()
    const intervalId = window.setInterval(runAnalysis, FRAME_ANALYSIS_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [status, videoReady])

  const rawSuggestion = useMemo(
    () => createSuggestion(activeCategory, visibleAnalysis, status),
    [activeCategory, status, visibleAnalysis],
  )
  const stableSuggestion = useStableSuggestion(rawSuggestion, cameraReady)
  const shootingConditions = useMemo(
    () => analyzeShootingConditions(visibleAnalysis, activeCategory),
    [activeCategory, visibleAnalysis],
  )
  const shootingConditionAdvice = useMemo(
    () => getShootingConditionAdvice(shootingConditions, activeCategory),
    [activeCategory, shootingConditions],
  )
  const selectedReferencePreview = useMemo(
    () =>
      snapshots.find((snapshot) => snapshot.id === selectedReferencePreviewId) ?? null,
    [selectedReferencePreviewId, snapshots],
  )
  const referenceHint = selectedReferencePreview
    ? getReferencePreviewHint(selectedReferencePreview)
    : null
  const conditionPillLabel = getConditionPillLabel(shootingConditions)

  const wakeHud = () => {
    if (hudIdleTimerRef.current !== null) {
      window.clearTimeout(hudIdleTimerRef.current)
      hudIdleTimerRef.current = null
    }

    setAreControlsVisible(true)

    if (!cameraReady || detailPanel !== null) {
      return
    }

    hudIdleTimerRef.current = window.setTimeout(() => {
      setAreControlsVisible(false)
    }, HUD_IDLE_TIMEOUT_MS)
  }

  useEffect(() => {
    if (hudIdleTimerRef.current !== null) {
      window.clearTimeout(hudIdleTimerRef.current)
      hudIdleTimerRef.current = null
    }

    if (!cameraReady || detailPanel !== null) {
      return
    }

    hudIdleTimerRef.current = window.setTimeout(() => {
      setAreControlsVisible(false)
    }, HUD_IDLE_TIMEOUT_MS)

    return () => {
      if (hudIdleTimerRef.current !== null) {
        window.clearTimeout(hudIdleTimerRef.current)
        hudIdleTimerRef.current = null
      }
    }
  }, [cameraReady, detailPanel])

  const handleOpenDetailPanel = (nextPanel: DetailPanelId) => {
    setFocusedPreviewId(null)
    setDetailPanel(nextPanel)
    wakeHud()
  }

  const handleCloseDetailPanel = () => {
    setFocusedPreviewId(null)
    setDetailPanel(null)
    wakeHud()
  }

  const handleSelectCategory = (nextCategoryId: PhotoCategoryId) => {
    setActiveCategoryId(nextCategoryId)
    handleCloseDetailPanel()
  }

  const handleCapture = () => {
    const snapshot = captureSnapshot(videoRef.current, {
      categoryId: activeCategory.id,
      categoryLabel: activeCategory.label,
      brightness: visibleAnalysis.brightness,
      contrast: visibleAnalysis.contrast,
      saturation: visibleAnalysis.saturation,
      sharpness: visibleAnalysis.sharpness,
      colorTemperatureHint: visibleAnalysis.colorTemperatureHint,
      score: visibleAnalysis.score,
      suggestionText: stableSuggestion.text,
      suggestionFamily: stableSuggestion.family,
      suggestionSeverity: stableSuggestion.severity,
      shootingConditions,
      finalShotReadiness: shootingConditions.finalShotReadiness,
      conditionAdvice: shootingConditionAdvice,
    })
    if (!snapshot) {
      return
    }

    setSnapshots((current) => appendPreview(current, snapshot))
    wakeHud()
  }

  const handleOpenPreviewBoard = (previewId?: string) => {
    setFocusedPreviewId(previewId ?? null)
    setDetailPanel('tools')
    wakeHud()
  }

  const handleToggleFavoritePreview = (previewId: string) => {
    setSnapshots((current) =>
      current.map((snapshot) =>
        snapshot.id === previewId
          ? { ...snapshot, isFavorite: !snapshot.isFavorite }
          : snapshot,
      ),
    )
    wakeHud()
  }

  const handleDeletePreview = (previewId: string) => {
    setSnapshots((current) => current.filter((snapshot) => snapshot.id !== previewId))
    setFocusedPreviewId((current) => (current === previewId ? null : current))
    setSelectedReferencePreviewId((current) => (current === previewId ? null : current))
    wakeHud()
  }

  const handleSelectReferencePreview = (previewId: string) => {
    setSelectedReferencePreviewId(previewId)
    wakeHud()
  }

  const handleStartCamera = async () => {
    setVideoReady(false)
    setVideoMetrics({ width: 0, height: 0 })
    wakeHud()
    await startCamera(videoRef.current)
  }

  const handleStopCamera = () => {
    stopCamera()
    setVideoReady(false)
    setVideoMetrics({ width: 0, height: 0 })
    setDetailPanel(null)
    setFocusedPreviewId(null)
    setAreControlsVisible(true)
  }

  const statusLabel = getStatusLabel(status, error, isSupported)

  return (
    <main
      className={`app-shell ${cameraReady ? 'is-field-active' : ''} hud-${hudState}`}
      onPointerDownCapture={wakeHud}
    >
      <section className="camera-stage">
        <CameraView
          videoRef={videoRef}
          status={status}
          error={error}
          isSupported={isSupported}
          statusLabel={statusLabel}
        />
        {cameraReady ? (
          <OverlayGrid
            category={activeCategory}
            analysis={visibleAnalysis}
            hudState={hudState}
            suggestion={stableSuggestion}
            conditionPillLabel={conditionPillLabel}
            hasReferencePreview={Boolean(selectedReferencePreview)}
            referenceHint={referenceHint}
          />
        ) : null}
        <ControlPanel
          analysis={visibleAnalysis}
          cameraInfo={cameraInfo}
          category={activeCategory}
          categories={PHOTO_CATEGORIES}
          canStart={isSupported && status !== 'requesting' && status !== 'ready'}
          canStop={status === 'ready' || status === 'requesting'}
          canCapture={cameraReady}
          detailPanel={detailPanel}
          focusedPreviewId={focusedPreviewId}
          hudState={hudState}
          intervalMs={FRAME_ANALYSIS_INTERVAL_MS}
          isFieldActive={cameraReady}
          selectedReferencePreviewId={selectedReferencePreviewId}
          snapshots={snapshots}
          status={status}
          shootingConditionAdvice={shootingConditionAdvice}
          shootingConditions={shootingConditions}
          suggestion={stableSuggestion}
          videoHeight={videoMetrics.height}
          videoWidth={videoMetrics.width}
          onSetZoom={setZoom}
          onSetTorch={setTorch}
          onSetExposureCompensation={setExposureCompensation}
          onSetFocusMode={setFocusMode}
          onResetCameraControls={resetCameraControls}
          onStart={handleStartCamera}
          onStop={handleStopCamera}
          onSelectCategory={handleSelectCategory}
          onCapture={handleCapture}
          onDeletePreview={handleDeletePreview}
          onCloseDetailPanel={handleCloseDetailPanel}
          onOpenDetailPanel={handleOpenDetailPanel}
          onOpenPreviewBoard={handleOpenPreviewBoard}
          onSelectReferencePreview={handleSelectReferencePreview}
          onToggleFavoritePreview={handleToggleFavoritePreview}
        />
      </section>
      <canvas ref={analysisCanvasRef} className="analysis-canvas" aria-hidden="true" />
    </main>
  )
}

function appendPreview(current: SnapshotItem[], nextPreview: SnapshotItem) {
  const previews = [nextPreview, ...current]
  if (previews.length <= MAX_PREVIEWS) {
    return previews
  }

  for (let index = previews.length - 1; index >= 0; index -= 1) {
    if (!previews[index].isFavorite) {
      return previews.filter((_, previewIndex) => previewIndex !== index)
    }
  }

  return previews.slice(0, MAX_PREVIEWS)
}

function getStatusLabel(
  status: CameraStatus,
  error: string | null,
  isSupported: boolean,
): string {
  if (!isSupported) {
    return "Questo browser non supporta l'accesso alla camera."
  }

  if (error) {
    return error
  }

  switch (status) {
    case 'requesting':
      return 'Richiesta accesso alla camera in corso...'
    case 'ready':
      return 'Analisi compositiva attiva in tempo reale.'
    default:
      return 'Avvia la camera per iniziare il framing coach.'
  }
}

function getConditionPillLabel(
  shootingConditions: ReturnType<typeof analyzeShootingConditions>,
) {
  if (shootingConditions.finalShotReadiness === 'not_ideal') {
    return 'Scatto finale: rimandabile'
  }

  if (
    shootingConditions.lowLight ||
    shootingConditions.harshLight ||
    shootingConditions.artificialLightLikely
  ) {
    return 'Luce non ideale'
  }

  return null
}

export default App
