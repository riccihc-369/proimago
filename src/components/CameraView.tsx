import type { RefObject } from 'react'
import type { CameraStatus } from '../types'

interface CameraViewProps {
  videoRef: RefObject<HTMLVideoElement | null>
  status: CameraStatus
  error: string | null
  isSupported: boolean
  statusLabel: string
}

export function CameraView({
  videoRef,
  status,
  error,
  isSupported,
  statusLabel,
}: CameraViewProps) {
  const showStatus = !isSupported || status !== 'ready' || Boolean(error)

  return (
    <div className="camera-view">
      <video
        ref={videoRef}
        className="camera-video"
        playsInline
        autoPlay
        muted
        disablePictureInPicture
        controlsList="nofullscreen nodownload noremoteplayback"
        aria-label="Anteprima live della camera posteriore"
      />

      {showStatus ? (
        <div className="camera-status" role="status" aria-live="polite">
          <div className="camera-status-card">
            <strong>PROimago V0.1.7</strong>
            <span>Shooting Conditions Advisor</span>
            <p>{statusLabel}</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
