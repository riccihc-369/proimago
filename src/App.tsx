import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import './App.css'
import {
  analyzeFrame,
  EMPTY_FRAME_ANALYSIS,
  FRAME_ANALYSIS_INTERVAL_MS,
} from './analysis/frameAnalyzer'
import {
  getNextPhotoCategoryId,
  PHOTO_CATEGORIES,
  PHOTO_CATEGORY_BY_ID,
} from './analysis/photoCategories'
import { createSuggestion } from './analysis/suggestionEngine'
import { useStableSuggestion } from './analysis/useStableSuggestion'
import { useCamera } from './camera/useCamera'
import { CameraDiagnostics } from './components/CameraDiagnostics'
import { CameraView } from './components/CameraView'
import { ControlPanel } from './components/ControlPanel'
import { OverlayGrid } from './components/OverlayGrid'
import { SnapshotStrip } from './components/SnapshotStrip'
import type {
  CameraStatus,
  FrameAnalysis,
  PhotoCategoryId,
  SnapshotItem,
} from './types'

function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [activeCategoryId, setActiveCategoryId] = useState<PhotoCategoryId>('auto')
  const [analysis, setAnalysis] = useState<FrameAnalysis>(EMPTY_FRAME_ANALYSIS)
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([])
  const [videoReady, setVideoReady] = useState(false)
  const [videoMetrics, setVideoMetrics] = useState({ width: 0, height: 0 })

  const activeCategory = PHOTO_CATEGORY_BY_ID[activeCategoryId]
  const {
    status,
    error,
    isSupported,
    cameraInfo,
    startCamera,
    stopCamera,
    captureSnapshot,
  } = useCamera()
  const cameraReady = status === 'ready' && videoReady
  const visibleAnalysis = cameraReady ? analysis : EMPTY_FRAME_ANALYSIS

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

  const handleCycleCategory = () => {
    setActiveCategoryId((currentId) => getNextPhotoCategoryId(currentId))
  }

  const handleSelectCategory = (nextCategoryId: PhotoCategoryId) => {
    setActiveCategoryId(nextCategoryId)
  }

  const handleCapture = () => {
    const snapshot = captureSnapshot(videoRef.current, {
      categoryId: activeCategory.id,
      brightness: visibleAnalysis.brightness,
      contrast: visibleAnalysis.contrast,
      saturation: visibleAnalysis.saturation,
      colorTemperatureHint: visibleAnalysis.colorTemperatureHint,
      score: visibleAnalysis.score,
      suggestion: stableSuggestion,
    })
    if (!snapshot) {
      return
    }

    setSnapshots((current) => [snapshot, ...current].slice(0, 12))
  }

  const handleStartCamera = async () => {
    setVideoReady(false)
    setVideoMetrics({ width: 0, height: 0 })
    await startCamera(videoRef.current)
  }

  const handleStopCamera = () => {
    stopCamera()
    setVideoReady(false)
    setVideoMetrics({ width: 0, height: 0 })
  }

  const statusLabel = getStatusLabel(status, error, isSupported)

  return (
    <main className={`app-shell ${cameraReady ? 'is-field-active' : ''}`}>
      <section className="camera-stage">
        <CameraView
          videoRef={videoRef}
          status={status}
          error={error}
          isSupported={isSupported}
          statusLabel={statusLabel}
        />
        <OverlayGrid
          category={activeCategory}
          analysis={visibleAnalysis}
          suggestion={stableSuggestion}
        />
      </section>

      <section className="bottom-stack">
        <ControlPanel
          category={activeCategory}
          categories={PHOTO_CATEGORIES}
          isFieldActive={cameraReady}
          canStart={isSupported && status !== 'requesting' && status !== 'ready'}
          canStop={status === 'ready' || status === 'requesting'}
          canCapture={cameraReady}
          onStart={handleStartCamera}
          onStop={handleStopCamera}
          onCycleCategory={handleCycleCategory}
          onSelectCategory={handleSelectCategory}
          onCapture={handleCapture}
        />

        <CameraDiagnostics
          analysis={visibleAnalysis}
          cameraInfo={cameraInfo}
          intervalMs={FRAME_ANALYSIS_INTERVAL_MS}
          isFieldActive={cameraReady}
          videoWidth={videoMetrics.width}
          videoHeight={videoMetrics.height}
        />

        <SnapshotStrip snapshots={snapshots} isFieldActive={cameraReady} />
      </section>
      <canvas ref={analysisCanvasRef} className="analysis-canvas" aria-hidden="true" />
    </main>
  )
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

export default App
