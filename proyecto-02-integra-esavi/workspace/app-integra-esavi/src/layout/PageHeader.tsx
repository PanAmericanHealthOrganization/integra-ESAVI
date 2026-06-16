import { Box } from '@mui/material'
import { TitlePortal } from 'react-admin'
import { DigitalClock } from './DigitalClock'

/*
 * Barra horizontal sticky en el tope del área de contenido.
 * TitlePortal lee del contexto de RA el título que cada página
 * (List, Show, Edit) publica — sin necesidad de modificar cada página.
 */
export const PageHeader = () => (
  <Box
    sx={{
      position: 'sticky',
      top: 0,
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      px: 3,
      py: 1.25,
      bgcolor: 'background.paper',
      borderBottom: '1px solid',
      borderColor: 'divider',
      minHeight: 48,
    }}
  >
    <TitlePortal
      variant="h6"
      sx={{ fontWeight: 600, fontSize: '1rem', color: 'text.primary', m: 0 }}
    />
    <DigitalClock />
  </Box>
)
