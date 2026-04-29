import type { PhotoCategory, PhotoCategoryId } from '../types'

interface ControlPanelProps {
  category: PhotoCategory
  categories: PhotoCategory[]
  isFieldActive: boolean
  canStart: boolean
  canStop: boolean
  canCapture: boolean
  onStart: () => Promise<void>
  onStop: () => void
  onCycleCategory: () => void
  onSelectCategory: (categoryId: PhotoCategoryId) => void
  onCapture: () => void
}

export function ControlPanel({
  category,
  categories,
  isFieldActive,
  canStart,
  canStop,
  canCapture,
  onStart,
  onStop,
  onCycleCategory,
  onSelectCategory,
  onCapture,
}: ControlPanelProps) {
  return (
    <section className={`control-panel ${isFieldActive ? 'field' : ''}`}>
      <div className="control-header">
        <div>
          <h1>PROimago V0.1.2</h1>
          <p>iPhone Field UX + categorie + rendering advice</p>
        </div>
        <div className="mode-chip">Categoria: {category.label}</div>
      </div>

      <div className="category-intro">
        <strong>Scegli cosa vuoi rappresentare</strong>
        <span>PROimago consiglia come valorizzare la scena scelta.</span>
      </div>

      <div className="control-actions">
        {!isFieldActive ? (
          <button
            type="button"
            className="control-button primary"
            onClick={onStart}
            disabled={!canStart}
          >
            Avvia camera
          </button>
        ) : null}
        <button
          type="button"
          className={`control-button ${isFieldActive ? 'primary' : 'secondary'}`}
          onClick={onStop}
          disabled={!canStop}
        >
          Stop camera
        </button>
        <button
          type="button"
          className={`control-button secondary ${isFieldActive ? 'field-emphasis' : ''}`}
          onClick={onCycleCategory}
        >
          Cambia categoria
        </button>
        <button
          type="button"
          className={`control-button ${isFieldActive ? 'primary' : 'secondary'}`}
          onClick={onCapture}
          disabled={!canCapture}
        >
          Scatta anteprima
        </button>
      </div>

      <div className="mode-rail" aria-label="Seleziona categoria">
        {categories.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`mode-option ${item.id === category.id ? 'active' : ''}`}
            aria-pressed={item.id === category.id}
            onClick={() => onSelectCategory(item.id)}
            title={item.description}
          >
            {item.shortLabel ?? item.label}
          </button>
        ))}
      </div>
    </section>
  )
}
