import { useState } from 'react'
import type { FinalReadinessSummary } from '../analysis/finalReadiness'
import { PreviewBoard } from './PreviewBoard'
import type { CameraControlResult } from '../camera/cameraCapabilities'
import type {
  CameraStatus,
  CameraTrackInfo,
  DetailPanelId,
  FrameAnalysis,
  HudState,
  PhotoCategory,
  PhotoCategoryId,
  SnapshotItem,
  ShootingConditions,
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
  finalReadinessSummary: FinalReadinessSummary
  hudState: HudState
  intervalMs: number
  isFieldActive: boolean
  selectedReferencePreviewId: string | null
  snapshots: SnapshotItem[]
  status: CameraStatus
  shootingConditionAdvice: string
  shootingConditions: ShootingConditions
  suggestion: Suggestion
  videoHeight: number
  videoWidth: number
  onDeletePreview: (previewId: string) => void
  onSelectReferencePreview: (previewId: string) => void
  onSetZoom: (value: number) => Promise<CameraControlResult>
  onSetTorch: (on: boolean) => Promise<CameraControlResult>
  onSetExposureCompensation: (value: number) => Promise<CameraControlResult>
  onSetFocusMode: (mode: string) => Promise<CameraControlResult>
  onResetCameraControls: () => Promise<CameraControlResult>
  onStart: () => Promise<void>
  onStop: () => void
  onSelectCategory: (categoryId: PhotoCategoryId) => void
  onCapture: () => void
  onCloseDetailPanel: () => void
  onOpenDetailPanel: (panelId: DetailPanelId) => void
  onToggleFavoritePreview: (previewId: string) => void
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
  finalReadinessSummary,
  hudState,
  intervalMs,
  isFieldActive,
  selectedReferencePreviewId,
  snapshots,
  status,
  shootingConditionAdvice,
  shootingConditions,
  suggestion,
  videoHeight,
  videoWidth,
  onDeletePreview,
  onSelectReferencePreview,
  onSetZoom,
  onSetTorch,
  onSetExposureCompensation,
  onSetFocusMode,
  onResetCameraControls,
  onStart,
  onStop,
  onSelectCategory,
  onCapture,
  onCloseDetailPanel,
  onOpenDetailPanel,
  onToggleFavoritePreview,
}: ControlPanelProps) {
  const isDetailOpen = detailPanel !== null
  const primaryActionDisabled =
    status === 'requesting' || (isFieldActive ? !canCapture : !canStart)
  const primaryActionLabel = status === 'requesting' ? 'Attendi' : isFieldActive ? 'Scatta' : 'Avvia'
  const primaryActionHint = status === 'requesting' ? 'camera' : isFieldActive ? 'preview' : 'live'
  const categoryLabel = category.shortLabel ?? category.label
  const toolsMeta = snapshots.length > 0 ? `${Math.min(99, snapshots.length)} prev.` : 'tools'

  return (
    <section className={`hud-controls hud-${hudState}`} aria-label="Controlli live">
      {isDetailOpen ? (
        <div className="detail-sheet" id="detail-sheet" role="dialog" aria-modal="false">
          <div className="detail-sheet-handle" aria-hidden="true" />

          <div className="detail-sheet-header">
            <div>
              <span className="detail-sheet-kicker">PROimago V0.1.9</span>
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

            {detailPanel === 'tools' ? (
              <ToolsPanel
                analysis={analysis}
                cameraInfo={cameraInfo}
                canStart={canStart}
                canStop={canStop}
                category={category}
                finalReadinessSummary={finalReadinessSummary}
                intervalMs={intervalMs}
                isFieldActive={isFieldActive}
                selectedReferencePreviewId={selectedReferencePreviewId}
                snapshots={snapshots}
                shootingConditionAdvice={shootingConditionAdvice}
                shootingConditions={shootingConditions}
                suggestion={suggestion}
                videoHeight={videoHeight}
                videoWidth={videoWidth}
                onDeletePreview={onDeletePreview}
                onSelectReferencePreview={onSelectReferencePreview}
                onStart={onStart}
                onStop={onStop}
                onToggleFavoritePreview={onToggleFavoritePreview}
                onSetZoom={onSetZoom}
                onSetTorch={onSetTorch}
                onSetExposureCompensation={onSetExposureCompensation}
                onSetFocusMode={onSetFocusMode}
                onResetCameraControls={onResetCameraControls}
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
          meta={isFieldActive ? toolsMeta : 'setup'}
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

type ToolsTabId = 'finale' | 'preview' | 'camera' | 'debug'

interface ToolsPanelProps {
  analysis: FrameAnalysis
  cameraInfo: CameraTrackInfo | null
  canStart: boolean
  canStop: boolean
  category: PhotoCategory
  finalReadinessSummary: FinalReadinessSummary
  intervalMs: number
  isFieldActive: boolean
  selectedReferencePreviewId: string | null
  snapshots: SnapshotItem[]
  shootingConditionAdvice: string
  shootingConditions: ShootingConditions
  suggestion: Suggestion
  videoHeight: number
  videoWidth: number
  onDeletePreview: (previewId: string) => void
  onSelectReferencePreview: (previewId: string) => void
  onStart: () => Promise<void>
  onStop: () => void
  onToggleFavoritePreview: (previewId: string) => void
  onSetZoom: (value: number) => Promise<CameraControlResult>
  onSetTorch: (on: boolean) => Promise<CameraControlResult>
  onSetExposureCompensation: (value: number) => Promise<CameraControlResult>
  onSetFocusMode: (mode: string) => Promise<CameraControlResult>
  onResetCameraControls: () => Promise<CameraControlResult>
}

function ToolsPanel({
  analysis,
  cameraInfo,
  canStart,
  canStop,
  category,
  finalReadinessSummary,
  intervalMs,
  isFieldActive,
  selectedReferencePreviewId,
  snapshots,
  shootingConditionAdvice,
  shootingConditions,
  suggestion,
  videoHeight,
  videoWidth,
  onDeletePreview,
  onSelectReferencePreview,
  onStart,
  onStop,
  onToggleFavoritePreview,
  onSetZoom,
  onSetTorch,
  onSetExposureCompensation,
  onSetFocusMode,
  onResetCameraControls,
}: ToolsPanelProps) {
  const [activeTab, setActiveTab] = useState<ToolsTabId>('finale')
  const composition = getCompositionScore(analysis)
  const aspectRatio =
    videoWidth > 0 && videoHeight > 0 ? (videoWidth / videoHeight).toFixed(2) : '--'
  const cameraLabel = cameraInfo?.facingMode ?? cameraInfo?.label ?? 'n/d'
  const controlSupport = cameraInfo?.controlSupport
  const settings = cameraInfo?.settings
  const favoritesCount = snapshots.filter((snapshot) => snapshot.isFavorite).length

  return (
    <div className="sheet-layout">
      <div className="sheet-tab-row" role="tablist" aria-label="Sezioni tools">
        <ToolsTabButton
          tabId="finale"
          label="Finale"
          isActive={activeTab === 'finale'}
          onClick={() => setActiveTab('finale')}
        />
        <ToolsTabButton
          tabId="preview"
          label={snapshots.length > 0 ? `Preview ${snapshots.length}` : 'Preview'}
          isActive={activeTab === 'preview'}
          onClick={() => setActiveTab('preview')}
        />
        <ToolsTabButton
          tabId="camera"
          label="Camera"
          isActive={activeTab === 'camera'}
          onClick={() => setActiveTab('camera')}
        />
        <ToolsTabButton
          tabId="debug"
          label="Debug"
          isActive={activeTab === 'debug'}
          onClick={() => setActiveTab('debug')}
        />
      </div>

      {activeTab === 'finale' ? (
        <>
          <section className="sheet-section">
            <div className="sheet-inline-header">
              <strong>Scatto finale</strong>
              <span>{finalReadinessSummary.finalReadinessLabel}</span>
            </div>
            <p className="sheet-body-copy">{finalReadinessSummary.finalReadinessReason}</p>
            <div className="sheet-detail-list">
              <span className="sheet-chip">{finalReadinessSummary.baseScoreLabel}</span>
              <span className={`sheet-badge ${getReadinessTone(shootingConditions.finalShotReadiness)}`}>
                {`Finale ${finalReadinessSummary.finalReadinessLabel}`}
              </span>
              <span className="sheet-chip">
                {`Stabilita ${formatStabilityHint(shootingConditions.stabilityHint)}`}
              </span>
              <span className="sheet-chip">
                {`Colori ${formatColorReliability(shootingConditions.colorReliability)}`}
              </span>
              {shootingConditions.lowLight ? <span className="sheet-chip">Poca luce</span> : null}
              {shootingConditions.harshLight ? <span className="sheet-chip">Luce dura</span> : null}
              {shootingConditions.artificialLightLikely ? (
                <span className="sheet-chip">Luce artificiale probabile</span>
              ) : null}
              {analysis.highlightClipping >= 4 ? (
                <span className="sheet-chip">{`Alte luci ${analysis.highlightClipping}`}</span>
              ) : null}
            </div>
            <p className="sheet-support-note">{`Azione consigliata: ${shootingConditionAdvice}`}</p>
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
              <span className="sheet-chip">{`Preview ${snapshots.length}`}</span>
              {favoritesCount > 0 ? <span className="sheet-chip">{`Preferite ${favoritesCount}`}</span> : null}
              {selectedReferencePreviewId ? (
                <span className="sheet-chip">Riferimento attivo</span>
              ) : null}
            </div>
            {snapshots.length > 0 ? (
              <div className="sheet-action-row">
                <button
                  type="button"
                  className="sheet-action-button"
                  onClick={() => setActiveTab('preview')}
                >
                  Apri anteprime
                </button>
              </div>
            ) : null}
          </section>
        </>
      ) : null}

      {activeTab === 'preview' ? (
        <>
          <section className="sheet-section">
            <div className="sheet-inline-header">
              <strong>Preview Board</strong>
              <span>{favoritesCount > 0 ? `${favoritesCount} preferite` : 'sessione locale'}</span>
            </div>
            <p className="sheet-body-copy">
              Confronta basi diverse, scegli una preferita e usa un riferimento senza lasciare la live view.
            </p>
            <div className="sheet-detail-list">
              {selectedReferencePreviewId ? (
                <span className="sheet-chip">Riferimento attivo</span>
              ) : (
                <span className="sheet-chip">Nessun riferimento attivo</span>
              )}
              <span className="sheet-chip">{`Preview ${snapshots.length}`}</span>
            </div>
          </section>

          <section className="sheet-section">
            <PreviewBoard
              previews={snapshots}
              selectedReferencePreviewId={selectedReferencePreviewId}
              onDeletePreview={onDeletePreview}
              onSelectReference={onSelectReferencePreview}
              onToggleFavorite={onToggleFavoritePreview}
            />
          </section>
        </>
      ) : null}

      {activeTab === 'camera' ? (
        <>
          <section className="sheet-section">
            <div className="sheet-inline-header">
              <strong>Camera</strong>
              <span>controlli dinamici</span>
            </div>
            <p className="sheet-body-copy">
              I controlli camera compaiono solo qui, cosi il live HUD resta leggero e pulito.
            </p>
            <CameraControlsSection
              key={getCameraControlsKey(cameraInfo)}
              cameraInfo={cameraInfo}
              onResetCameraControls={onResetCameraControls}
              onSetExposureCompensation={onSetExposureCompensation}
              onSetFocusMode={onSetFocusMode}
              onSetTorch={onSetTorch}
              onSetZoom={onSetZoom}
            />
          </section>

          <section className="sheet-section">
            <div className="sheet-inline-header">
              <strong>Camera Info</strong>
              <span>{cameraLabel}</span>
            </div>
            <div className="tools-grid">
              <MetricTile label="Zoom" value={formatSupportValue(controlSupport?.supportsZoom)} tone="good" />
              <MetricTile label="Torch" value={formatSupportValue(controlSupport?.supportsTorch)} tone="good" />
              <MetricTile
                label="Exposure"
                value={formatSupportValue(controlSupport?.supportsExposureCompensation)}
                tone="good"
              />
              <MetricTile
                label="Focus"
                value={formatSupportValue(controlSupport?.supportsFocusMode)}
                tone="good"
              />
              <MetricTile
                label="Bil. bianco"
                value={formatSupportValue(controlSupport?.supportsWhiteBalanceMode)}
                tone="good"
              />
              <MetricTile
                label="Facing"
                value={controlSupport?.facingMode ?? cameraLabel}
                tone="good"
              />
              <MetricTile
                label="Risoluzione"
                value={videoWidth > 0 && videoHeight > 0 ? `${videoWidth} x ${videoHeight}` : '--'}
                tone="good"
              />
              <MetricTile
                label="Settings"
                value={formatResolutionSettings(controlSupport)}
                tone="good"
              />
              <MetricTile label="Frame rate" value={formatFrameRate(settings?.frameRate)} tone="good" />
              <MetricTile label="Aspect" value={aspectRatio} tone="good" />
            </div>
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
        </>
      ) : null}

      {activeTab === 'debug' ? (
        <>
          <section className="sheet-section">
            <div className="sheet-inline-header">
              <strong>Diagnostics</strong>
              <span>{`refresh ${intervalMs} ms`}</span>
            </div>
            <div className="tools-grid">
              <MetricTile label="Base" value={`${analysis.score}`} tone={getScoreTone(analysis.score)} />
              <MetricTile
                label="Composizione"
                value={`${composition}`}
                tone={getScoreTone(composition)}
              />
              <MetricTile
                label="Luce"
                value={`${analysis.brightness}%`}
                tone={getMetricTone(analysis.brightness, 28, 46)}
              />
              <MetricTile
                label="Contrasto"
                value={`${analysis.contrast}%`}
                tone={getMetricTone(analysis.contrast, 24, 42)}
              />
              <MetricTile
                label="Saturazione"
                value={`${analysis.saturation}%`}
                tone={getSaturationTone(analysis.saturation)}
              />
              <MetricTile
                label="Nitidezza"
                value={`${analysis.sharpness}`}
                tone={getSharpnessTone(analysis.sharpness)}
              />
              <MetricTile
                label="Clutter"
                value={`${analysis.backgroundClutter}`}
                tone={getClutterTone(analysis.backgroundClutter)}
              />
              <MetricTile
                label="Highlights"
                value={`${analysis.highlightClipping}%`}
                tone={getHighlightTone(analysis.highlightClipping)}
              />
              <MetricTile
                label="Shadows"
                value={`${analysis.shadowClipping ?? 0}%`}
                tone={getShadowTone(analysis.shadowClipping ?? 0)}
              />
              <MetricTile
                label="Dominante"
                value={analysis.colorTemperatureHint ?? '--'}
                tone={analysis.colorTemperatureHint === 'warm' ? 'warn' : 'good'}
              />
              <MetricTile label="Frame" value={`${videoWidth} x ${videoHeight}`} tone="good" />
              <MetricTile label="Aspect" value={aspectRatio} tone="good" />
            </div>
          </section>

          <section className="sheet-section">
            <div className="sheet-inline-header">
              <strong>Frame values</strong>
              <span>{cameraLabel}</span>
            </div>
            <div className="sheet-detail-list">
              <span className="sheet-chip">{`Dominant x ${analysis.dominantPoint.x.toFixed(2)}`}</span>
              <span className="sheet-chip">{`Dominant y ${analysis.dominantPoint.y.toFixed(2)}`}</span>
              <span className="sheet-chip">{`Spread ${analysis.dominantSpread.toFixed(2)}`}</span>
              <span className="sheet-chip">{`Peso ${analysis.dominantWeight}`}</span>
              <span className="sheet-chip">{`Top empty ${analysis.topEmptySpace}`}</span>
              <span className="sheet-chip">{`Categoria ${category.label}`}</span>
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}

interface ToolsTabButtonProps {
  tabId: ToolsTabId
  label: string
  isActive: boolean
  onClick: () => void
}

function ToolsTabButton({ tabId, label, isActive, onClick }: ToolsTabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      id={`tools-tab-${tabId}`}
      aria-selected={isActive}
      className={`sheet-tab-button ${isActive ? 'is-active' : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

interface CameraControlsSectionProps {
  cameraInfo: CameraTrackInfo | null
  onSetZoom: (value: number) => Promise<CameraControlResult>
  onSetTorch: (on: boolean) => Promise<CameraControlResult>
  onSetExposureCompensation: (value: number) => Promise<CameraControlResult>
  onSetFocusMode: (mode: string) => Promise<CameraControlResult>
  onResetCameraControls: () => Promise<CameraControlResult>
}

function CameraControlsSection({
  cameraInfo,
  onSetZoom,
  onSetTorch,
  onSetExposureCompensation,
  onSetFocusMode,
  onResetCameraControls,
}: CameraControlsSectionProps) {
  const controlSupport = cameraInfo?.controlSupport
  const [zoomValue, setZoomValue] = useState(controlSupport?.currentZoom ?? controlSupport?.zoomMin ?? 1)
  const [exposureValue, setExposureValue] = useState(
    controlSupport?.currentExposure ?? controlSupport?.exposureMin ?? 0,
  )
  const [cameraControlMessage, setCameraControlMessage] = useState<string | null>(null)

  if (!cameraInfo || !controlSupport) {
    return (
      <div className="sheet-empty-state">
        Avvia la camera per leggere capabilities, settings e controlli disponibili.
      </div>
    )
  }

  const handleZoomChange = async (value: number) => {
    setZoomValue(value)
    const result = await onSetZoom(value)
    setCameraControlMessage(
      result.ok
        ? `Zoom impostato su ${formatZoomValue(value)}.`
        : result.error ?? getUnsupportedControlCopy(),
    )
  }

  const handleTorchToggle = async () => {
    const result = await onSetTorch(!controlSupport.torchOn)
    setCameraControlMessage(
      result.ok
        ? !controlSupport.torchOn
          ? 'Luce continua attivata.'
          : 'Luce continua disattivata.'
        : result.error ?? getUnsupportedControlCopy(),
    )
  }

  const handleExposureChange = async (value: number) => {
    setExposureValue(value)
    const result = await onSetExposureCompensation(value)
    setCameraControlMessage(
      result.ok
        ? `Esposizione impostata su ${formatControlValue(value)}.`
        : result.error ?? getUnsupportedControlCopy(),
    )
  }

  const handleFocusModeChange = async (mode: string) => {
    const result = await onSetFocusMode(mode)
    setCameraControlMessage(
      result.ok ? `Fuoco impostato su ${mode}.` : result.error ?? getUnsupportedControlCopy(),
    )
  }

  const handleResetControls = async () => {
    const result = await onResetCameraControls()
    setCameraControlMessage(
      result.ok ? 'Controlli camera ripristinati.' : result.error ?? getUnsupportedControlCopy(),
    )
  }

  return (
    <div className="camera-controls-stack">
      <div className="camera-control-grid">
        <section className="camera-control-card">
          <div className="camera-control-header">
            <strong>Lente / Zoom</strong>
            <span>
              {controlSupport.supportsZoom && typeof zoomValue === 'number'
                ? formatZoomValue(zoomValue)
                : 'n/d'}
            </span>
          </div>
          {controlSupport.supportsZoom ? (
            <>
              <input
                type="range"
                className="camera-slider"
                min={controlSupport.zoomMin}
                max={controlSupport.zoomMax}
                step={controlSupport.zoomStep ?? 0.1}
                value={zoomValue}
                onChange={(event) => void handleZoomChange(Number(event.target.value))}
              />
              <p className="camera-control-note">
                {`Range ${formatZoomValue(controlSupport.zoomMin)} - ${formatZoomValue(controlSupport.zoomMax)}`}
              </p>
            </>
          ) : (
            <p className="camera-control-note">{getUnsupportedControlCopy()}</p>
          )}
        </section>

        <section className="camera-control-card">
          <div className="camera-control-header">
            <strong>Luce / Torch</strong>
            <span>{controlSupport.torchOn ? 'attiva' : 'spenta'}</span>
          </div>
          {controlSupport.supportsTorch ? (
            <button
              type="button"
              className={`camera-toggle ${controlSupport.torchOn ? 'is-on' : ''}`}
              onClick={() => void handleTorchToggle()}
              aria-pressed={Boolean(controlSupport.torchOn)}
            >
              Luce continua
            </button>
          ) : (
            <p className="camera-control-note">{getUnsupportedControlCopy()}</p>
          )}
        </section>

        <section className="camera-control-card">
          <div className="camera-control-header">
            <strong>Esposizione</strong>
            <span>
              {controlSupport.supportsExposureCompensation && typeof exposureValue === 'number'
                ? formatControlValue(exposureValue)
                : 'n/d'}
            </span>
          </div>
          {controlSupport.supportsExposureCompensation ? (
            <>
              <input
                type="range"
                className="camera-slider"
                min={controlSupport.exposureMin}
                max={controlSupport.exposureMax}
                step={controlSupport.exposureStep ?? 0.1}
                value={exposureValue}
                onChange={(event) => void handleExposureChange(Number(event.target.value))}
              />
              <p className="camera-control-note">
                {`Range ${formatControlValue(controlSupport.exposureMin)} - ${formatControlValue(controlSupport.exposureMax)}`}
              </p>
            </>
          ) : (
            <p className="camera-control-note">{getUnsupportedControlCopy()}</p>
          )}
        </section>

        <section className="camera-control-card">
          <div className="camera-control-header">
            <strong>Fuoco</strong>
            <span>{controlSupport.currentFocusMode ?? 'n/d'}</span>
          </div>
          {controlSupport.supportsFocusMode && controlSupport.supportedFocusModes?.length ? (
            <>
              <div className="camera-mode-row">
                {controlSupport.supportedFocusModes.map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={`camera-mode-chip ${mode === controlSupport.currentFocusMode ? 'active' : ''}`}
                    onClick={() => void handleFocusModeChange(mode)}
                    aria-pressed={mode === controlSupport.currentFocusMode}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <p className="camera-control-note">
                {typeof controlSupport.currentFocusDistance === 'number'
                  ? `Distanza fuoco ${formatControlValue(controlSupport.currentFocusDistance)}`
                  : 'Il browser non espone una distanza di fuoco leggibile.'}
              </p>
            </>
          ) : (
            <p className="camera-control-note">{getUnsupportedControlCopy()}</p>
          )}
        </section>

        <section className="camera-control-card">
          <div className="camera-control-header">
            <strong>Bilanciamento bianco</strong>
            <span>{controlSupport.currentWhiteBalanceMode ?? 'n/d'}</span>
          </div>
          {controlSupport.supportsWhiteBalanceMode ? (
            <p className="camera-control-note">
              {controlSupport.supportedWhiteBalanceModes?.join(', ') ?? 'Modalita non esposte.'}
            </p>
          ) : (
            <p className="camera-control-note">{getUnsupportedControlCopy()}</p>
          )}
        </section>

        <section className="camera-control-card">
          <div className="camera-control-header">
            <strong>Risoluzione reale</strong>
            <span>{formatResolutionSettings(controlSupport)}</span>
          </div>
          <p className="camera-control-note">
            {`Facing ${controlSupport.facingMode ?? 'n/d'} · ${formatFrameRate(controlSupport.frameRate)}`}
          </p>
        </section>
      </div>

      <div className="camera-controls-footer">
        <button
          type="button"
          className="sheet-action-button"
          onClick={() => void handleResetControls()}
        >
          Ripristina controlli
        </button>
        <p className="sheet-support-note">
          {cameraControlMessage ?? 'I controlli compaiono solo se il browser li espone davvero.'}
        </p>
      </div>
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
    case 'tools':
    default:
      return 'Altro / Tools'
  }
}

function getPanelSubtitle(detailPanel: DetailPanelId) {
  switch (detailPanel) {
    case 'category':
      return 'Scegli il tipo di scena senza lasciare la live view.'
    case 'tools':
    default:
      return 'Finale, preview, camera e debug in un pannello compatto senza sporcare la scena.'
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

function getReadinessTone(readiness: ShootingConditions['finalShotReadiness']) {
  switch (readiness) {
    case 'good':
      return 'good' as const
    case 'usable':
      return 'improve' as const
    case 'not_ideal':
    default:
      return 'warning' as const
  }
}

function getFamilyLabel(family: Suggestion['family']) {
  switch (family) {
    case 'camera':
      return 'Camera'
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

function getSharpnessTone(value: number) {
  if (value < 28) {
    return 'bad' as const
  }

  if (value < 48) {
    return 'warn' as const
  }

  return 'good' as const
}

function getClutterTone(value: number) {
  if (value > 68) {
    return 'bad' as const
  }

  if (value > 48) {
    return 'warn' as const
  }

  return 'good' as const
}

function getHighlightTone(value: number) {
  if (value >= 8) {
    return 'bad' as const
  }

  if (value >= 4) {
    return 'warn' as const
  }

  return 'good' as const
}

function getShadowTone(value: number) {
  if (value >= 20) {
    return 'bad' as const
  }

  if (value >= 10) {
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

function getCameraControlsKey(cameraInfo: CameraTrackInfo | null) {
  const controlSupport = cameraInfo?.controlSupport

  return [
    cameraInfo?.label ?? 'camera',
    controlSupport?.currentZoom ?? 'zoom',
    controlSupport?.currentExposure ?? 'exposure',
    controlSupport?.torchOn ?? 'torch',
    controlSupport?.currentFocusMode ?? 'focus',
  ].join(':')
}

function formatSupportValue(value: boolean | undefined) {
  if (typeof value !== 'boolean') {
    return 'n/d'
  }

  return value ? 'si' : 'no'
}

function formatResolutionSettings(
  controlSupport: CameraTrackInfo['controlSupport'] | null | undefined,
) {
  if (!controlSupport?.width || !controlSupport?.height) {
    return 'n/d'
  }

  return `${Math.round(controlSupport.width)} x ${Math.round(controlSupport.height)}`
}

function formatFrameRate(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'n/d'
  }

  return `${value.toFixed(value < 10 ? 1 : 0)} fps`
}

function formatZoomValue(value: number | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'n/d'
  }

  return `${value.toFixed(value < 10 ? 1 : 0)}x`
}

function formatControlValue(value: number | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'n/d'
  }

  return value.toFixed(Math.abs(value) < 10 ? 1 : 0)
}

function getUnsupportedControlCopy() {
  return 'Controllo non disponibile in questo browser. PROimago puo comunque suggerire come usare la lente o cambiare angolo.'
}

function formatStabilityHint(stabilityHint: ShootingConditions['stabilityHint']) {
  switch (stabilityHint) {
    case 'good':
      return 'buona'
    case 'acceptable':
      return 'accettabile'
    case 'unstable':
    default:
      return 'instabile'
  }
}

function formatColorReliability(colorReliability: ShootingConditions['colorReliability']) {
  switch (colorReliability) {
    case 'good':
      return 'affidabili'
    case 'medium':
      return 'medi'
    case 'low':
    default:
      return 'deboli'
  }
}
