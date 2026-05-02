import type { FinalReadinessSummary } from '../analysis/finalReadiness'
import type { FrameAnalysis, HudState, PhotoCategory, Suggestion } from '../types'

interface OverlayGridProps {
  analysis: FrameAnalysis
  category: PhotoCategory
  finalReadinessSummary: FinalReadinessSummary
  hasReferencePreview?: boolean
  hudState: HudState
  referenceHint?: string | null
  suggestion: Suggestion
}

export function OverlayGrid({
  analysis,
  category,
  finalReadinessSummary,
  hasReferencePreview = false,
  hudState,
  referenceHint = null,
  suggestion,
}: OverlayGridProps) {
  const trackerSize = Math.round(24 + analysis.dominantSpread * 64)
  const composition = getCompositionScore(analysis)

  return (
    <div className={`overlay-root hud-${hudState}`} aria-hidden="true">
      <div className="grid-line vertical" style={{ left: '33.333%' }} />
      <div className="grid-line vertical" style={{ left: '66.666%' }} />
      <div className="grid-line horizontal" style={{ top: '33.333%' }} />
      <div className="grid-line horizontal" style={{ top: '66.666%' }} />

      <div
        className="dominant-tracker"
        style={{
          left: `${analysis.dominantPoint.x * 100}%`,
          top: `${analysis.dominantPoint.y * 100}%`,
          width: `${trackerSize}px`,
          height: `${trackerSize}px`,
        }}
      >
        <span className="dominant-tracker-dot" />
      </div>

      <div className="overlay-topbar">
        <div className="overlay-topstack">
          <div className="mode-badge">{category.shortLabel ?? category.label}</div>
          {hasReferencePreview ? (
            <div className="reference-pill">Riferimento attivo</div>
          ) : null}
          {finalReadinessSummary.finalReadinessLabel !== 'Pronto' ? (
            <div className={`condition-pill ${finalReadinessSummary.finalReadinessTone}`}>
              {`Finale: ${finalReadinessSummary.finalReadinessLabel}`}
            </div>
          ) : null}
        </div>
        <div className={`score-chip ${getScoreTone(analysis.score)}`}>
          <span>Base</span>
          <strong>{analysis.score}</strong>
        </div>
      </div>

      <div className="overlay-bottom">
        {referenceHint && hudState === 'controls' ? (
          <div className="reference-strip">
            <strong>Riferimento</strong>
            <p>{referenceHint}</p>
          </div>
        ) : null}

        <div className={`suggestion-strip ${suggestion.severity}`}>
          <div className="suggestion-strip-header">
            <strong>Suggerimento</strong>
            <span className={`severity-badge ${suggestion.severity}`}>
              {getSeverityLabel(suggestion.severity)}
            </span>
          </div>
          <p>{suggestion.text}</p>
        </div>

        <div className="metric-row">
          <MetricPill label="Comp" value={`${composition}`} tone={getScoreTone(composition)} />
          <MetricPill label="Luce" value={`${analysis.brightness}`} tone={getMetricTone(analysis.brightness, 28, 46)} />
          <MetricPill
            label="Contrasto"
            value={`${analysis.contrast}`}
            tone={getMetricTone(analysis.contrast, 24, 42)}
          />
          <MetricPill label="Sat" value={`${analysis.saturation}`} tone={getSaturationTone(analysis.saturation)} />
          <MetricPill
            className="optional"
            label="Nit"
            value={`${analysis.sharpness}`}
            tone={getSharpnessTone(analysis.sharpness)}
          />
        </div>
      </div>
    </div>
  )
}

interface MetricPillProps {
  className?: string
  label: string
  tone: 'good' | 'warn' | 'bad'
  value: string
}

function MetricPill({ className, label, tone, value }: MetricPillProps) {
  return (
    <div className={`metric-pill ${tone} ${className ?? ''}`.trim()}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function getSeverityLabel(severity: Suggestion['severity']) {
  switch (severity) {
    case 'warning':
      return 'Attenzione'
    case 'improve':
      return 'Affina'
    case 'good':
      return 'Buono'
    case 'info':
    default:
      return 'Info'
  }
}

function getMetricTone(value: number, warnThreshold: number, goodThreshold: number) {
  if (value < warnThreshold) {
    return 'bad' as const
  }

  if (value < goodThreshold) {
    return 'warn' as const
  }

  return 'good' as const
}

function getScoreTone(value: number) {
  if (value < 40) {
    return 'bad' as const
  }

  if (value < 68) {
    return 'warn' as const
  }

  return 'good' as const
}

function getSaturationTone(value: number) {
  if (value < 14 || value > 82) {
    return 'bad' as const
  }

  if (value < 24 || value > 70) {
    return 'warn' as const
  }

  return 'good' as const
}

function getSharpnessTone(value: number) {
  if (value < 28) {
    return 'bad' as const
  }

  if (value < 48) {
    return 'warn' as const
  }

  return 'good' as const
}

function getCompositionScore(analysis: FrameAnalysis) {
  const spreadScore = Math.min(100, Math.round(analysis.dominantSpread * 180))
  const centerOffset = Math.hypot(analysis.dominantPoint.x - 0.5, analysis.dominantPoint.y - 0.5)
  const balanceScore = Math.max(0, 100 - Math.round(centerOffset * 120))
  const headroomScore = Math.max(0, 100 - Math.max(0, analysis.topEmptySpace - 38))

  return Math.round(
    spreadScore * 0.22 + balanceScore * 0.22 + headroomScore * 0.18 + analysis.score * 0.38,
  )
}
