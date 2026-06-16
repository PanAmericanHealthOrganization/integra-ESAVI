import { Typography } from '@mui/material'
import { useState, useEffect } from 'react'

const getTime = () =>
  new Date().toLocaleTimeString('es-EC', {
    timeZone: 'America/Guayaquil',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

export const DigitalClock = () => {
  const [time, setTime] = useState(getTime)

  useEffect(() => {
    const id = setInterval(() => setTime(getTime()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <Typography
      component="span"
      sx={{
        fontFamily: 'monospace',
        fontSize: '0.85rem',
        fontWeight: 500,
        letterSpacing: '0.08em',
        color: 'text.secondary',
        userSelect: 'none',
      }}
    >
      {time}
    </Typography>
  )
}
