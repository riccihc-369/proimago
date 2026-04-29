import { useState } from 'react'
import type { CameraTrackInfo, FrameAnalysis } from '../types'

interface CameraDiagnosticsProps {
  analysis: FrameAnalysis
  cameraInfo: CameraTrackInfo | null
  intervalMs: number
  isFieldActive: boolean
  videoHeight: number
  videoWidth: number
}

export function CameraDiagnostics({
  analysis,
  cameraInfo,
  intervalMs,
  isFieldActive,
  videoHeight,
  videoWidth,
}: CameraDiagnosticsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const aspectRatio =
    videoWidth > 0 && videoHeight > 0 ? (videoWidth / videoHeight).toFixed(2) : '--'
  const cameraLabel = cameraInfo?.facingMode ?? cameraInfo?.label ?? 'n/d'
  const capabilities = cameraInfo?.capabilities
  const effectiveOpen = isOpen && !isFieldActive
  const colorHint = analysis.colorTemperatureHint ?? '--'

  return (
    <section className={`diagnostics-panel ${effectiveOpen ? 'open' : ''}`}>
      <button
        type="button"
        className="diagnostics-toggle"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={effectiveOpen}
        disabled={isFieldActive}
      >
        <span>Camera Info</span>
        <span>{isFieldActive ? 'Field mode' : effectiveOpen ? 'Nascondi' : 'Mostra'}</span>
      </button>

      {effectiveOpen ? (
        <div className="diagnostics-body">
          <div className="diagnostics-grid">
            <DiagnosticItem label="Camera attiva" value={cameraLabel} />
            <DiagnosticItem
              label="Risoluzione"
              value={videoWidth > 0 && videoHeight > 0 ? `${videoWidth} x ${videoHeight}` : '--'}
            />
            <DiagnosticItem label="Aspect ratio" value={aspectRatio} />
            <DiagnosticItem label="Intervallo analisi" value={`${intervalMs} ms`} />
            <DiagnosticItem label="Luminosita media" value={`${analysis.brightness}%`} />
            <DiagnosticItem label="Contrasto" value={`${analysis.contrast}%`} />
            <DiagnosticItem label="Saturazione" value={`${analysis.saturation}%`} />
            <DiagnosticItem label="Score" value={`${analysis.score}`} />
            <DiagnosticItem label="Dominante" value={colorHint} />
          </div>

          <div className="diagnostics-capabilities">
            <div className="diagnostics-section-title">Capabilities</div>
            <div className="diagnostics-grid">
              <DiagnosticItem
                label="Zoom"
                value={formatZoom(capabilities)}
              />
              <DiagnosticItem
                label="Focus mode"
                value={formatArrayValue(capabilities?.focusMode)}
              />
              <DiagnosticItem
                label="Exposure mode"
                value={formatArrayValue(capabilities?.exposureMode)}
              />
              <DiagnosticItem
                label="Torch"
                value={formatTorchValue(capabilities)}
              />
            </div>

            {!capabilities?.supported && capabilities?.error ? (
              <p className="diagnostics-note">{capabilities.error}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  )
}

interface DiagnosticItemProps {
  label: string
  value: string
}

function DiagnosticItem({ label, value }: DiagnosticItemProps) {
  return (
    <div className="diagnostic-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function formatZoom(capabilities: CameraTrackInfo['capabilities'] | undefined) {
  if (!capabilities?.supported || !capabilities.zoom) {
    return 'n/d'
  }

  const { min, max, step } = capabilities.zoom
  return `${min} - ${max} (step ${step})`
}

function formatArrayValue(value: string[] | null | undefined) {
  if (!value || value.length === 0) {
    return 'n/d'
  }

  return value.join(', ')
}

function formatTorchValue(capabilities: CameraTrackInfo['capabilities'] | undefined) {
  if (!capabilities?.supported || capabilities.torch === null) {
    return 'n/d'
  }

  return capabilities.torch ? 'supportato' : 'non supportato'
}
