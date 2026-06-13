import { Typography } from '@mui/material'
import { AppBar, UserMenu } from 'react-admin'

/*
 * children de AppBar reemplaza el TitlePortal por defecto → título siempre fijo.
 * toolbar solo incluye UserMenu → se elimina LoadingIndicator (botón de refresco).
 */
export const CustomAppBar = () => (
  <AppBar toolbar={<UserMenu />}>
    <Typography
      variant="h6"
      sx={{ flex: 1, fontWeight: 700, fontSize: '1rem', letterSpacing: '0.04em' }}
    >
      INTEGRA-ESAVI
    </Typography>
  </AppBar>
)
