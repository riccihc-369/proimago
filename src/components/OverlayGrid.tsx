import type { CompositionMode, FrameAnalysis, Suggestion } from '../types'

interface OverlayGridProps {
  mode: CompositionMode
  analysis: FrameAnalysis
  suggestion: Suggestion
}

export function OverlayGrid({ mode, analysis, suggestion }: OverlayGridProps) {
  const zoneSize = Math.round(50 + analysis.dominantSpread * 140)
  const brightnessTone = getMetricTone(analysis.brightnessPercent, 28, 46)
  const contrastTone = getMetricTone(analysis.contrast, 24, 42)
  const balanceTone = analysis.isTooCentral ? 'warn' : 'good'
  const spaceTone = analysis.isTopTooEmpty ? 'warn' : 'good'

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
        <div className="mode-badge">{mode}</div>

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
              {suggestion.severity}
            </span>
          </div>
          <p>{suggestion.message}</p>
        </div>

        <div className="metric-row">
          <MetricCard
            label="Luce"
            value={`${analysis.brightnessPercent}%`}
            tone={brightnessTone}
          />
          <MetricCard
            label="Contrasto"
            value={`${analysis.contrast}%`}
            tone={contrastTone}
          />
          <MetricCard
            label="Bilanciamento"
            value={analysis.isTooCentral ? 'Centrale' : 'Buono'}
            tone={balanceTone}
          />
          <MetricCard
            label="Spazio alto"
            value={analysis.isTopTooEmpty ? 'Troppo' : 'Ok'}
            tone={spaceTone}
          />
        </div>
      </div>
    </div>
  )
}

interface MetricCardProps {
  label: string
  value: string
  tone: 'good' | 'warn' | 'bad'
}

function MetricCard({ label, value, tone }: MetricCardProps) {
  return (
    <div className={`metric-card ${tone}`}>
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
