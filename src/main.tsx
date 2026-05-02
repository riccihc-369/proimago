import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const SERVICE_WORKER_URL = '/sw.js?v=0.1.9'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(SERVICE_WORKER_URL)
      .then((registration) => {
        const requestUpdate = () => {
          registration.update().catch(() => {
            // Update checks are best effort only.
          })
        }

        requestUpdate()

        if (registration.waiting || registration.installing) {
          requestUpdate()
        }

        registration.addEventListener('updatefound', requestUpdate)
        window.addEventListener('focus', requestUpdate)
      })
      .catch(() => {
        // The app works without offline caching, so registration failures stay silent.
      })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
