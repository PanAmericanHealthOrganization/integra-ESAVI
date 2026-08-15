import { Box, Typography } from '@mui/material'
import { AppBar } from 'react-admin'
import { CampanaNotificaciones } from '../components/notificaciones/CampanaNotificaciones'
import { PALETA } from '../theme'

/*
 * children de AppBar reemplaza el TitlePortal por defecto → título siempre fijo.
 * toolbar solo incluye UserMenu → se elimina LoadingIndicator (botón de refresco).
 *
 * La campana va antes del UserMenu, que AppBar añade por su cuenta a la derecha.
 *
 * La identidad es el logotipo institucional, no una placa con un icono genérico: la marca
 * ya existe y no hay razón para dibujar una propia. Va separado del nombre del sistema por
 * una línea vertical, que es como se ordena un logotipo ajeno junto a un nombre propio.
 *
 * De ese logotipo se muestra sólo el símbolo; la segunda línea de texto describe qué es
 * INTEGRA-ESAVI, que es lo que ni la marca ni el nombre cuentan.
 */

/* Medidas del archivo /public/logos/logo_msp.png, tomadas del propio PNG (473 × 133 px).
 * El símbolo ocupa las columnas 0–178: a partir de ahí el archivo tiene 14 px en blanco,
 * el filete separador y el bloque de texto. Si algún día se sustituye el logotipo hay que
 * volver a medir estos dos números, porque el recorte depende de ellos. */
const ANCHO_SIMBOLO = 179
const ALTO_ORIGINAL = 133
/** Alto al que se dibuja el símbolo dentro de la barra. */
const ALTURA_LOGO = 34

export const CustomAppBar = () => (
  // `color="inherit"`: react-admin pasa `secondary` por defecto, que pintaba la barra del
  // color secundario del tema. El blanco lo pone el tema en el slot `colorInherit`.
  //
  // `toolbar={null}`: sin esto react-admin monta su DefaultToolbar, que incluye el
  // LoadingIndicator —o sea el botón de refrescar—. El comentario de arriba decía desde
  // hace tiempo que se eliminaba, pero nunca se pasó la prop, así que seguía apareciendo.
  <AppBar color="inherit" toolbar={null}>
    {/* flex:1 empuja la campana y el menú de usuario al extremo derecho. */}
    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
      {/*
        Sólo el símbolo del logotipo, no el lockup completo: el archivo trae la marca y, a
        su derecha, un filete y las palabras «Ministerio de Salud Pública», que al lado del
        nombre del sistema quedaban repetidas y obligaban a una barra desproporcionada.
        El recorte es por CSS y no con un segundo archivo para no duplicar el activo.
      */}
      <Box
        sx={{
          height: ALTURA_LOGO,
          width: Math.round(ALTURA_LOGO * (ANCHO_SIMBOLO / ALTO_ORIGINAL)),
          overflow: 'hidden',
          flex: 'none',
          display: 'flex',
        }}
      >
        <Box
          component="img"
          src="/logos/logo_msp.png"
          alt="Ministerio de Salud Pública del Ecuador"
          // `maxWidth: none` desactiva el `max-width: 100%` que impondría el contenedor y
          // que, al encogerlo, mostraría el logotipo entero en miniatura en vez de recortarlo.
          sx={{ height: ALTURA_LOGO, width: 'auto', maxWidth: 'none' }}
        />
      </Box>
      <Box sx={{ width: '1px', height: 28, bgcolor: PALETA.bordeChrome, flex: 'none' }} />
      <Box sx={{ lineHeight: 1.2, minWidth: 0 }}>
        <Typography
          variant="h6"
          noWrap
          sx={{ fontSize: '14.5px', fontWeight: 600, letterSpacing: '-0.01em' }}
        >
          INTEGRA-ESAVI
        </Typography>
        <Typography
          noWrap
          sx={{ fontSize: '11px', color: PALETA.textoTerciario, fontWeight: 500 }}
        >
          Vigilancia de ESAVI · Ecuador
        </Typography>
      </Box>
    </Box>
    <CampanaNotificaciones />
  </AppBar>
)
