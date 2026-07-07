import { useEffect, useMemo, useState } from 'react'
import './WeatherBackground.css'

const SCENIC_VIEWS = [
  {
    id: 'santorini',
    label: 'Santorini, Greece',
    note: 'White cliffs over the Aegean',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=80',
    position: 'center center',
  },
  {
    id: 'fjord',
    label: 'Norwegian Fjord',
    note: 'Steel water and steep green walls',
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1800&q=80',
    position: 'center center',
  },
  {
    id: 'machu-picchu',
    label: 'Machu Picchu, Peru',
    note: 'Ancient ridge above the clouds',
    image: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1800&q=80',
    position: 'center center',
  },
  {
    id: 'kyoto',
    label: 'Kyoto, Japan',
    note: 'Soft light through layered gardens',
    image: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1800&q=80',
    position: 'center center',
  },
]

const LOCAL_STORAGE_KEY = 'notes-app-scenic-view'

function readStoredView(defaultView) {
  if (typeof window === 'undefined') {
    return defaultView
  }

  try {
    const storedView = window.localStorage.getItem(LOCAL_STORAGE_KEY)
    return SCENIC_VIEWS.some((view) => view.id === storedView) ? storedView : defaultView
  } catch {
    return defaultView
  }
}

export default function ScenicBackground({ showControl = true, defaultView = 'santorini', isActive = true, onActivate }) {
  const [selectedViewId, setSelectedViewId] = useState(() => readStoredView(defaultView))

  useEffect(() => {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, selectedViewId)
    } catch {
      // localStorage is best-effort only.
    }
  }, [selectedViewId])

  const selectedView = useMemo(
    () => SCENIC_VIEWS.find((view) => view.id === selectedViewId) || SCENIC_VIEWS[0],
    [selectedViewId]
  )

  return (
    <>
      <div className="weather-bg" aria-hidden="true" style={{ opacity: isActive ? 1 : 0, pointerEvents: 'none' }}>
        <img className="weather-live-image" src={selectedView.image} alt="" style={{ objectPosition: selectedView.position }} />
        <div className="weather-overlay" />
        <div className="weather-overlay weather-overlay--grain" />
      </div>

      {showControl && (
        <div className={`weather-control weather-control--scenic weather-control--top-right ${isActive ? 'is-selected' : ''}`} role="group" aria-label="Scenic background">
          <div className="weather-control__status">
            <span className="weather-control__eyebrow">Nice view</span>
            <strong>{selectedView.label}</strong>
            <span>{selectedView.note}</span>
          </div>

          <div className="weather-control__form">
            <button
              type="button"
              className={isActive ? 'is-active' : ''}
              onClick={onActivate}
              aria-label="Use scenic background"
            >
              Use
            </button>
            <select
              value={selectedViewId}
              onChange={(event) => setSelectedViewId(event.target.value)}
              aria-label="Choose scenic view"
              onFocus={onActivate}
            >
              {SCENIC_VIEWS.map((view) => (
                <option key={view.id} value={view.id}>
                  {view.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </>
  )
}