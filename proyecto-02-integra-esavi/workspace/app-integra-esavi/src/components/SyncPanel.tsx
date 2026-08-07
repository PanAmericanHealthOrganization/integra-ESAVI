import SyncIcon from "@mui/icons-material/Sync"
import {
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material"
import { ReactNode, useEffect, useState } from "react"
import intESAVIClient from "../dataProviders/axios.client"

/**
 * Fuentes registradas en DHI_ESAVI.TR_SYNC_PROCESS. Debe coincidir con el enum
 * SyncSource del API.
 */
export type SyncSource =
  | "MEDDRA"
  | "WHODRUG"
  | "DATAMART"
  | "VACUNOMETRO"
  | "DHIS2"
  | "VIGIFLOW"
  | "SEED"

export interface SyncProcess {
  id: string
  source: SyncSource
  name: string
  status: "RUNNING" | "COMPLETED" | "FAILED"
  startTime: string
  endTime: string | null
  message?: string
  errorMessage?: string
  metadata?: Record<string, any>
}

/** Único mapa de estados de la app: los tres valores que escribe el API. */
export const STATUS_COLOR: Record<string, "default" | "warning" | "success" | "error"> = {
  RUNNING: "warning",
  COMPLETED: "success",
  FAILED: "error",
}

export const STATUS_LABEL: Record<string, string> = {
  RUNNING: "En proceso",
  COMPLETED: "Completado",
  FAILED: "Error",
}

export const formatSyncDate = (dateStr?: string | null) =>
  dateStr ? new Date(dateStr).toLocaleString("es-EC") : "—"

/**
 * Historial de sincronizaciones de una fuente, leído del log único
 * (GET /integrator/syncs/list?source=…). Cada pantalla monta este panel con su
 * propia fuente y su propio botón de disparo, en lugar de la antigua página
 * "Sincronizaciones" que las agrupaba todas.
 */
export const SyncPanel = ({
  title,
  source,
  icon,
  action,
  refreshKey = 0,
  extraColumns,
}: {
  title: string
  source: SyncSource
  icon?: ReactNode
  /** Botón de sincronización. Debe venir ya envuelto en <Authorize>. */
  action?: ReactNode
  /** Cambiar este valor vuelve a cargar la tabla. */
  refreshKey?: number
  /** Columnas adicionales derivadas de metadata, propias de cada fuente. */
  extraColumns?: { header: string; render: (row: SyncProcess) => ReactNode }[]
}) => {
  const [rows, setRows] = useState<SyncProcess[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    intESAVIClient
      .get("/integrator/syncs/list", { params: { source, page, size: 10 } })
      .then((res) => {
        setRows(res.data.data ?? [])
        setTotal(res.data.total ?? 0)
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }, [source, page, refreshKey])

  const columns = ["Proceso", "Inicio", "Fin", "Estado", ...(extraColumns?.map((c) => c.header) ?? []), "Detalle"]

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Stack direction="row" alignItems="center" spacing={1}>
          {icon ?? <SyncIcon color="primary" />}
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
        </Stack>
        {action}
      </Stack>

      <TableContainer sx={{ overflowX: "auto" }}>
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
                <TableCell
                  colSpan={columns.length}
                  align="center"
                  sx={{ py: 4, color: "text.secondary" }}>
                  Sin registros de sincronización.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography variant="body2">{row.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{formatSyncDate(row.startTime)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{formatSyncDate(row.endTime)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={STATUS_LABEL[row.status] ?? row.status}
                      size="small"
                      color={STATUS_COLOR[row.status] ?? "default"}
                    />
                  </TableCell>
                  {extraColumns?.map((col) => (
                    <TableCell key={col.header}>{col.render(row)}</TableCell>
                  ))}
                  <TableCell>
                    <Tooltip title={row.errorMessage ?? row.message ?? ""}>
                      <Typography
                        variant="body2"
                        color={row.errorMessage ? "error" : "text.secondary"}
                        noWrap
                        sx={{ maxWidth: 320 }}>
                        {row.errorMessage ?? row.message ?? "—"}
                      </Typography>
                    </Tooltip>
                  </TableCell>
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
        onPageChange={(_, p) => setPage(p)}
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
      />
    </Paper>
  )
}
