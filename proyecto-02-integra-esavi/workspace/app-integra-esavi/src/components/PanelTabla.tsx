import { Avatar, Box, Divider, Paper, Stack, Typography } from "@mui/material"
import { alpha, useTheme } from "@mui/material/styles"
import { ReactNode } from "react"
import { LAYOUT, SOMBRAS } from "../theme"

/**
 * Marco y cabecera de las tablas y paneles del sistema.
 *
 * El patrón —tarjeta con borde y una banda superior con avatar, título, conteo, filtros y
 * botones— estaba copiado en siete pantallas con cuatro combinaciones distintas de padding,
 * tres tamaños de avatar y tres variantes tipográficas para el mismo título. Centralizarlo
 * evita que cada pantalla nueva vuelva a elegir sus propios números.
 *
 * El estilo de la tarjeta y de los botones vive en el tema; aquí sólo queda la composición.
 */

/** Densidad de la cabecera. `compacta` es para paneles angostos que van de a varios por fila. */
export type DensidadPanel = "normal" | "compacta"

interface PanelHeaderProps {
  /** Icono del avatar. Se renderiza tal cual: `<VaccinesIcon fontSize="small" />`. */
  icono: ReactNode
  titulo: string
  /** Línea secundaria: normalmente el conteo de registros o "Cargando...". */
  subtitulo?: ReactNode
  /**
   * Zona central flexible: filtros, buscadores. Crece para ocupar el espacio libre, con
   * `minWidth: 0` para que un `FilterForm` ancho no empuje a los botones fuera de la banda.
   */
  children?: ReactNode
  /** Zona derecha, sin encoger: botones de acción. */
  acciones?: ReactNode
  densidad?: DensidadPanel
  /**
   * Coloca `children` en una segunda fila, debajo de la identidad y las acciones. Para
   * paneles angostos donde el buscador no entra al lado del título.
   */
  apilado?: boolean
  /**
   * Color del avatar y del tinte de la banda. Distingue paneles encadenados: en DPA,
   * Provincias → Cantones → Parroquias usan primary, secondary y success.
   */
  color?: "primary" | "secondary" | "success" | "info" | "warning"
  /** Elemento al lado del título, normalmente un Chip con el contexto seleccionado. */
  adorno?: ReactNode
  /**
   * Línea inferior que separa la banda de la tabla. Se desactiva cuando la banda va suelta,
   * sin una tabla pegada debajo: ahí el divisor queda flotando.
   */
  divisor?: boolean
  /** Ajustes puntuales de la banda, como redondearla cuando va suelta. */
  sx?: object
}

const MEDIDAS: Record<DensidadPanel, { avatar: number; titulo: "subtitle1" | "subtitle2" }> = {
  normal: { avatar: 34, titulo: "subtitle1" },
  compacta: { avatar: 30, titulo: "subtitle2" },
}

/**
 * Banda de acciones sobre una tabla. Va dentro de `<PanelTabla>` o de un `<List>`.
 */
export const PanelHeader = ({
  icono,
  titulo,
  subtitulo,
  children,
  acciones,
  densidad = "normal",
  apilado = false,
  color = "primary",
  adorno,
  divisor = true,
  sx,
}: PanelHeaderProps) => {
  const theme = useTheme()
  const { avatar, titulo: varianteTitulo } = MEDIDAS[densidad]

  const identidad = (
    // minWidth:0 + overflow permiten que un título largo o un Chip ancho se recorten en
    // lugar de empujar las acciones fuera de la banda.
    <Box
      display="flex"
      alignItems="center"
      gap={1.5}
      sx={{ flexShrink: 0, minWidth: 0, overflow: "hidden" }}>
      <Avatar sx={{ bgcolor: `${color}.main`, width: avatar, height: avatar }}>{icono}</Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography
            variant={varianteTitulo}
            fontWeight={700}
            lineHeight={1.2}
            sx={{ whiteSpace: "nowrap" }}>
            {titulo}
          </Typography>
          {adorno}
        </Box>
        {subtitulo != null && (
          <Typography variant="caption" color="text.secondary">
            {subtitulo}
          </Typography>
        )}
      </Box>
    </Box>
  )

  return (
    <>
      <Box
        px={LAYOUT.paddingCabeceraX}
        py={LAYOUT.paddingCabeceraY}
        display="flex"
        flexDirection={apilado ? "column" : "row"}
        alignItems={apilado ? "stretch" : "center"}
        gap={LAYOUT.gapCabecera}
        /*
         * `wrap` y no `nowrap`: identidad y acciones llevan `flexShrink: 0`, así que con
         * `nowrap` nadie podía ceder y en los paneles estrechos —los dos catálogos lado a
         * lado— el botón «Nuevo» se salía del recuadro y quedaba cortado. Envolviendo, lo
         * que baja de línea es el bloque de filtros, que es lo que puede permitírselo.
         */
        flexWrap="wrap"
        sx={{
          /*
           * El tinte del 4% se apoya sobre blanco explícito, no sobre lo que haya debajo.
           * Cuando el fondo de la página era blanco daba igual, pero desde que es gris
           * azulado (#eef2f7) un 4% de azul sobre gris es indistinguible del propio fondo:
           * en las pantallas donde la banda va suelta —Parámetros, sin tabla pegada
           * debajo— parecía directamente no tener fondo.
           *
           * El tinte viaja como `backgroundImage` porque `backgroundColor` ya lo ocupa el
           * blanco: son dos capas, no dos valores en pugna.
           */
          backgroundColor: "background.paper",
          backgroundImage: `linear-gradient(${alpha(theme.palette[color].main, 0.04)}, ${alpha(
            theme.palette[color].main,
            0.04,
          )})`,
          ...sx,
        }}>
        {apilado ? (
          <>
            <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
              {identidad}
              {acciones && (
                <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0 }}>
                  {acciones}
                </Stack>
              )}
            </Box>
            {children}
          </>
        ) : (
          <>
            {identidad}
            {/* minWidth:0 es lo que permite que un filtro largo se encoja en vez de
                desbordar la banda y empujar los botones. */}
            {children && (
              <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
            )}
            {acciones && (
              /*
               * `ml: auto` ancla las acciones al borde derecho de la banda pase lo que
               * pase: cuando no hay filtros —o cuando el bloque de filtros baja de línea—
               * el hueco lo absorbe este margen, y los botones no se quedan pegados al
               * título en mitad de la banda.
               */
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ flexShrink: 0, ml: "auto" }}>
                {acciones}
              </Stack>
            )}
          </>
        )}
      </Box>
      {divisor && <Divider />}
    </>
  )
}

interface PanelTablaProps {
  children: ReactNode
  /** Para paneles que van de a varios por fila: `flex`, `minWidth`, `mb`… */
  sx?: object
}

/**
 * Tarjeta que enmarca una tabla propia (las que arman `<Table>` de MUI a mano).
 *
 * Las listas de react-admin no la necesitan: su `<List>` ya trae la tarjeta, y el borde se
 * le aplica desde el tema vía `RaList`.
 */
export const PanelTabla = ({ children, sx }: PanelTablaProps) => (
  <Paper
    elevation={0}
    sx={{
      borderRadius: LAYOUT.radioTarjeta,
      border: "1px solid",
      borderColor: "divider",
      // La sombra va aquí y no en el tema: `MuiPaper` es también la base de la barra
      // superior, el menú lateral y los diálogos, y darles a todos la sombra de tarjeta
      // los aplanaba en el mismo plano. Ver la nota de `MuiPaper` en theme.ts.
      boxShadow: SOMBRAS.tarjeta,
      overflow: "hidden",
      ...sx,
    }}>
    {children}
  </Paper>
)
