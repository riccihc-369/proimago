import type { FrameAnalysis, PhotoCategory, Suggestion } from '../types'

interface OverlayGridProps {
  category: PhotoCategory
  analysis: FrameAnalysis
  suggestion: Suggestion
}

export function OverlayGrid({ category, analysis, suggestion }: OverlayGridProps) {
  const zoneSize = Math.round(44 + analysis.dominantSpread * 128)
  const brightnessTone = getMetricTone(analysis.brightness, 28, 46)
  const contrastTone = getMetricTone(analysis.contrast, 24, 42)
  const saturationTone = getSaturationTone(analysis.saturation)
  const compositionMetric = getCompositionMetric(analysis)
  const badgeLabel = category.shortLabel ?? category.label

  return (
    <div className="overlay-root" aria-hidden="true">
      <div className="grid-line vertical" style={{ left: '33.333%' }} />
      <div className="grid-line vertical" style={{ left: '66.666%' }} />
      <div className="grid-line horizontal" style={{ top: '33.333%' }} />
      <div className="grid-line horizontal" style={{ top: '66.666%' }} />

      <div className="center-guard" />
      <div className="center-reticle">
        <span className="center-reticle-dot" />
      </div>

      <div
        className="dominant-zone"
        style={{
          left: `${analysis.dominantPoint.x * 100}%`,
          top: `${analysis.dominantPoint.y * 100}%`,
          width: `${zoneSize}px`,
          height: `${zoneSize}px`,
        }}
      >
        <div className="dominant-dot" />
      </div>

      <div className="overlay-topbar">
        <div className="mode-badge">{`Categoria: ${badgeLabel}`}</div>

        <div className="score-pill">
          <div className="score-pill-row">
            <strong>{analysis.score}</strong>
            <span>Score</span>
          </div>
          <div className="score-bar">
            <div
              className="score-bar-fill"
              style={{ width: `${analysis.score}%` }}
            />
          </div>
        </div>
      </div>

      <div className="overlay-bottom">
        <div className={`suggestion-panel ${suggestion.severity}`}>
          <div className="suggestion-heading">
            <strong>Suggerimento</strong>
            <span className={`severity-badge ${suggestion.severity}`}>
              {suggestion.family}
            </span>
          </div>
          <p>{suggestion.text}</p>
        </div>

        <div className="metric-strip">
          <MetricPill label="Composizione" value={compositionMetric.value} tone={compositionMetric.tone} />
          <MetricPill label="Luce" value={`${analysis.brightness}%`} tone={brightnessTone} />
          <MetricPill label="Contrasto" value={`${analysis.contrast}%`} tone={contrastTone} />
          <MetricPill label="Saturazione" value={`${analysis.saturation}%`} tone={saturationTone} />
        </div>
      </div>
    </div>
  )
}

interface MetricPillProps {
  label: string
  value: string
  tone: 'good' | 'warn' | 'bad'
}

function MetricPill({ label, value, tone }: MetricPillProps) {
  return (
    <div className={`metric-pill ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
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

function getSaturationTone(value: number) {
  if (value < 14 || value > 82) {
    return 'bad' as const
  }

  if (value < 24 || value > 70) {
    return 'warn' as const
  }

  return 'good' as const
}

function getCompositionMetric(analysis: FrameAnalysis) {
  const centerDistance = Math.hypot(
    analysis.dominantPoint.x - 0.5,
    analysis.dominantPoint.y - 0.5,
  )

  if (centerDistance < 0.16) {
    return { value: 'Centrale', tone: 'warn' as const }
  }

  if (analysis.topEmptySpace > 62) {
    return { value: 'Da chiudere', tone: 'warn' as const }
  }

  if (analysis.score > 72) {
    return { value: 'Buona', tone: 'good' as const }
  }

  return { value: 'Equilibrata', tone: 'good' as const }
}
