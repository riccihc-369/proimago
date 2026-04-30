import { useMemo, useState } from 'react'
import { decideBestPreview, getReferencePreviewHint } from '../analysis/previewDecision'
import type { SnapshotItem, SuggestionSeverity } from '../types'

interface PreviewBoardProps {
  focusPreviewId?: string | null
  previews: SnapshotItem[]
  selectedReferencePreviewId: string | null
  onDeletePreview: (previewId: string) => void
  onSelectReference: (previewId: string) => void
  onToggleFavorite: (previewId: string) => void
}

export function PreviewBoard({
  focusPreviewId = null,
  previews,
  selectedReferencePreviewId,
  onDeletePreview,
  onSelectReference,
  onToggleFavorite,
}: PreviewBoardProps) {
  const decision = useMemo(() => decideBestPreview(previews), [previews])
  const [openPreviewId, setOpenPreviewId] = useState<string | null>(focusPreviewId)

  const bestPreviewIndex = previews.findIndex((preview) => preview.id === decision.bestPreviewId)
  const openPreview = previews.find((preview) => preview.id === openPreviewId) ?? null

  return (
    <div className="preview-board">
      <div className="preview-board-header">
        <div className="sheet-inline-header">
          <strong>Anteprime</strong>
          <span>{previews.length}/24 in memoria</span>
        </div>
        <p className="sheet-body-copy">
          Le anteprime restano sul dispositivo in questa sessione.
        </p>
      </div>

      {previews.length === 0 ? (
        <div className="sheet-empty-state">
          Scatta una preview dal live view per confrontare composizione, luce e nitidezza.
        </div>
      ) : (
        <>
          <div className="preview-board-summary">
            {decision.bestPreviewId && bestPreviewIndex >= 0 ? (
              <p>
                {`La migliore base sembra: Preview #${bestPreviewIndex + 1} - ${decision.reason}.`}
              </p>
            ) : (
              <p>{decision.reason}</p>
            )}
          </div>

          {openPreview ? (
            <PreviewDetail
              preview={openPreview}
              referenceHint={getReferencePreviewHint(openPreview)}
              selectedReferencePreviewId={selectedReferencePreviewId}
              onClose={() => setOpenPreviewId(null)}
              onDelete={() => {
                onDeletePreview(openPreview.id)
                setOpenPreviewId(null)
              }}
              onSelectReference={() => onSelectReference(openPreview.id)}
              onToggleFavorite={() => onToggleFavorite(openPreview.id)}
            />
          ) : null}

          <div className="preview-board-grid">
            {previews.map((preview, index) => {
              const isReference = preview.id === selectedReferencePreviewId
              const isBest = preview.id === decision.bestPreviewId

              return (
                <article
                  key={preview.id}
                  className={`preview-card ${isReference ? 'is-reference' : ''}`}
                >
                  <button
                    type="button"
                    className="preview-card-visual"
                    onClick={() => setOpenPreviewId(preview.id)}
                    aria-label={`Apri preview ${index + 1}`}
                  >
                    <img
                      src={preview.thumbnailDataUrl ?? preview.imageDataUrl}
                      alt={`Preview ${index + 1}`}
                    />
                    <div className="preview-card-topline">
                      <span className="sheet-chip">{preview.categoryLabel}</span>
                      <span className="sheet-chip">{`Score ${preview.score}`}</span>
                    </div>
                    <div className="preview-card-flags">
                      {isBest ? <span className="sheet-badge info">Base migliore</span> : null}
                      {preview.isFavorite ? (
                        <span className="sheet-badge good">Preferita</span>
                      ) : null}
                      {isReference ? (
                        <span className="sheet-badge warn">Riferimento</span>
                      ) : null}
                    </div>
                  </button>

                  <div className="preview-card-meta">
                    <strong>{`Preview #${index + 1}`}</strong>
                    <span>{formatTimestamp(preview.createdAt)}</span>
                    <p>{preview.suggestionText}</p>
                  </div>

                  <div className="preview-card-actions">
                    <button
                      type="button"
                      className="sheet-action-button"
                      onClick={() => onToggleFavorite(preview.id)}
                    >
                      {preview.isFavorite ? 'Togli preferita' : 'Preferita'}
                    </button>
                    <button
                      type="button"
                      className="sheet-action-button"
                      onClick={() => onDeletePreview(preview.id)}
                    >
                      Elimina
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

interface PreviewDetailProps {
  preview: SnapshotItem
  referenceHint: string
  selectedReferencePreviewId: string | null
  onClose: () => void
  onDelete: () => void
  onSelectReference: () => void
  onToggleFavorite: () => void
}

function PreviewDetail({
  preview,
  referenceHint,
  selectedReferencePreviewId,
  onClose,
  onDelete,
  onSelectReference,
  onToggleFavorite,
}: PreviewDetailProps) {
  const isReference = preview.id === selectedReferencePreviewId

  return (
    <section className="preview-detail-card">
      <img src={preview.imageDataUrl} alt="Anteprima selezionata" className="preview-detail-image" />

      <div className="preview-detail-body">
        <div className="sheet-inline-header">
          <strong>{preview.categoryLabel}</strong>
          <span>{`Score ${preview.score}`}</span>
        </div>

        <div className="sheet-detail-list">
          <span className="sheet-chip">{getFamilyLabel(preview.suggestionFamily)}</span>
          <span className={`sheet-badge ${preview.suggestionSeverity}`}>
            {getSeverityLabel(preview.suggestionSeverity)}
          </span>
          {preview.isFavorite ? <span className="sheet-badge good">Preferita</span> : null}
          {isReference ? <span className="sheet-badge warn">Riferimento attivo</span> : null}
        </div>

        <p className="sheet-body-copy">{preview.suggestionText}</p>

        {isReference ? (
          <div className="preview-reference-callout">
            <strong>Stai cercando di migliorare questa anteprima.</strong>
            <p>{referenceHint}</p>
          </div>
        ) : null}

        <div className="preview-detail-metrics">
          <span className="sheet-chip">{`Composizione / Score ${preview.score}`}</span>
          <span className="sheet-chip">{`Luce ${preview.brightness}`}</span>
          <span className="sheet-chip">{`Contrasto ${preview.contrast}`}</span>
          <span className="sheet-chip">{`Sat ${preview.saturation}`}</span>
          {typeof preview.sharpness === 'number' ? (
            <span className="sheet-chip">{`Nit ${preview.sharpness}`}</span>
          ) : null}
          {preview.cameraSettings?.zoom ? (
            <span className="sheet-chip">{`Zoom ${formatZoomValue(preview.cameraSettings.zoom)}`}</span>
          ) : null}
          {preview.cameraSettings?.width && preview.cameraSettings?.height ? (
            <span className="sheet-chip">
              {`${preview.cameraSettings.width} x ${preview.cameraSettings.height}`}
            </span>
          ) : null}
          {preview.cameraSettings?.frameRate ? (
            <span className="sheet-chip">{formatFrameRate(preview.cameraSettings.frameRate)}</span>
          ) : null}
          {preview.cameraSettings?.facingMode ? (
            <span className="sheet-chip">{preview.cameraSettings.facingMode}</span>
          ) : null}
        </div>

        <div className="sheet-action-row">
          <button type="button" className="sheet-action-button" onClick={onToggleFavorite}>
            {preview.isFavorite ? 'Togli preferita' : 'Preferita'}
          </button>
          <button type="button" className="sheet-action-button" onClick={onDelete}>
            Elimina
          </button>
          <button
            type="button"
            className="sheet-action-button accent"
            onClick={onSelectReference}
            disabled={isReference}
          >
            {isReference ? 'Riferimento attivo' : 'Usa come riferimento'}
          </button>
          <button type="button" className="sheet-action-button" onClick={onClose}>
            Chiudi
          </button>
        </div>
      </div>
    </section>
  )
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

function formatZoomValue(value: number) {
  return `${value.toFixed(value < 10 ? 1 : 0)}x`
}

function formatFrameRate(value: number) {
  return `${value.toFixed(value < 10 ? 1 : 0)} fps`
}

function getSeverityLabel(severity: SuggestionSeverity) {
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

function getFamilyLabel(family: SnapshotItem['suggestionFamily']) {
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
