import type { CompositionMode } from '../types'

interface ControlPanelProps {
  mode: CompositionMode
  canStart: boolean
  canStop: boolean
  canCapture: boolean
  onStart: () => Promise<void>
  onStop: () => void
  onCycleMode: () => void
  onCapture: () => void
}

export function ControlPanel({
  mode,
  canStart,
  canStop,
  canCapture,
  onStart,
  onStop,
  onCycleMode,
  onCapture,
}: ControlPanelProps) {
  return (
    <section className="control-panel">
      <div className="control-header">
        <div>
          <h1>PROimago V0.1.1</h1>
          <p>Field Test + Camera Diagnostics per validare il coach su iPhone.</p>
        </div>
        <div className="mode-chip">Modalita: {mode}</div>
      </div>

      <div className="control-actions">
        <button
          type="button"
          className="control-button primary"
          onClick={onStart}
          disabled={!canStart}
        >
          Avvia camera
        </button>
        <button
          type="button"
          className="control-button secondary"
          onClick={onStop}
          disabled={!canStop}
        >
          Stop camera
        </button>
        <button type="button" className="control-button secondary" onClick={onCycleMode}>
          Cambia modalita
        </button>
        <button
          type="button"
          className="control-button secondary"
          onClick={onCapture}
          disabled={!canCapture}
        >
          Scatta anteprima
        </button>
      </div>
    </section>
  )
}
