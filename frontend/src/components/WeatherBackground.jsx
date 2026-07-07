import { useEffect, useState } from 'react'
import AnimeBackground from './AnimeBackground.jsx'
import ScenicBackground from './ScenicBackground.jsx'

const LOCAL_STORAGE_KEY = 'notes-app-background-mode'

function readStoredMode(defaultMode) {
  if (typeof window === 'undefined') {
    return defaultMode
  }

  try {
    const storedMode = window.localStorage.getItem(LOCAL_STORAGE_KEY)
    return storedMode === 'anime' || storedMode === 'scenic' ? storedMode : defaultMode
  } catch {
    return defaultMode
  }
}

/**
 * WeatherBackground
 *
 * Wrapper that composes the two dedicated background controls so the
 * app can keep both the anime selector and the scenic selector visible.
 */
export default function WeatherBackground({ showControl = true }) {
  const [activeMode, setActiveMode] = useState(() => readStoredMode('scenic'))

  useEffect(() => {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, activeMode)
    } catch {
      // localStorage is best-effort only.
    }
  }, [activeMode])

  return (
    <>
      <AnimeBackground
        showControl={showControl}
        isActive={activeMode === 'anime'}
        onActivate={() => setActiveMode('anime')}
      />
      <ScenicBackground
        showControl={showControl}
        isActive={activeMode === 'scenic'}
        onActivate={() => setActiveMode('scenic')}
      />
    </>
  )
}