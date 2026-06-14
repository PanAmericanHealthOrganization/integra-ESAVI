import LocalHospitalIcon from "@mui/icons-material/LocalHospital"
import MedicationIcon from "@mui/icons-material/Medication"
import SyncIcon from "@mui/icons-material/Sync"
import {
  Box,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
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
}: {
  title: string
  icon: ReactNode
  columns: string[]
  rows: ReactNode[][]
  loading: boolean
  total: number
  page: number
  onPageChange: (p: number) => void
}) => (
  <Paper elevation={2} sx={{ p: 2 }}>
    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
      {icon}
      <Typography variant="h6" fontWeight={600}>
        {title}
      </Typography>
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

  const [whodData, setWhodData] = useState<DrugSync[]>([])
  const [whodTotal, setWhodTotal] = useState(0)
  const [whodPage, setWhodPage] = useState(0)
  const [whodLoading, setWhodLoading] = useState(false)

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
  }, [meddraPage])

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
  }, [whodPage])

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
          />
        </Grid>
      </Grid>
    </Box>
  )
}
