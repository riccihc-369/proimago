import { useEffect, useRef, useState } from 'react'
import type { Suggestion } from '../types'

export function useStableSuggestion(
  nextSuggestion: Suggestion,
  enabled: boolean,
): Suggestion {
  const [stableSuggestion, setStableSuggestion] = useState(nextSuggestion)
  const stableSuggestionRef = useRef(nextSuggestion)
  const lockUntilRef = useRef(0)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }

    const commitSuggestion = (suggestion: Suggestion) => {
      stableSuggestionRef.current = suggestion
      lockUntilRef.current = enabled ? Date.now() + getHoldMs(suggestion) : 0
      setStableSuggestion(suggestion)
    }

    if (!enabled) {
      timerRef.current = window.setTimeout(() => {
        commitSuggestion(nextSuggestion)
      }, 0)

      return () => {
        if (timerRef.current !== null) {
          window.clearTimeout(timerRef.current)
          timerRef.current = null
        }
      }
    }

    const currentSuggestion = stableSuggestionRef.current
    if (areSameSuggestion(currentSuggestion, nextSuggestion)) {
      return
    }

    if (currentSuggestion.id === nextSuggestion.id) {
      timerRef.current = window.setTimeout(() => {
        commitSuggestion(nextSuggestion)
      }, 0)

      return () => {
        if (timerRef.current !== null) {
          window.clearTimeout(timerRef.current)
          timerRef.current = null
        }
      }
    }

    const now = Date.now()
    const delay = shouldInterruptSuggestion(currentSuggestion, nextSuggestion)
      ? 0
      : Math.max(0, lockUntilRef.current - now)

    timerRef.current = window.setTimeout(() => {
      commitSuggestion(nextSuggestion)
    }, delay)

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [enabled, nextSuggestion])

  return stableSuggestion
}

function areSameSuggestion(currentSuggestion: Suggestion, nextSuggestion: Suggestion) {
  return (
    currentSuggestion.id === nextSuggestion.id &&
    currentSuggestion.message === nextSuggestion.message &&
    currentSuggestion.severity === nextSuggestion.severity &&
    currentSuggestion.priority === nextSuggestion.priority &&
    currentSuggestion.holdMs === nextSuggestion.holdMs
  )
}

function shouldInterruptSuggestion(
  currentSuggestion: Suggestion,
  nextSuggestion: Suggestion,
) {
  if (
    nextSuggestion.severity === 'warning' &&
    currentSuggestion.severity !== 'warning'
  ) {
    return true
  }

  return false
}

function getHoldMs(suggestion: Suggestion) {
  return suggestion.holdMs ?? 2000
}
