import { useState, useEffect, useCallback } from 'react'

const DEFAULT_LAT = 17.6868
const DEFAULT_LNG = 83.2185

export default function useGeolocation() {
  const [location, setLocation] = useState({
    lat: DEFAULT_LAT,
    lng: DEFAULT_LNG,
    accuracy: null,
    loading: true,
    error: null,
    isLive: false,
    label: 'Gajuwaka, Vizag',
  })

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation((prev) => ({
        ...prev,
        loading: false,
        error: 'Geolocation not supported',
      }))
      return
    }

    setLocation((prev) => ({ ...prev, loading: true }))

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          loading: false,
          error: null,
          isLive: true,
          label: `${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°E`,
        })
      },
      (err) => {
        console.warn('Geolocation error:', err.message)
        setLocation((prev) => ({
          ...prev,
          loading: false,
          error: err.message,
          isLive: false,
        }))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    )
  }, [])

  // Attempt on mount
  useEffect(() => {
    requestLocation()
  }, [requestLocation])

  return { ...location, requestLocation }
}
