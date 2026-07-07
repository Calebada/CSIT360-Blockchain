import { useEffect, useMemo, useState } from 'react'
import './WeatherBackground.css'

const ANIME_COLLECTIONS = [
  { id: 'featured', label: 'Featured', note: 'Current season highlights', endpoint: 'https://api.jikan.moe/v4/seasons/now?limit=24' },
  { id: 'trending', label: 'Trending', note: 'Top anime right now', endpoint: 'https://api.jikan.moe/v4/top/anime?limit=24' },
  { id: 'airing', label: 'Airing', note: 'On broadcast now', endpoint: 'https://api.jikan.moe/v4/top/anime?filter=airing&limit=24' },
  { id: 'movies', label: 'Movies', note: 'Cinematic frames', endpoint: 'https://api.jikan.moe/v4/top/anime?type=movie&limit=24' },
]

const LOCAL_STORAGE_KEY = 'notes-app-anime-background'

function readStoredCollection(defaultCollection) {
  if (typeof window === 'undefined') {
    return defaultCollection
  }

  try {
    const storedCollection = window.localStorage.getItem(LOCAL_STORAGE_KEY)
    return ANIME_COLLECTIONS.some((collection) => collection.id === storedCollection) ? storedCollection : defaultCollection
  } catch {
    return defaultCollection
  }
}

export default function AnimeBackground({ showControl = true, defaultCollection = 'featured', isActive = true, onActivate }) {
  const [selectedCollectionId, setSelectedCollectionId] = useState(() => readStoredCollection(defaultCollection))
  const [animeArtwork, setAnimeArtwork] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, selectedCollectionId)
    } catch {
      // localStorage is best-effort only.
    }
  }, [selectedCollectionId])

  const selectedCollection = useMemo(
    () => ANIME_COLLECTIONS.find((collection) => collection.id === selectedCollectionId) || ANIME_COLLECTIONS[0],
    [selectedCollectionId]
  )

  useEffect(() => {
    let cancelled = false

    const loadAnime = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(selectedCollection.endpoint)
        if (!response.ok) {
          throw new Error('Anime background unavailable')
        }

        const payload = await response.json()
        const animeList = Array.isArray(payload?.data) ? payload.data : []

        if (animeList.length === 0) {
          throw new Error('No anime artwork available')
        }

        const index = Math.floor(Math.random() * animeList.length)
        const anime = animeList[index]
        const imageUrl = anime?.images?.webp?.large_image_url || anime?.images?.jpg?.large_image_url

        if (!imageUrl) {
          throw new Error('Anime artwork unavailable')
        }

        if (!cancelled) {
          setAnimeArtwork({
            title: anime.title_english || anime.title || 'Anime selection',
            subtitle: anime.type || selectedCollection.label,
            imageUrl,
          })
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError?.message || 'Anime background unavailable')
          setAnimeArtwork(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadAnime()
    const interval = window.setInterval(loadAnime, 10 * 60 * 1000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [selectedCollection])

  return (
    <>
      <div className="weather-bg" aria-hidden="true" style={{ opacity: isActive ? 1 : 0, pointerEvents: isActive ? 'none' : 'none' }}>
        {animeArtwork ? <img className="weather-live-image" src={animeArtwork.imageUrl} alt="" /> : null}
        <div className="weather-overlay" />
        <div className="weather-overlay weather-overlay--grain" />
      </div>

      {showControl && (
        <div className={`weather-control weather-control--anime weather-control--top-left ${isActive ? 'is-selected' : ''}`} role="group" aria-label="Anime background">
          <div className="weather-control__status">
            <span className="weather-control__eyebrow">Anime</span>
            <strong>{animeArtwork ? animeArtwork.title : selectedCollection.label}</strong>
            <span>{animeArtwork ? animeArtwork.subtitle : loading ? 'Loading anime artwork...' : error || selectedCollection.note}</span>
          </div>

          <div className="weather-control__form">
            <button
              type="button"
              className={isActive ? 'is-active' : ''}
              onClick={onActivate}
              aria-label="Use anime background"
            >
              Use
            </button>
            <select
              value={selectedCollectionId}
              onChange={(event) => setSelectedCollectionId(event.target.value)}
              aria-label="Choose anime collection"
              onFocus={onActivate}
            >
              {ANIME_COLLECTIONS.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </>
  )
}