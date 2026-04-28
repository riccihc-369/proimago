import type { SnapshotItem } from '../types'

interface SnapshotStripProps {
  snapshots: SnapshotItem[]
}

export function SnapshotStrip({ snapshots }: SnapshotStripProps) {
  return (
    <section className="snapshot-strip">
      <div className="snapshot-strip-header">
        <h2>Anteprime salvate</h2>
        <p>{snapshots.length}/12 in memoria</p>
      </div>

      {snapshots.length === 0 ? (
        <div className="snapshot-empty">
          Scatta una preview per confrontare le composizioni senza uscire dal live view.
        </div>
      ) : (
        <div className="snapshot-list">
          {snapshots.map((snapshot) => (
            <article key={snapshot.id} className="snapshot-card">
              <img
                src={snapshot.dataUrl}
                alt={`Snapshot ${formatTimestamp(snapshot.timestamp)}`}
              />
              <div className="snapshot-meta">
                <div className="snapshot-tags">
                  <span className="snapshot-chip">{snapshot.mode}</span>
                  <span className="snapshot-chip">Score {snapshot.score}</span>
                </div>
                <strong>{formatTimestamp(snapshot.timestamp)}</strong>
                <span className="snapshot-suggestion">{snapshot.suggestion.message}</span>
              </div>
            </article>
          ))}
        </div>
      )}
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
