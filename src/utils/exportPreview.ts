import type { ExportResult, SnapshotItem } from '../types'

export function canCopyPreviewImage() {
  return (
    typeof navigator !== 'undefined' &&
    typeof ClipboardItem !== 'undefined' &&
    Boolean(navigator.clipboard?.write)
  )
}

export async function savePreviewImage(preview: SnapshotItem): Promise<ExportResult> {
  try {
    const file = createPreviewFile(preview)
    const objectUrl = URL.createObjectURL(file)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = file.name
    anchor.rel = 'noopener'
    anchor.click()

    window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl)
    }, 0)

    return {
      ok: true,
      status: 'saved',
      message: 'Preview esportata in JPEG sul dispositivo.',
    }
  } catch {
    return {
      ok: false,
      status: 'error',
      message: 'Impossibile esportare la preview in questo momento.',
    }
  }
}

export async function sharePreviewImage(preview: SnapshotItem): Promise<ExportResult> {
  try {
    const file = createPreviewFile(preview)
    const shareNavigator = navigator as Navigator & {
      canShare?: (data?: ShareData) => boolean
      share?: (data?: ShareData) => Promise<void>
    }

    if (typeof shareNavigator.share === 'function') {
      if (typeof shareNavigator.canShare === 'function' && shareNavigator.canShare({ files: [file] })) {
        await shareNavigator.share({
          files: [file],
          title: getPreviewTitle(preview),
          text: getPreviewText(preview),
        })

        return {
          ok: true,
          status: 'shared',
          message: 'Preview condivisa.',
        }
      }

      const previewWindow = window.open(preview.imageDataUrl, '_blank', 'noopener,noreferrer')
      if (previewWindow) {
        return {
          ok: true,
          status: 'opened',
          message: "Anteprima aperta in una nuova scheda per salvarla o condividerla.",
        }
      }
    }

    return savePreviewImage(preview)
  } catch (caughtError) {
    if (caughtError instanceof DOMException && caughtError.name === 'AbortError') {
      return {
        ok: false,
        status: 'error',
        message: 'Condivisione annullata.',
      }
    }

    return {
      ok: false,
      status: 'error',
      message: 'Impossibile condividere la preview in questo momento.',
    }
  }
}

export async function copyPreviewImage(preview: SnapshotItem): Promise<ExportResult> {
  if (!canCopyPreviewImage()) {
    return {
      ok: false,
      status: 'error',
      message: "Copia immagine non disponibile in questo browser.",
    }
  }

  try {
    const file = createPreviewFile(preview)
    const clipboardItem = new ClipboardItem({
      [file.type]: file,
    })
    await navigator.clipboard.write([clipboardItem])

    return {
      ok: true,
      status: 'copied',
      message: 'Immagine copiata negli appunti.',
    }
  } catch {
    return {
      ok: false,
      status: 'error',
      message: "Impossibile copiare l'immagine negli appunti.",
    }
  }
}

function createPreviewFile(preview: SnapshotItem) {
  const blob = dataUrlToBlob(preview.imageDataUrl)
  return new File([blob], buildPreviewFileName(preview), {
    type: 'image/jpeg',
    lastModified: preview.createdAt,
  })
}

function dataUrlToBlob(dataUrl: string) {
  const [metadata, base64] = dataUrl.split(',')
  const mimeMatch = metadata.match(/data:(.*?);base64/)
  const mimeType = mimeMatch?.[1] ?? 'image/jpeg'
  const binary = atob(base64 ?? '')
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return new Blob([bytes], { type: mimeType })
}

function buildPreviewFileName(preview: SnapshotItem) {
  const timestamp = new Date(preview.createdAt).toISOString().replace(/[:.]/g, '-')
  return `proimago-${preview.categoryId}-${timestamp}.jpg`
}

function getPreviewTitle(preview: SnapshotItem) {
  return `PROimago ${preview.categoryLabel}`
}

function getPreviewText(preview: SnapshotItem) {
  return `Preview ${preview.categoryLabel} · Base ${preview.score}`
}
