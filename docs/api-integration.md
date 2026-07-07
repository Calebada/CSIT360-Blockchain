# API Integration

This project uses a small set of public endpoints to power the background and calendar features.

## APIs Used

### 1. Jikan API for anime backgrounds

Used by [frontend/src/components/AnimeBackground.jsx](../frontend/src/components/AnimeBackground.jsx) to load live anime cover art.

Endpoints used:

- `https://api.jikan.moe/v4/seasons/now?limit=24`
- `https://api.jikan.moe/v4/top/anime?limit=24`
- `https://api.jikan.moe/v4/top/anime?filter=airing&limit=24`
- `https://api.jikan.moe/v4/top/anime?type=movie&limit=24`

What it does:

- Fetches a list of anime entries.
- Picks one item from the selected collection.
- Uses the cover image URL from the response as the full-page background.
- Stores the selected anime collection in `localStorage` so the choice persists.

### 2. Nager.Date API for calendar holidays

Used by [frontend/src/components/CalendarWidget.jsx](../frontend/src/components/CalendarWidget.jsx) to show public holidays.

Endpoint used:

- `https://date.nager.at/api/v3/PublicHolidays/{year}/{countryCode}`

What it does:

- Loads public holiday data for the selected country and year.
- Highlights holiday dates in the calendar grid.
- Shows a small holiday summary list under the calendar.
- Stores the selected country in `localStorage`.

### 3. Scenic background image URLs

Used by [frontend/src/components/ScenicBackground.jsx](../frontend/src/components/ScenicBackground.jsx).

Important note:

- This part does not call a weather API.
- It uses direct image URLs from Unsplash for curated landscape scenes.
- The selection is stored in `localStorage`.

## Not Used Anymore

The repository still contains [frontend/src/hooks/useWeather.js](../frontend/src/hooks/useWeather.js), but the current UI does not import it.

That hook originally used Open-Meteo for weather lookups. It is no longer part of the active background flow.

## Integration Flow

### Background system

1. [frontend/src/components/WeatherBackground.jsx](../frontend/src/components/WeatherBackground.jsx) acts as the wrapper.
2. The wrapper renders the anime background component and the scenic background component.
3. A top-left control switches the active mode between anime and scenic.
4. The selected mode is persisted in `localStorage`.

### Calendar system

1. [frontend/src/components/CalendarWidget.jsx](../frontend/src/components/CalendarWidget.jsx) builds a month grid locally.
2. It fetches public holiday data from Nager.Date for the chosen country.
3. Dates that match a holiday are highlighted in the calendar.
4. The selected country is persisted in `localStorage`.

## Why These APIs

- Jikan is free and does not require an API key.
- Nager.Date is free and simple to integrate for holiday calendars.
- Scenic backgrounds use direct image URLs so they stay lightweight and do not require backend support.

## Environment Notes

- No API keys are required for the current setup.
- The frontend fetches these APIs directly from the browser.
- If you later want server-side caching or tighter rate-limit control, the API calls can be moved behind your Express backend.
