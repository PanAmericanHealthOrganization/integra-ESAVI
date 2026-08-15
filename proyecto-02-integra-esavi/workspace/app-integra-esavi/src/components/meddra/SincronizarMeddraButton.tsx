import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import CancelIcon from "@mui/icons-material/Cancel"
import FolderZipIcon from "@mui/icons-material/FolderZip"
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline"
import SyncIcon from "@mui/icons-material/Sync"
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material"
import { useMemo, useRef, useState } from "react"
import Authorize from "../../authorization.utils"
import intESAVIClient from "../../dataProviders/axios.client"
import { ROLES_SINCRONIZACION, mensajeError, useFeedback } from "../syncFeedback"
import {
  ARCHIVOS_A_SUBIR,
  ARCHIVOS_OPCIONALES,
  ARCHIVOS_REQUERIDOS,
  AnalisisZip,
  ErrorZip,
  IDIOMAS,
  IdiomaMeddra,
  PATRON_VERSION,
  analizarZip,
  formatearTamano,
  versionCoincide,
} from "./meddraZip"

/**
 * Carga de una versión de MedDRA a partir del ZIP que entrega MSSO.
 *
 * El ZIP se descomprime **en el navegador**: la contraseña no sale de aquí. Se comprueba
 * que la distribución esté completa y que su sello (`meddra_release.asc`) coincida con
 * la versión y el idioma elegidos, y sólo entonces se habilita el botón de sincronizar.
 * Del ZIP se suben únicamente los cuatro archivos que el API lee; el servidor no guarda
 * ninguno en disco.
 */
export const SincronizarMeddraButton = ({ onDone }: { onDone?: () => void }) => {
  const [open, setOpen] = useState(false)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [password, setPassword] = useState("")
  const [analisis, setAnalisis] = useState<AnalisisZip | null>(null)
  const [errorZip, setErrorZip] = useState<string | null>(null)
  const [analizando, setAnalizando] = useState(false)
  const [progreso, setProgreso] = useState("")
  const [version, setVersion] = useState("")
  const [lang, setLang] = useState<IdiomaMeddra>("ES")
  const [subiendo, setSubiendo] = useState(false)
  const [porcentaje, setPorcentaje] = useState(0)
  const inputArchivo = useRef<HTMLInputElement>(null)
  const { show, node } = useFeedback()

  const reiniciar = () => {
    setArchivo(null)
    setPassword("")
    setAnalisis(null)
    setErrorZip(null)
    setProgreso("")
    setVersion("")
    setLang("ES")
    setPorcentaje(0)
    if (inputArchivo.current) inputArchivo.current.value = ""
  }

  const cerrar = () => {
    if (analizando || subiendo) return
    setOpen(false)
    reiniciar()
  }

  const analizar = async (file: File, clave: string) => {
    setAnalizando(true)
    setErrorZip(null)
    setAnalisis(null)
    try {
      const resultado = await analizarZip(file, clave, setProgreso)
      setAnalisis(resultado)
      // La versión y el idioma se toman del propio ZIP: teclearlos a mano es la vía más
      // fácil de cargar la 28.0 bajo la etiqueta 27.1 y no enterarse nunca.
      if (resultado.release) {
        setVersion(resultado.release.version)
        if (resultado.release.idioma) setLang(resultado.release.idioma)
      }
    } catch (e) {
      setErrorZip(e instanceof ErrorZip ? e.message : `No se pudo leer el ZIP: ${String(e)}`)
    } finally {
      setAnalizando(false)
      setProgreso("")
    }
  }

  const seleccionarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setAnalisis(null)
    setErrorZip(null)
    setVersion("")
    setArchivo(file)
    // Se intenta sin contraseña: la mayoría de los ZIP de MSSO la piden, y el error que
    // devuelve el análisis es justamente lo que le indica al usuario que la escriba.
    if (file) void analizar(file, password)
  }

  /** Motivos por los que todavía no se puede sincronizar. */
  const impedimentos = useMemo(() => {
    const lista: string[] = []
    if (!archivo) lista.push("Selecciona el ZIP entregado por MedDRA.")
    if (!analisis) return lista.length ? lista : ["Analiza el ZIP para continuar."]

    lista.push(...analisis.errores)

    if (!PATRON_VERSION.test(version.trim())) {
      lista.push("La versión debe tener la forma 28 o 28_0 (ejemplos: 21_1, 22_2, 27_1, 28_0).")
    } else if (analisis.release && !versionCoincide(version, analisis.release.version)) {
      lista.push(
        `El ZIP corresponde a la versión ${analisis.release.version}, no a la ${version} indicada.`
      )
    }

    if (analisis.release?.idioma && analisis.release.idioma !== lang) {
      lista.push(`El ZIP está en ${analisis.release.idioma}, no en ${lang} como se seleccionó.`)
    }

    return lista
  }, [archivo, analisis, version, lang])

  const puedeSincronizar = impedimentos.length === 0 && !analizando && !subiendo

  const sincronizar = async () => {
    if (!analisis || !puedeSincronizar) return

    const formData = new FormData()
    formData.append("version", version.trim())
    formData.append("lang", lang)
    formData.append("manifiesto", JSON.stringify(analisis.manifiesto))
    formData.append("descripcion", `Carga desde ${archivo?.name ?? "ZIP"}`)

    for (const nombre of ARCHIVOS_A_SUBIR) {
      const blob = analisis.archivos.find((a) => a.nombre === nombre)?.blob
      if (!blob) {
        show(`Falta el contenido de ${nombre}; vuelve a analizar el ZIP.`, "error")
        return
      }
      formData.append("files", blob, nombre)
    }

    setSubiendo(true)
    setPorcentaje(0)
    try {
      const res = await intESAVIClient.post("/meddra/version/upload", formData, {
        // El cliente pone `application/json` por defecto. Hay que quitarlo para que el
        // navegador escriba `multipart/form-data` con su boundary; fijarlo a mano sin
        // boundary deja el cuerpo ilegible para el servidor.
        headers: { "Content-Type": undefined },
        onUploadProgress: (evento) => {
          if (evento.total) setPorcentaje(Math.round((evento.loaded / evento.total) * 100))
        },
      })
      show(res.data?.mensaje ?? "Sincronización MedDRA iniciada.", "info")
      setOpen(false)
      reiniciar()
      onDone?.()
    } catch (e: any) {
      show(mensajeError(e, "Error al iniciar la sincronización de MedDRA."), "error")
    } finally {
      setSubiendo(false)
      setPorcentaje(0)
    }
  }

  const ocupado = analizando || subiendo

  return (
    <Authorize allowedRoles={ROLES_SINCRONIZACION} deniedRoles={[]}>
      <Button variant="contained" size="small" startIcon={<SyncIcon />} onClick={() => setOpen(true)}>
        Sincronizar MedDRA
      </Button>

      <Dialog open={open} onClose={cerrar} maxWidth="sm" fullWidth>
        <DialogTitle>Sincronizar MedDRA</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Sube el ZIP que entrega MedDRA. Se abre en tu navegador —la contraseña no se envía al
            servidor— y sólo se transfieren los archivos que el sistema necesita leer.
          </Typography>

          <Stack spacing={2}>
            <Box>
              <Button
                variant="outlined"
                component="label"
                startIcon={<FolderZipIcon />}
                disabled={ocupado}
                fullWidth>
                {archivo ? archivo.name : "Seleccionar archivo ZIP"}
                <input
                  ref={inputArchivo}
                  type="file"
                  accept=".zip,application/zip,application/x-zip-compressed"
                  hidden
                  onChange={seleccionarArchivo}
                />
              </Button>
              {archivo && (
                <Typography variant="caption" color="text.secondary">
                  {formatearTamano(archivo.size)}
                </Typography>
              )}
            </Box>

            <Stack direction="row" spacing={1} alignItems="flex-start">
              <TextField
                label="Contraseña del ZIP"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && archivo && !ocupado) void analizar(archivo, password)
                }}
                helperText="Déjala vacía si el ZIP no está protegido."
                fullWidth
                size="small"
                disabled={ocupado}
                autoComplete="off"
              />
              <Button
                onClick={() => archivo && analizar(archivo, password)}
                disabled={!archivo || ocupado}
                sx={{ mt: 0.5, whiteSpace: "nowrap" }}>
                Analizar
              </Button>
            </Stack>

            {analizando && (
              <Box>
                <LinearProgress />
                <Typography variant="caption" color="text.secondary">
                  {progreso || "Analizando…"}
                </Typography>
              </Box>
            )}

            {errorZip && <Alert severity="error">{errorZip}</Alert>}

            {analisis && <ResumenAnalisis analisis={analisis} />}

            <Divider />

            <Stack direction="row" spacing={2}>
              <TextField
                label="Versión"
                placeholder="Ej: 28_0"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                fullWidth
                size="small"
                disabled={ocupado}
                error={Boolean(version) && !PATRON_VERSION.test(version.trim())}
                helperText={
                  analisis?.release
                    ? `Detectada en el ZIP: ${analisis.release.version}`
                    : "Formato 28 o 28_0"
                }
              />
              <TextField
                select
                label="Idioma"
                value={lang}
                onChange={(e) => setLang(e.target.value as IdiomaMeddra)}
                sx={{ minWidth: 140 }}
                size="small"
                disabled={ocupado}
                helperText={
                  analisis?.release?.idioma
                    ? `Detectado: ${analisis.release.idioma}`
                    : "Normalmente ES"
                }>
                {IDIOMAS.map((idioma) => (
                  <MenuItem key={idioma} value={idioma}>
                    {idioma === "ES" ? "ES — Español" : "EN — Inglés"}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            {analisis && impedimentos.length > 0 && (
              <Alert severity="error">
                <AlertTitle>No se puede sincronizar todavía</AlertTitle>
                <ul style={{ margin: 0, paddingLeft: "1.2em" }}>
                  {impedimentos.map((motivo) => (
                    <li key={motivo}>
                      <Typography variant="body2">{motivo}</Typography>
                    </li>
                  ))}
                </ul>
              </Alert>
            )}

            {puedeSincronizar && (
              <Alert severity="warning">
                La carga inserta unos 89.000 términos y <strong>puede tardar varios minutos</strong>.
                Puedes cerrar esta ventana: el avance se ve en la tabla de sincronizaciones y
                recibirás una notificación cuando termine.
              </Alert>
            )}

            {subiendo && (
              <Box>
                <LinearProgress variant="determinate" value={porcentaje} />
                <Typography variant="caption" color="text.secondary">
                  Enviando archivos… {porcentaje}%
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrar} disabled={ocupado}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={sincronizar}
            disabled={!puedeSincronizar}
            startIcon={subiendo ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}>
            {subiendo ? "Enviando…" : "Sincronizar"}
          </Button>
        </DialogActions>
      </Dialog>
      {node}
    </Authorize>
  )
}

/** Qué trae el ZIP: obligatorios, opcionales y lo que sobra. */
const ResumenAnalisis = ({ analisis }: { analisis: AnalisisZip }) => {
  const presentes = new Set(analisis.manifiesto)
  const historico = analisis.manifiesto.find((n) => /^meddra_history_[a-z]+\.asc$/.test(n))

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
        <Typography variant="subtitle2">Contenido del ZIP</Typography>
        <Chip
          size="small"
          color={analisis.valido ? "success" : "error"}
          label={analisis.valido ? "Estructura válida" : "Estructura incompleta"}
        />
        {analisis.release && (
          <Chip
            size="small"
            variant="outlined"
            label={`Sello: ${analisis.release.version}${
              analisis.release.idioma ? ` · ${analisis.release.idioma}` : ""
            }`}
          />
        )}
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 0.25,
          maxHeight: 220,
          overflowY: "auto",
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          p: 1,
        }}>
        {ARCHIVOS_REQUERIDOS.map((nombre) => (
          <FilaArchivo
            key={nombre}
            nombre={nombre}
            estado={presentes.has(nombre) ? "presente" : "falta"}
            tamano={analisis.archivos.find((a) => a.nombre === nombre)?.tamano}
          />
        ))}
        {ARCHIVOS_OPCIONALES.map((nombre) => (
          <FilaArchivo
            key={nombre}
            nombre={nombre}
            estado={presentes.has(nombre) ? "presente" : "opcional"}
            tamano={analisis.archivos.find((a) => a.nombre === nombre)?.tamano}
          />
        ))}
        <FilaArchivo
          nombre={historico ?? "meddra_history_*.asc"}
          estado={historico ? "presente" : "opcional"}
          tamano={analisis.archivos.find((a) => a.nombre === historico)?.tamano}
        />
      </Box>

      {analisis.avisos.map((aviso) => (
        <Typography key={aviso} variant="caption" color="text.secondary" display="block" mt={0.5}>
          {aviso}
        </Typography>
      ))}
    </Box>
  )
}

const FilaArchivo = ({
  nombre,
  estado,
  tamano,
}: {
  nombre: string
  estado: "presente" | "falta" | "opcional"
  tamano?: number
}) => {
  const icono =
    estado === "presente" ? (
      <CheckCircleIcon color="success" sx={{ fontSize: 16 }} />
    ) : estado === "falta" ? (
      <CancelIcon color="error" sx={{ fontSize: 16 }} />
    ) : (
      <RemoveCircleOutlineIcon sx={{ fontSize: 16, color: "text.disabled" }} />
    )

  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      {icono}
      <Typography
        variant="caption"
        sx={{ fontFamily: "monospace", color: estado === "falta" ? "error.main" : "text.primary" }}>
        {nombre}
      </Typography>
      {tamano ? (
        <Typography variant="caption" color="text.secondary">
          {formatearTamano(tamano)}
        </Typography>
      ) : null}
    </Stack>
  )
}
