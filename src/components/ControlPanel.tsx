import { PHOTO_CATEGORY_BY_ID } from '../analysis/photoCategories'
import type {
  CameraStatus,
  CameraTrackInfo,
  DetailPanelId,
  FrameAnalysis,
  HudState,
  PhotoCategory,
  PhotoCategoryId,
  SnapshotItem,
  Suggestion,
} from '../types'

interface ControlPanelProps {
  analysis: FrameAnalysis
  cameraInfo: CameraTrackInfo | null
  category: PhotoCategory
  categories: PhotoCategory[]
  canStart: boolean
  canStop: boolean
  canCapture: boolean
  detailPanel: DetailPanelId | null
  hudState: HudState
  intervalMs: number
  isFieldActive: boolean
  snapshots: SnapshotItem[]
  status: CameraStatus
  suggestion: Suggestion
  videoHeight: number
  videoWidth: number
  onStart: () => Promise<void>
  onStop: () => void
  onSelectCategory: (categoryId: PhotoCategoryId) => void
  onCapture: () => void
  onCloseDetailPanel: () => void
  onOpenDetailPanel: (panelId: DetailPanelId) => void
}

export function ControlPanel({
  analysis,
  cameraInfo,
  category,
  categories,
  canStart,
  canStop,
  canCapture,
  detailPanel,
  hudState,
  intervalMs,
  isFieldActive,
  snapshots,
  status,
  suggestion,
  videoHeight,
  videoWidth,
  onStart,
  onStop,
  onSelectCategory,
  onCapture,
  onCloseDetailPanel,
  onOpenDetailPanel,
}: ControlPanelProps) {
  const isDetailOpen = detailPanel !== null
  const showSecondaryActions = hudState === 'controls'
  const primaryActionDisabled =
    status === 'requesting' || (isFieldActive ? !canCapture : !canStart)
  const primaryActionLabel = status === 'requesting' ? 'Attendi' : isFieldActive ? 'Scatta' : 'Avvia'
  const primaryActionHint = status === 'requesting' ? 'camera' : isFieldActive ? 'preview' : 'live'
  const categoryLabel = category.shortLabel ?? category.label

  return (
    <section className={`hud-controls hud-${hudState}`} aria-label="Controlli live">
      {showSecondaryActions ? (
        <div className="hud-quick-actions">
          <button
            type="button"
            className="hud-quick-action"
            onClick={() => onOpenDetailPanel('snapshots')}
          >
            Snapshot
          </button>
          <button
            type="button"
            className="hud-quick-action"
            onClick={() => onOpenDetailPanel('tools')}
          >
            Strumenti
          </button>
          <button
            type="button"
            className={`hud-quick-action ${isFieldActive ? 'danger' : 'accent'}`}
            onClick={isFieldActive ? onStop : () => void onStart()}
            disabled={isFieldActive ? !canStop : !canStart}
          >
            {isFieldActive ? 'Stop camera' : 'Avvia camera'}
          </button>
        </div>
      ) : null}

      {isDetailOpen ? (
        <div className="detail-sheet" id="detail-sheet" role="dialog" aria-modal="false">
          <div className="detail-sheet-handle" aria-hidden="true" />

          <div className="detail-sheet-header">
            <div>
              <span className="detail-sheet-kicker">PROimago V0.1.3</span>
              <h2>{getPanelTitle(detailPanel)}</h2>
              <p>{getPanelSubtitle(detailPanel)}</p>
            </div>
            <button
              type="button"
              className="detail-sheet-close"
              onClick={onCloseDetailPanel}
              aria-label="Chiudi pannello"
            >
              Chiudi
            </button>
          </div>

          <div className="detail-sheet-body">
            {detailPanel === 'category' ? (
              <CategoryPanel
                category={category}
                categories={categories}
                onSelectCategory={onSelectCategory}
              />
            ) : null}

            {detailPanel === 'snapshots' ? (
              <SnapshotsPanel snapshots={snapshots} />
            ) : null}

            {detailPanel === 'tools' ? (
              <ToolsPanel
                analysis={analysis}
                cameraInfo={cameraInfo}
                canStart={canStart}
                canStop={canStop}
                category={category}
                intervalMs={intervalMs}
                isFieldActive={isFieldActive}
                onOpenSnapshots={() => onOpenDetailPanel('snapshots')}
                onStart={onStart}
                onStop={onStop}
                snapshots={snapshots}
                suggestion={suggestion}
                videoHeight={videoHeight}
                videoWidth={videoWidth}
              />
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="action-bar" role="toolbar" aria-label="Azioni principali">
        <ActionBarButton
          label="Categoria"
          meta={categoryLabel}
          isActive={detailPanel === 'category'}
          onClick={() => onOpenDetailPanel('category')}
        />

        <button
          type="button"
          className="action-bar-button action-bar-button-primary"
          onClick={isFieldActive ? onCapture : () => void onStart()}
          disabled={primaryActionDisabled}
        >
          <span className="action-bar-label">{primaryActionLabel}</span>
          <span className="action-bar-meta">{primaryActionHint}</span>
        </button>

        <ActionBarButton
          label="Altro"
          meta={isFieldActive ? 'tools' : 'setup'}
          isActive={detailPanel === 'tools'}
          onClick={() => onOpenDetailPanel('tools')}
        />
      </div>
    </section>
  )
}

interface ActionBarButtonProps {
  isActive?: boolean
  label: string
  meta: string
  onClick: () => void
}

function ActionBarButton({ isActive = false, label, meta, onClick }: ActionBarButtonProps) {
  return (
    <button
      type="button"
      className={`action-bar-button ${isActive ? 'is-active' : ''}`}
      onClick={onClick}
      aria-pressed={isActive}
      aria-expanded={isActive}
      aria-controls="detail-sheet"
    >
      <span className="action-bar-label">{label}</span>
      <span className="action-bar-meta">{meta}</span>
    </button>
  )
}

interface CategoryPanelProps {
  category: PhotoCategory
  categories: PhotoCategory[]
  onSelectCategory: (categoryId: PhotoCategoryId) => void
}

function CategoryPanel({ category, categories, onSelectCategory }: CategoryPanelProps) {
  return (
    <div className="sheet-layout">
      <section className="sheet-section">
        <div className="sheet-note">
          <strong>Categoria obbligatoria</strong>
          <p>Scegli sempre il tipo di scena prima di scattare, cosi il coach adatta i suggerimenti.</p>
        </div>
      </section>

      <section className="sheet-section">
        <div className="category-sheet-list" aria-label="Elenco categorie">
          {categories.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`category-sheet-item ${item.id === category.id ? 'active' : ''}`}
              onClick={() => onSelectCategory(item.id)}
              aria-pressed={item.id === category.id}
            >
              <div className="category-sheet-heading">
                <strong>{item.label}</strong>
                <span>{item.id === category.id ? 'Attiva' : 'Seleziona'}</span>
              </div>
              <p>{item.description}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

interface SnapshotsPanelProps {
  snapshots: SnapshotItem[]
}

function SnapshotsPanel({ snapshots }: SnapshotsPanelProps) {
  return (
    <div className="sheet-layout">
      <section className="sheet-section">
        <div className="sheet-inline-header">
          <strong>Archivio rapido</strong>
          <span>{snapshots.length}/12 in memoria</span>
        </div>
      </section>

      <section className="sheet-section">
        {snapshots.length === 0 ? (
          <div className="sheet-empty-state">
            Scatta una preview dal live view per confrontare composizione e suggerimenti.
          </div>
        ) : (
          <div className="snapshot-sheet-grid">
            {snapshots.map((snapshot) => (
              <article key={snapshot.id} className="snapshot-sheet-card">
                <img
                  src={snapshot.dataUrl}
                  alt={`Snapshot ${formatTimestamp(snapshot.timestamp)}`}
                />
                <div className="snapshot-sheet-meta">
                  <div className="snapshot-sheet-tags">
                    <span className="sheet-chip">
                      {PHOTO_CATEGORY_BY_ID[snapshot.categoryId].shortLabel ??
                        PHOTO_CATEGORY_BY_ID[snapshot.categoryId].label}
                    </span>
                    <span className="sheet-chip">Score {snapshot.score}</span>
                  </div>
                  <strong>{formatTimestamp(snapshot.timestamp)}</strong>
                  <span>
                    {`L ${snapshot.brightness} · C ${snapshot.contrast} · S ${snapshot.saturation}`}
                  </span>
                  <p>{snapshot.suggestion.text}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

interface ToolsPanelProps {
  analysis: FrameAnalysis
  cameraInfo: CameraTrackInfo | null
  canStart: boolean
  canStop: boolean
  category: PhotoCategory
  intervalMs: number
  isFieldActive: boolean
  onOpenSnapshots: () => void
  onStart: () => Promise<void>
  onStop: () => void
  snapshots: SnapshotItem[]
  suggestion: Suggestion
  videoHeight: number
  videoWidth: number
}

function ToolsPanel({
  analysis,
  cameraInfo,
  canStart,
  canStop,
  category,
  intervalMs,
  isFieldActive,
  onOpenSnapshots,
  onStart,
  onStop,
  snapshots,
  suggestion,
  videoHeight,
  videoWidth,
}: ToolsPanelProps) {
  const composition = getCompositionScore(analysis)
  const aspectRatio =
    videoWidth > 0 && videoHeight > 0 ? (videoWidth / videoHeight).toFixed(2) : '--'
  const cameraLabel = cameraInfo?.facingMode ?? cameraInfo?.label ?? 'n/d'
  const capabilities = cameraInfo?.capabilities

  return (
    <div className="sheet-layout">
      <section className="sheet-section">
        <div className="sheet-inline-header">
          <strong>Field HUD Minimal</strong>
          <span>{isFieldActive ? 'live attivo' : 'camera inattiva'}</span>
        </div>
        <p className="sheet-body-copy">
          Overlay attenuato di default, dettagli richiamabili solo quando servono.
        </p>
      </section>

      <section className="sheet-section">
        <div className="sheet-inline-header">
          <strong>Suggerimento attivo</strong>
          <span className={`sheet-badge ${suggestion.severity}`}>
            {getSeverityLabel(suggestion.severity)}
          </span>
        </div>
        <p className="sheet-body-copy">{suggestion.text}</p>
        <div className="sheet-detail-list">
          <span className="sheet-chip">Categoria {category.label}</span>
          <span className="sheet-chip">Famiglia {getFamilyLabel(suggestion.family)}</span>
        </div>
      </section>

      <section className="sheet-section">
        <div className="sheet-inline-header">
          <strong>Metriche complete</strong>
          <span>refresh {intervalMs} ms</span>
        </div>
        <div className="tools-grid">
          <MetricTile label="Score" value={`${analysis.score}`} tone={getScoreTone(analysis.score)} />
          <MetricTile label="Composizione" value={`${composition}`} tone={getScoreTone(composition)} />
          <MetricTile label="Luce" value={`${analysis.brightness}%`} tone={getMetricTone(analysis.brightness, 28, 46)} />
          <MetricTile label="Contrasto" value={`${analysis.contrast}%`} tone={getMetricTone(analysis.contrast, 24, 42)} />
          <MetricTile label="Saturazione" value={`${analysis.saturation}%`} tone={getSaturationTone(analysis.saturation)} />
          <MetricTile
            label="Dominante"
            value={analysis.colorTemperatureHint ?? '--'}
            tone={analysis.colorTemperatureHint === 'warm' ? 'warn' : 'good'}
          />
        </div>
      </section>

      <section className="sheet-section">
        <div className="sheet-inline-header">
          <strong>Camera info</strong>
          <span>{cameraLabel}</span>
        </div>
        <div className="tools-grid">
          <MetricTile
            label="Risoluzione"
            value={videoWidth > 0 && videoHeight > 0 ? `${videoWidth} x ${videoHeight}` : '--'}
            tone="good"
          />
          <MetricTile label="Aspect" value={aspectRatio} tone="good" />
          <MetricTile label="Zoom" value={formatZoom(capabilities)} tone="good" />
          <MetricTile label="Torch" value={formatTorchValue(capabilities)} tone="good" />
          <MetricTile label="Focus" value={formatArrayValue(capabilities?.focusMode)} tone="good" />
          <MetricTile
            label="Exposure"
            value={formatArrayValue(capabilities?.exposureMode)}
            tone="good"
          />
        </div>

        {!capabilities?.supported && capabilities?.error ? (
          <p className="sheet-support-note">{capabilities.error}</p>
        ) : null}
      </section>

      <section className="sheet-section">
        <div className="sheet-inline-header">
          <strong>Snapshot strip</strong>
          <button type="button" className="sheet-link-button" onClick={onOpenSnapshots}>
            Apri archivio
          </button>
        </div>
        {snapshots.length === 0 ? (
          <div className="sheet-empty-state">Nessuna preview salvata.</div>
        ) : (
          <div className="snapshot-peek-row">
            {snapshots.slice(0, 4).map((snapshot) => (
              <img
                key={snapshot.id}
                className="snapshot-peek-image"
                src={snapshot.dataUrl}
                alt={`Preview ${formatTimestamp(snapshot.timestamp)}`}
              />
            ))}
          </div>
        )}
      </section>

      <section className="sheet-section">
        <div className="sheet-inline-header">
          <strong>Azioni camera</strong>
          <span>{isFieldActive ? 'live view' : 'pronta'}</span>
        </div>
        <div className="sheet-action-row">
          <button
            type="button"
            className="sheet-action-button accent"
            onClick={() => void onStart()}
            disabled={!canStart}
          >
            Avvia camera
          </button>
          <button
            type="button"
            className="sheet-action-button"
            onClick={onStop}
            disabled={!canStop}
          >
            Stop camera
          </button>
        </div>
      </section>
    </div>
  )
}

interface MetricTileProps {
  label: string
  tone: 'good' | 'warn' | 'bad'
  value: string
}

function MetricTile({ label, tone, value }: MetricTileProps) {
  return (
    <div className={`tool-metric-tile ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function getPanelTitle(detailPanel: DetailPanelId) {
  switch (detailPanel) {
    case 'category':
      return 'Categoria'
    case 'snapshots':
      return 'Snapshot'
    case 'tools':
      return 'Strumenti'
    default:
      return 'Dettagli'
  }
}

function getPanelSubtitle(detailPanel: DetailPanelId) {
  switch (detailPanel) {
    case 'category':
      return 'Scegli il tipo di scena senza lasciare la live view.'
    case 'snapshots':
      return 'Rivedi rapidamente le preview salvate durante la ripresa.'
    case 'tools':
      return 'Metriche complete, camera info, diagnostica e dettaglio del suggerimento.'
    default:
      return ''
  }
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

function getFamilyLabel(family: Suggestion['family']) {
  switch (family) {
    case 'composition':
      return 'Composizione'
    case 'light':
      return 'Luce'
    case 'color':
      return 'Colore'
    case 'framing':
      return 'Inquadratura'
    case 'category':
    default:
      return 'Categoria'
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

function getCompositionScore(analysis: FrameAnalysis) {
  const spreadScore = Math.min(100, Math.round(analysis.dominantSpread * 180))
  const centerOffset = Math.hypot(analysis.dominantPoint.x - 0.5, analysis.dominantPoint.y - 0.5)
  const balanceScore = Math.max(0, 100 - Math.round(centerOffset * 120))
  const headroomScore = Math.max(0, 100 - Math.max(0, analysis.topEmptySpace - 38))

  return Math.round((spreadScore * 0.22 + balanceScore * 0.22 + headroomScore * 0.18 + analysis.score * 0.38))
}

function formatZoom(capabilities: CameraTrackInfo['capabilities'] | undefined) {
  if (!capabilities?.supported || !capabilities.zoom) {
    return 'n/d'
  }

  const { min, max, step } = capabilities.zoom
  return `${min}-${max} / ${step}`
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

  return capabilities.torch ? 'supportato' : 'assente'
}

function formatTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    month: '2-digit',
    day: '2-digit',
  })
}
