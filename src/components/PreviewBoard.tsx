import { useEffect, useMemo, useRef, useState } from 'react'
import { getFinalReadinessSummary } from '../analysis/finalReadiness'
import { decideBestPreview, getReferencePreviewHint } from '../analysis/previewDecision'
import { copyPreviewImage, savePreviewImage, sharePreviewImage } from '../utils/exportPreview'
import type { FinalShotReadiness, SnapshotItem, SuggestionSeverity } from '../types'

interface PreviewBoardProps {
  previews: SnapshotItem[]
  selectedReferencePreviewId: string | null
  onDeletePreview: (previewId: string) => void
  onSelectReference: (previewId: string) => void
  onToggleFavorite: (previewId: string) => void
}

export function PreviewBoard({
  previews,
  selectedReferencePreviewId,
  onDeletePreview,
  onSelectReference,
  onToggleFavorite,
}: PreviewBoardProps) {
  const decision = useMemo(() => decideBestPreview(previews), [previews])
  const [openPreviewId, setOpenPreviewId] = useState<string | null>(null)

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
              key={openPreview.id}
              preview={openPreview}
              previewNumber={previews.findIndex((preview) => preview.id === openPreview.id) + 1}
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
                      <span className="sheet-chip">{`Base ${preview.score}`}</span>
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
                    <span>{`Finale ${formatFinalShotReadiness(preview.finalShotReadiness)}`}</span>
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
  previewNumber: number
  referenceHint: string
  selectedReferencePreviewId: string | null
  onClose: () => void
  onDelete: () => void
  onSelectReference: () => void
  onToggleFavorite: () => void
}

function PreviewDetail({
  preview,
  previewNumber,
  referenceHint,
  selectedReferencePreviewId,
  onClose,
  onDelete,
  onSelectReference,
  onToggleFavorite,
}: PreviewDetailProps) {
  const isReference = preview.id === selectedReferencePreviewId
  const [exportMessage, setExportMessage] = useState<string | null>(null)
  const exportTimerRef = useRef<number | null>(null)
  const finalReadinessSummary = getFinalReadinessSummary(
    preview.score,
    preview.shootingConditions,
    {
      categoryId: preview.categoryId,
      highlightClipping: preview.highlightClipping,
      shadowClipping: preview.shadowClipping,
    },
  )
  const finalReadinessReason = preview.finalReadinessReason || finalReadinessSummary.finalReadinessReason

  useEffect(() => {
    return () => {
      if (exportTimerRef.current !== null) {
        window.clearTimeout(exportTimerRef.current)
      }
    }
  }, [])

  const showExportMessage = (message: string) => {
    if (exportTimerRef.current !== null) {
      window.clearTimeout(exportTimerRef.current)
    }

    setExportMessage(message)
    exportTimerRef.current = window.setTimeout(() => {
      setExportMessage(null)
      exportTimerRef.current = null
    }, 2600)
  }

  const handleSave = async () => {
    const result = await savePreviewImage(preview)
    showExportMessage(result.message)
  }

  const handleShare = async () => {
    const result = await sharePreviewImage(preview)
    showExportMessage(result.message)
  }

  const handleCopy = async () => {
    const result = await copyPreviewImage(preview)
    showExportMessage(result.message)
  }

  return (
    <section className="preview-detail-card">
      <img src={preview.imageDataUrl} alt="Anteprima selezionata" className="preview-detail-image" />

      <div className="preview-detail-body">
        <div className="preview-detail-headline">
          <strong>
            {`Preview #${previewNumber} · ${preview.categoryLabel} · ${finalReadinessSummary.baseScoreLabel} · Finale ${finalReadinessSummary.finalReadinessLabel.toLowerCase()}`}
          </strong>
          <span>{formatTimestamp(preview.createdAt)}</span>
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

        <div className="preview-condition-callout">
          <strong>{`Finale: ${finalReadinessSummary.finalReadinessLabel}`}</strong>
          <p>{finalReadinessReason}</p>
        </div>

        <p className="sheet-support-note">{`Azione consigliata: ${preview.conditionAdvice}`}</p>

        {preview.highlightClipping >= 6 ? (
          <div className="preview-warning-callout">
            <strong>Riflessi / alte luci</strong>
            <p>Attenzione: dettagli chiari persi o troppo compressi.</p>
          </div>
        ) : null}

        {isReference ? (
          <div className="preview-reference-callout">
            <strong>Stai cercando di migliorare questa anteprima.</strong>
            <p>{referenceHint}</p>
          </div>
        ) : null}

        <div className="preview-detail-metrics">
          <span className="sheet-chip">{finalReadinessSummary.baseScoreLabel}</span>
          <span className="sheet-chip">{`Finale ${finalReadinessSummary.finalReadinessLabel}`}</span>
          <span className="sheet-chip">{`Luce ${preview.brightness}`}</span>
          <span className="sheet-chip">{`Contrasto ${preview.contrast}`}</span>
          <span className="sheet-chip">{`Sat ${preview.saturation}`}</span>
          {typeof preview.sharpness === 'number' ? (
            <span className="sheet-chip">{`Nit ${preview.sharpness}`}</span>
          ) : null}
          <span className="sheet-chip">{`Alte luci ${preview.highlightClipping}`}</span>
          {typeof preview.shadowClipping === 'number' ? (
            <span className="sheet-chip">{`Ombre ${preview.shadowClipping}`}</span>
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

        <div className="preview-action-groups">
          <section className="preview-action-group">
            <div className="preview-action-header">
              <strong>Esporta</strong>
            </div>
            <div className="preview-action-grid">
              <button type="button" className="sheet-action-button accent compact" onClick={() => void handleSave()}>
                Salva
              </button>
              <button type="button" className="sheet-action-button compact" onClick={() => void handleShare()}>
                Condividi
              </button>
              <button type="button" className="sheet-action-button compact" onClick={() => void handleCopy()}>
                Copia
              </button>
            </div>
          </section>

          <section className="preview-action-group">
            <div className="preview-action-header">
              <strong>Selezione</strong>
            </div>
            <div className="preview-action-grid">
              <button type="button" className="sheet-action-button compact" onClick={onToggleFavorite}>
                {preview.isFavorite ? 'Togli pref.' : 'Preferita'}
              </button>
              <button
                type="button"
                className="sheet-action-button compact"
                onClick={onSelectReference}
                disabled={isReference}
              >
                {isReference ? 'Riferimento' : 'Usa rif.'}
              </button>
              <button type="button" className="sheet-action-button compact" onClick={onDelete}>
                Elimina
              </button>
            </div>
          </section>
        </div>

        <div className="preview-detail-footer">
          {exportMessage ? <p className="preview-export-feedback">{exportMessage}</p> : <span />}
          <button type="button" className="sheet-action-button compact preview-close-button" onClick={onClose}>
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

function formatFinalShotReadiness(readiness: FinalShotReadiness) {
  switch (readiness) {
    case 'good':
      return 'Pronto'
    case 'usable':
      return 'Usabile'
    case 'not_ideal':
    default:
      return 'Rimandabile'
  }
}
