import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline"
import SyncIcon from "@mui/icons-material/Sync"
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import { ReactNode } from "react"
import { Show, useRecordContext } from "react-admin"
import { PanelHeader, PanelTabla } from "../../components/PanelTabla"
import { FUENTE_MONO, LAYOUT, PALETA, TONOS } from "../../theme"

/*
 * Detalle de una corrida de sincronización.
 *
 * Antes era un <SimpleShowLayout> crudo: diez pares etiqueta/valor apilados en una sola
 * columna, con el enum de estado en bruto, las marcas de tiempo en ISO y el stack trace
 * desplegado a pantalla completa por encima de todo lo demás. Para responder «¿esto
 * terminó bien y cuánto tardó?» había que leerlo entero.
 *
 * La distribución ahora sigue el orden en que se consulta: primero el desenlace y los
 * tiempos de un vistazo, luego el resultado, luego el error —sólo si lo hubo— y al final
 * los metadatos técnicos, que son de depuración y van plegados.
 */

/** Etiqueta y valor de un dato suelto dentro de una tarjeta. */
const Dato = ({ etiqueta, children }: { etiqueta: string; children: ReactNode }) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography
      sx={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: PALETA.textoTenue,
      }}>
      {etiqueta}
    </Typography>
    <Box sx={{ fontSize: 13.5, mt: 0.4, minWidth: 0 }}>{children}</Box>
  </Box>
)

/** Tarjeta con título, para las secciones de texto largo. */
const Seccion = ({
  titulo,
  children,
  tono,
}: {
  titulo: string
  children: ReactNode
  tono?: { background: string; color: string }
}) => (
  <PanelTabla sx={{ mt: 2 }}>
    <Box
      sx={{
        px: 2,
        py: 1.25,
        borderBottom: `1px solid ${PALETA.separadorCabecera}`,
        backgroundColor: tono?.background ?? PALETA.papel,
        color: tono?.color ?? PALETA.texto,
        fontSize: 12.5,
        fontWeight: 600,
      }}>
      {titulo}
    </Box>
    <Box sx={{ p: 2 }}>{children}</Box>
  </PanelTabla>
)

const ETIQUETA_ESTADO: Record<string, { texto: string; tono: keyof typeof TONOS }> = {
  COMPLETED: { texto: "Completado", tono: "verde" },
  FAILED: { texto: "Error", tono: "rojo" },
  RUNNING: { texto: "En proceso", tono: "azul" },
  PENDING: { texto: "Pendiente", tono: "gris" },
}

const NOMBRE_FUENTE: Record<string, string> = {
  MEDDRA: "MedDRA",
  WHODRUG: "WHODrug",
  DATAMART: "Datamart",
  VACUNOMETRO: "Vacunómetro",
  DHIS2: "DHIS2",
  VIGIFLOW: "VigiFlow",
  SEED: "Seed",
}

const formatoFechaHora = new Intl.DateTimeFormat("sv-SE", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
})

const comoFechaHora = (valor?: string | Date | null) =>
  valor ? formatoFechaHora.format(new Date(valor)) : "—"

const comoFecha = (valor?: string | Date | null) =>
  valor ? new Date(valor).toISOString().slice(0, 10) : null

/**
 * Duración legible entre dos marcas.
 *
 * Se calcula aquí y no se guarda: es información derivada, y mostrarla en segundos y
 * minutos evita tener que restar dos ISO a ojo, que era lo que exigía la pantalla anterior.
 */
const comoDuracion = (inicio?: string | Date | null, fin?: string | Date | null) => {
  if (!inicio || !fin) return null
  const ms = new Date(fin).getTime() - new Date(inicio).getTime()
  if (!Number.isFinite(ms) || ms < 0) return null

  const segundos = Math.round(ms / 1000)
  if (segundos < 60) return `${segundos} s`
  const minutos = Math.floor(segundos / 60)
  if (minutos < 60) return `${minutos} min ${segundos % 60} s`
  return `${Math.floor(minutos / 60)} h ${minutos % 60} min`
}

const DetalleSync = () => {
  const record = useRecordContext<any>()
  if (!record) return null

  const estado = ETIQUETA_ESTADO[record.status] ?? {
    texto: record.status ?? "—",
    tono: "gris" as const,
  }
  const enCurso = record.status === "RUNNING" || record.status === "PENDING"
  const duracion = comoDuracion(record.startTime, record.endTime)
  const rangoInicio = comoFecha(record.dataStartDate)
  const rangoFin = comoFecha(record.dataEndDate)

  return (
    <Box p={LAYOUT.paddingPagina}>
      <PanelTabla>
        <PanelHeader
          divisor
          icono={<SyncIcon fontSize="small" />}
          titulo={NOMBRE_FUENTE[record.source] ?? record.source ?? "Sincronización"}
          subtitulo={record.name}
          adorno={
            <Chip
              label={estado.texto}
              sx={{ ...TONOS[estado.tono], fontWeight: 600 }}
              // El giro deja ver que la corrida sigue viva sin tener que recargar.
              icon={enCurso ? <CircularProgress size={11} thickness={6} /> : undefined}
            />
          }
          acciones={
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography
                sx={{ fontFamily: FUENTE_MONO, fontSize: 11.5, color: PALETA.textoTerciario }}
                title={record.id}>
                {String(record.id).slice(0, 8)}…
              </Typography>
              <ContentCopyIcon
                titleAccess="Copiar identificador de la corrida"
                sx={{ fontSize: 15, cursor: "pointer", color: PALETA.textoTenue }}
                onClick={() => navigator.clipboard.writeText(String(record.id))}
              />
            </Stack>
          }
        />

        {/*
          Los tiempos en rejilla y no apilados: son cuatro datos cortos que se leen juntos
          —cuándo empezó, cuándo acabó, cuánto tardó y qué periodo cubrió—, y en una
          columna ocupaban media pantalla para decir muy poco.
        */}
        <Box
          sx={{
            p: 2,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 2,
          }}>
          <Dato etiqueta="Inicio">{comoFechaHora(record.startTime)}</Dato>
          <Dato etiqueta="Fin">
            {enCurso && !record.endTime ? (
              <Box component="span" sx={{ color: PALETA.primarioOscuro, fontWeight: 600 }}>
                En curso
              </Box>
            ) : (
              comoFechaHora(record.endTime)
            )}
          </Dato>
          <Dato etiqueta="Duración">{duracion ?? "—"}</Dato>
          <Dato etiqueta="Rango de datos">
            {rangoInicio || rangoFin ? `${rangoInicio ?? "—"} → ${rangoFin ?? "—"}` : "—"}
          </Dato>
        </Box>
      </PanelTabla>

      {record.message && (
        <Seccion titulo="Resultado">
          <Typography sx={{ fontSize: 13.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {record.message}
          </Typography>
        </Seccion>
      )}

      {/*
        El bloque de error sólo aparece si lo hubo. Antes se reservaban tres filas vacías
        para «Mensaje de error» y «Stack» en todas las corridas correctas, que son la
        mayoría.
      */}
      {(record.errorMessage || record.errorStack) && (
        <Seccion titulo="Error" tono={TONOS.rojo}>
          {record.errorMessage && (
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <ErrorOutlineIcon sx={{ fontSize: 18, color: PALETA.rojo, mt: "1px" }} />
              <Typography
                sx={{ fontSize: 13.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {record.errorMessage}
              </Typography>
            </Stack>
          )}
          {record.errorStack && (
            // Plegado: son decenas de líneas de depuración que, desplegadas, empujaban
            // fuera de la pantalla todo lo que hay debajo.
            <Accordion
              disableGutters
              elevation={0}
              sx={{ mt: record.errorMessage ? 1.5 : 0, border: "none", "&::before": { display: "none" } }}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ px: 0, minHeight: 32, "& .MuiAccordionSummary-content": { my: 0 } }}>
                <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: PALETA.textoSecundario }}>
                  Traza técnica
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0, pt: 1 }}>
                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    p: 1.5,
                    maxHeight: 320,
                    overflow: "auto",
                    fontFamily: FUENTE_MONO,
                    fontSize: 11.5,
                    lineHeight: 1.6,
                    color: PALETA.textoSecundario,
                    backgroundColor: PALETA.fondoSutil,
                    borderRadius: "9px",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}>
                  {record.errorStack}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}
        </Seccion>
      )}

      {record.metadata && Object.keys(record.metadata).length > 0 && (
        <Seccion titulo="Metadatos de la fuente">
          {/*
            Pares clave/valor en lugar del volcado JSON: los metadatos son planos (versión,
            sha256, conteos) y leerlos con llaves y comillas no aportaba nada. Los valores
            compuestos sí se serializan, que son la excepción.
          */}
          <Stack divider={<Divider />} spacing={0}>
            {Object.entries(record.metadata).map(([clave, valor]) => (
              <Box
                key={clave}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "minmax(140px, 220px) 1fr",
                  gap: 2,
                  py: 1,
                }}>
                <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: PALETA.textoSecundario }}>
                  {clave}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 12.5,
                    fontFamily: FUENTE_MONO,
                    wordBreak: "break-all",
                    minWidth: 0,
                  }}>
                  {valor === null || valor === undefined
                    ? "—"
                    : typeof valor === "object"
                      ? JSON.stringify(valor)
                      : String(valor)}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Seccion>
      )}
    </Box>
  )
}

export const SyncsShow = () => (
  // `component={Fragment}`: <Show> envuelve por defecto en una Card, y aquí cada bloque
  // trae la suya. Sin esto quedaba una tarjeta dentro de otra.
  <Show component="div" actions={false}>
    <DetalleSync />
  </Show>
)
