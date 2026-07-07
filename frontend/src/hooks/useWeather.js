import { useCallback, useEffect, useState } from 'react'

/**
 * Maps Open-Meteo's WMO weather codes down to a small set of
 * conditions our background treatments know how to render.
 * https://open-meteo.com/en/docs (see "WMO Weather interpretation codes")
 */
function codeToCondition(code) {
    if (code === 0) return 'clear'
    if ([1, 2, 3].includes(code)) return 'cloudy'
    if ([45, 48].includes(code)) return 'fog'
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'rain'
    if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow'
    if ([95, 96, 99].includes(code)) return 'storm'
    return 'clear'
}

const LOCAL_STORAGE_KEY = 'notes-app-weather-city'

function readStoredCity(defaultCity) {
    if (typeof window === 'undefined') {
        return defaultCity
    }

    try {
        const storedCity = window.localStorage.getItem(LOCAL_STORAGE_KEY)
        return storedCity || defaultCity
    } catch {
        return defaultCity
    }
}

/**
 * useWeather
 *
 * Fetches current weather for a city name using Open-Meteo's free
 * geocoding + forecast APIs (no key, no signup, generous rate limits).
 *
 * Usage:
 *   const { data, loading, error, setCity, city } = useWeather('Cebu City')
 */
export function useWeather(defaultCity = 'Cebu City') {
    const [city, setCityState] = useState(() => readStoredCity(defaultCity))
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchWeather = useCallback(async(cityName) => {
        setLoading(true)
        setError(null)

        try {
            const geoRes = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`
            )

            if (!geoRes.ok) {
                throw new Error('Location lookup failed')
            }

            const geoJson = await geoRes.json()
            const placeResults = geoJson && Array.isArray(geoJson.results) ? geoJson.results : []
            const place = placeResults[0]

            if (!place) {
                throw new Error(`Couldn't find a location named "${cityName}"`)
            }

            const weatherRes = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code,is_day&timezone=auto`
            )

            if (!weatherRes.ok) {
                throw new Error('Weather lookup failed')
            }

            const weatherJson = await weatherRes.json()
            const current = weatherJson && weatherJson.current

            if (!current) {
                throw new Error('Weather data unavailable right now')
            }

            setData({
                condition: codeToCondition(current.weather_code),
                temperature: Math.round(current.temperature_2m),
                isDay: current.is_day === 1,
                latitude: place.latitude,
                longitude: place.longitude,
                cityLabel: [place.name, place.admin1, place.country].filter(Boolean).join(', '),
            })
        } catch (fetchError) {
            setError(fetchError && fetchError.message ? fetchError.message : 'Something went wrong fetching the weather')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchWeather(city)

        const interval = setInterval(() => fetchWeather(city), 15 * 60 * 1000)
        return () => clearInterval(interval)
    }, [city, fetchWeather])

    const setCity = useCallback((newCity) => {
        try {
            window.localStorage.setItem(LOCAL_STORAGE_KEY, newCity)
        } catch {
            // localStorage is best-effort only.
        }

        setCityState(newCity)
    }, [])

    return { data, loading, error, city, setCity, refresh: () => fetchWeather(city) }
}