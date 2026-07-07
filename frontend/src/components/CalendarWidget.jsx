import { useEffect, useMemo, useState } from 'react'
import './CalendarWidget.css'

const COUNTRY_OPTIONS = [
  { code: 'PH', label: 'Philippines' },
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'AU', label: 'Australia' },
  { code: 'CA', label: 'Canada' },
  { code: 'DE', label: 'Germany' },
  { code: 'JP', label: 'Japan' },
  { code: 'FR', label: 'France' },
]

const LOCAL_STORAGE_KEY = 'notes-app-calendar-country'

function readStoredCountry(defaultCountryCode) {
  if (typeof window === 'undefined') {
    return defaultCountryCode
  }

  try {
    const storedCountry = window.localStorage.getItem(LOCAL_STORAGE_KEY)
    return COUNTRY_OPTIONS.some((country) => country.code === storedCountry) ? storedCountry : defaultCountryCode
  } catch {
    return defaultCountryCode
  }
}

function pad(value) {
  return String(value).padStart(2, '0')
}

function formatDateKey(year, monthIndex, day) {
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`
}

function buildMonthCells(year, monthIndex) {
  const firstDay = new Date(year, monthIndex, 1)
  const leadingEmptyCells = firstDay.getDay()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const cells = []

  for (let index = 0; index < leadingEmptyCells; index += 1) {
    cells.push(null)
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      day,
      dateKey: formatDateKey(year, monthIndex, day),
    })
  }

  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  return cells
}

function monthLabel(date) {
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(date)
}

export default function CalendarWidget({ defaultCountryCode = 'PH' }) {
  const [countryCode, setCountryCode] = useState(() => readStoredCountry(defaultCountryCode))
  const [activeDate, setActiveDate] = useState(() => new Date())
  const [holidays, setHolidays] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const year = activeDate.getFullYear()
  const monthIndex = activeDate.getMonth()
  const monthCells = useMemo(() => buildMonthCells(year, monthIndex), [year, monthIndex])
  const holidayMap = useMemo(() => {
    return new Map(
      holidays
        .filter((holiday) => holiday?.date)
        .map((holiday) => [holiday.date.slice(0, 10), holiday])
    )
  }, [holidays])

  const monthHolidays = useMemo(() => {
    return holidays.filter((holiday) => holiday?.date && new Date(holiday.date).getMonth() === monthIndex)
  }, [holidays, monthIndex])

  useEffect(() => {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, countryCode)
    } catch {
      // localStorage is best-effort only.
    }
  }, [countryCode])

  useEffect(() => {
    let cancelled = false

    const loadHolidays = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`)
        if (!response.ok) {
          throw new Error('Calendar data unavailable')
        }

        const data = await response.json()
        if (!cancelled) {
          setHolidays(Array.isArray(data) ? data : [])
        }
      } catch (fetchError) {
        if (!cancelled) {
          setHolidays([])
          setError(fetchError?.message || 'Calendar data unavailable')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadHolidays()

    return () => {
      cancelled = true
    }
  }, [countryCode, year])

  const goToPreviousMonth = () => {
    setActiveDate((currentDate) => new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setActiveDate((currentDate) => new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const today = formatDateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())

  return (
    <section className="calendar-card" aria-labelledby="calendar-title">
      <div className="calendar-card__header">
        <div>
          <p className="section-kicker">Calendar</p>
          <h2 id="calendar-title">Monthly planner</h2>
        </div>

        <div className="calendar-controls">
          <button type="button" className="calendar-nav" onClick={goToPreviousMonth} aria-label="Previous month">
            ←
          </button>
          <button type="button" className="calendar-nav" onClick={goToNextMonth} aria-label="Next month">
            →
          </button>
        </div>
      </div>

      <div className="calendar-toolbar">
        <div className="calendar-toolbar__label">
          <span>{monthLabel(activeDate)}</span>
          <small>{countryCode} public holidays from Nager.Date</small>
        </div>

        <label className="calendar-select">
          <span className="sr-only">Choose country</span>
          <select value={countryCode} onChange={(event) => setCountryCode(event.target.value)}>
            {COUNTRY_OPTIONS.map((country) => (
              <option key={country.code} value={country.code}>
                {country.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="calendar-grid" role="grid" aria-label={`${monthLabel(activeDate)} calendar`}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayLabel) => (
          <div key={dayLabel} className="calendar-grid__weekday" role="columnheader">
            {dayLabel}
          </div>
        ))}

        {monthCells.map((cell, index) => {
          if (!cell) {
            return <div key={`empty-${index}`} className="calendar-grid__cell calendar-grid__cell--empty" />
          }

          const holiday = holidayMap.get(cell.dateKey)
          const isToday = cell.dateKey === today

          return (
            <div
              key={cell.dateKey}
              className={`calendar-grid__cell ${holiday ? 'calendar-grid__cell--holiday' : ''} ${isToday ? 'calendar-grid__cell--today' : ''}`}
              role="gridcell"
              aria-label={`${cell.day}${holiday ? `, ${holiday.localName || holiday.name}` : ''}`}
            >
              <span className="calendar-grid__day">{cell.day}</span>
              {holiday && <span className="calendar-grid__holiday">{holiday.localName || holiday.name}</span>}
            </div>
          )
        })}
      </div>

      <div className="calendar-foot">
        <div className="calendar-foot__status">
          {loading && <span>Loading holidays...</span>}
          {!loading && error && <span title={error}>Calendar unavailable</span>}
          {!loading && !error && monthHolidays.length === 0 && <span>No public holidays this month.</span>}
        </div>

        {!loading && !error && monthHolidays.length > 0 && (
          <ul className="calendar-holiday-list">
            {monthHolidays.slice(0, 4).map((holiday) => (
              <li key={holiday.date}>
                <strong>{holiday.date.slice(8, 10)}</strong>
                <span>{holiday.localName || holiday.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}