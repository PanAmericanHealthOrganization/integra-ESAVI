import LocalHospitalIcon from "@mui/icons-material/LocalHospital"
import MedicationIcon from "@mui/icons-material/Medication"
import SyncIcon from "@mui/icons-material/Sync"
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material"
import { ReactNode, useEffect, useState } from "react"
import { Title } from "react-admin"
import intESAVIClient from "../../dataProviders/axios.client"

interface MeddraSync {
  id: number
  meddraVersion: string
  lang: string
  description: string
  startSyncDate: string
  endSyncDate: string
  syncStatus: string
}

interface DrugSync {
  id: string
  proccesId: string
  startSyncDate: string
  endSyncDate: string
  syncStatus: string
}

const STATUS_COLOR: Record<string, "default" | "warning" | "success" | "error"> = {
  STARTED: "warning",
  FINISHED: "success",
  ERROR: "error",
}

const STATUS_LABEL: Record<string, string> = {
  STARTED: "En proceso",
  FINISHED: "Completado",
  ERROR: "Error",
}

const SyncTable = ({
  title,
  icon,
  columns,
  rows,
  loading,
  total,
  page,
  onPageChange,
  action,
}: {
  title: string
  icon: ReactNode
  columns: string[]
  rows: ReactNode[][]
  loading: boolean
  total: number
  page: number
  onPageChange: (p: number) => void
  action?: ReactNode
}) => (
  <Paper elevation={2} sx={{ p: 2 }}>
    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
      <Stack direction="row" alignItems="center" spacing={1}>
        {icon}
        <Typography variant="h6" fontWeight={600}>
          {title}
        </Typography>
      </Stack>
      {action}
    </Stack>
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col}>{col}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                <CircularProgress size={28} />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ py: 4, color: "text.secondary" }}>
                Sin registros de sincronización.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((cells, i) => (
              <TableRow key={i} hover>
                {cells.map((cell, j) => (
                  <TableCell key={j}>{cell}</TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
    <TablePagination
      component="div"
      count={total}
      page={page}
      rowsPerPage={10}
      rowsPerPageOptions={[10]}
      onPageChange={(_, p) => onPageChange(p)}
      labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
    />
  </Paper>
)

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleString("es-EC")
}

export const SincronizacionesPage = () => {
  const [meddraData, setMeddraData] = useState<MeddraSync[]>([])
  const [meddraTotal, setMeddraTotal] = useState(0)
  const [meddraPage, setMeddraPage] = useState(0)
  const [meddraLoading, setMeddraLoading] = useState(false)
  const [meddraRefresh, setMeddraRefresh] = useState(0)

  const [whodData, setWhodData] = useState<DrugSync[]>([])
  const [whodTotal, setWhodTotal] = useState(0)
  const [whodPage, setWhodPage] = useState(0)
  const [whodLoading, setWhodLoading] = useState(false)
  const [whodRefresh, setWhodRefresh] = useState(0)

  // MedDRA sync dialog
  const [meddraDialogOpen, setMeddraDialogOpen] = useState(false)
  const [meddraVersion, setMeddraVersion] = useState("")
  const [meddraLang, setMeddraLang] = useState("")
  const [meddraSyncing, setMeddraSyncing] = useState(false)

  // WHODrug confirm dialog
  const [whodConfirmOpen, setWhodConfirmOpen] = useState(false)
  const [whodSyncing, setWhodSyncing] = useState(false)

  // Snackbar feedback
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  })

  const showSnack = (message: string, severity: "success" | "error") =>
    setSnack({ open: true, message, severity })

  useEffect(() => {
    setMeddraLoading(true)
    intESAVIClient
      .get("/meddra/sync/list", { params: { page: meddraPage, size: 10 } })
      .then((res) => {
        setMeddraData(res.data.data ?? [])
        setMeddraTotal(res.data.total ?? 0)
      })
      .catch(() => setMeddraData([]))
      .finally(() => setMeddraLoading(false))
  }, [meddraPage, meddraRefresh])

  useEffect(() => {
    setWhodLoading(true)
    intESAVIClient
      .get("/whodrug/list", { params: { page: whodPage, size: 10 } })
      .then((res) => {
        setWhodData(res.data.data ?? [])
        setWhodTotal(res.data.total ?? 0)
      })
      .catch(() => setWhodData([]))
      .finally(() => setWhodLoading(false))
  }, [whodPage, whodRefresh])

  const handleMeddraSync = async () => {
    if (!meddraVersion.trim() || !meddraLang.trim()) return
    setMeddraSyncing(true)
    try {
      await intESAVIClient.post("/meddra/version/process", {
        version: meddraVersion.trim(),
        lang: meddraLang.trim(),
      })
      showSnack("Sincronización MedDRA iniciada correctamente.", "success")
      setMeddraDialogOpen(false)
      setMeddraVersion("")
      setMeddraLang("")
      setMeddraRefresh((n) => n + 1)
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? "Error al sincronizar MedDRA."
      showSnack(msg, "error")
    } finally {
      setMeddraSyncing(false)
    }
  }

  const handleWhodSync = async () => {
    setWhodSyncing(true)
    try {
      await intESAVIClient.post("/whodrug/sync")
      showSnack("Sincronización WHODrug iniciada correctamente.", "success")
      setWhodConfirmOpen(false)
      setWhodRefresh((n) => n + 1)
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? "Error al sincronizar WHODrug."
      showSnack(msg, "error")
      setWhodConfirmOpen(false)
    } finally {
      setWhodSyncing(false)
    }
  }

  const meddraRows = meddraData.map((s) => [
    <Typography variant="body2" fontWeight={500}>{s.meddraVersion}</Typography>,
    <Chip label={s.lang} size="small" variant="outlined" />,
    <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 240 }}>{s.description}</Typography>,
    <Typography variant="body2">{formatDate(s.startSyncDate)}</Typography>,
    <Typography variant="body2">{formatDate(s.endSyncDate)}</Typography>,
    <Chip
      label={STATUS_LABEL[s.syncStatus] ?? s.syncStatus}
      size="small"
      color={STATUS_COLOR[s.syncStatus] ?? "default"}
    />,
  ])

  const whodRows = whodData.map((s) => [
    <Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">{s.id}</Typography>,
    <Typography variant="body2" fontFamily="monospace" fontSize="0.75rem" color="text.secondary">{s.proccesId}</Typography>,
    <Typography variant="body2">{formatDate(s.startSyncDate)}</Typography>,
    <Typography variant="body2">{formatDate(s.endSyncDate)}</Typography>,
    <Chip
      label={STATUS_LABEL[s.syncStatus] ?? s.syncStatus}
      size="small"
      color={STATUS_COLOR[s.syncStatus] ?? "default"}
    />,
  ])

  return (
    <Box p={2}>
      <Title title="Sincronizaciones — Estándares" />

      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <SyncIcon color="primary" />
        <Typography variant="h5" fontWeight={600}>
          Sincronizaciones de Estándares
        </Typography>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <SyncTable
            title="MedDRA — Historial de Sincronizaciones"
            icon={<LocalHospitalIcon color="primary" />}
            columns={["Versión", "Idioma", "Descripción", "Inicio", "Fin", "Estado"]}
            rows={meddraRows}
            loading={meddraLoading}
            total={meddraTotal}
            page={meddraPage}
            onPageChange={setMeddraPage}
            action={
              <Button
                variant="contained"
                size="small"
                startIcon={<SyncIcon />}
                onClick={() => setMeddraDialogOpen(true)}
              >
                Sincronizar MedDRA
              </Button>
            }
          />
        </Grid>

        <Grid item xs={12}>
          <SyncTable
            title="WHODrug — Historial de Sincronizaciones"
            icon={<MedicationIcon color="secondary" />}
            columns={["ID", "Proceso ID", "Inicio", "Fin", "Estado"]}
            rows={whodRows}
            loading={whodLoading}
            total={whodTotal}
            page={whodPage}
            onPageChange={setWhodPage}
            action={
              <Button
                variant="contained"
                size="small"
                color="secondary"
                startIcon={<SyncIcon />}
                onClick={() => setWhodConfirmOpen(true)}
              >
                Sincronizar WHODrug
              </Button>
            }
          />
        </Grid>
      </Grid>

      {/* Diálogo MedDRA */}
      <Dialog
        open={meddraDialogOpen}
        onClose={() => !meddraSyncing && setMeddraDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Sincronizar MedDRA</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Ingresa la versión y el idioma de los archivos MedDRA ya cargados en el servidor
            (ruta: <code>upload_files/meddra/&lt;versión&gt;/&lt;idioma&gt;/</code>).
          </DialogContentText>
          <TextField
            label="Versión"
            placeholder="Ej: 27_1"
            value={meddraVersion}
            onChange={(e) => setMeddraVersion(e.target.value)}
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            disabled={meddraSyncing}
          />
          <TextField
            label="Idioma"
            placeholder="Ej: es"
            value={meddraLang}
            onChange={(e) => setMeddraLang(e.target.value)}
            fullWidth
            size="small"
            disabled={meddraSyncing}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMeddraDialogOpen(false)} disabled={meddraSyncing}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleMeddraSync}
            disabled={meddraSyncing || !meddraVersion.trim() || !meddraLang.trim()}
            startIcon={meddraSyncing ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
          >
            {meddraSyncing ? "Procesando…" : "Sincronizar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo confirmación WHODrug */}
      <Dialog
        open={whodConfirmOpen}
        onClose={() => !whodSyncing && setWhodConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Sincronizar WHODrug</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Este proceso descarga y actualiza el diccionario WHODrug completo. Puede tomar varios
            minutos. ¿Deseas continuar?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWhodConfirmOpen(false)} disabled={whodSyncing}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleWhodSync}
            disabled={whodSyncing}
            startIcon={whodSyncing ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
          >
            {whodSyncing ? "Iniciando…" : "Confirmar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar feedback */}
      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          variant="filled"
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
