import AddIcon from "@mui/icons-material/Add"
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline"
import EditOutlinedIcon from "@mui/icons-material/EditOutlined"
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material"
import { useEffect, useState } from "react"
import { useCreate, useDelete, useGetList, useNotify, useUpdate } from "react-admin"

interface CatalogoRecord {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
}

interface CatalogoCrudPanelProps {
  resource: "genero" | "etnia"
  label: string
  createLabel: string
}

const DEFAULT_FORM = { codigo: "", nombre: "", descripcion: "" }

export const CatalogoCrudPanel = ({ resource, label, createLabel }: CatalogoCrudPanelProps) => {
  const notify = useNotify()
  const [create, { isPending: creating }] = useCreate()
  const [update, { isPending: updating }] = useUpdate()
  const [deleteOne, { isPending: deleting }] = useDelete()

  const [page, setPage] = useState(0)
  const [perPage] = useState(10)
  const [search, setSearch] = useState("")

  const [dialog, setDialog] = useState<{ open: boolean; mode: "create" | "edit"; id?: string }>({
    open: false,
    mode: "create",
  })
  const [form, setForm] = useState({ ...DEFAULT_FORM })
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; label: string } | null>(null)

  useEffect(() => {
    setPage(0)
    setSearch("")
  }, [resource])

  const {
    data,
    total,
    isLoading,
    refetch,
  } = useGetList<CatalogoRecord>(resource, {
    pagination: { page: page + 1, perPage },
    sort: { field: "nombre", order: "ASC" },
    filter: { q: search },
  })

  const openCreate = () => {
    setForm({ ...DEFAULT_FORM })
    setDialog({ open: true, mode: "create" })
  }

  const openEdit = (record: CatalogoRecord) => {
    setForm({ codigo: record.codigo, nombre: record.nombre, descripcion: record.descripcion ?? "" })
    setDialog({ open: true, mode: "edit", id: record.id })
  }

  const submit = async () => {
    try {
      if (dialog.mode === "create") {
        await create(resource, { data: { ...form } }, { returnPromise: true })
        notify(`${label} creado`, { type: "success" })
      } else {
        await update(resource, { id: dialog.id!, data: { ...form } }, { returnPromise: true })
        notify(`${label} actualizado`, { type: "success" })
      }
      setDialog({ open: false, mode: "create" })
      refetch()
    } catch {
      notify("Error al guardar", { type: "error" })
    }
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteOne(resource, { id: deleteConfirm.id }, { returnPromise: true })
      notify("Registro eliminado", { type: "success" })
      setDeleteConfirm(null)
      refetch()
    } catch {
      notify("Error al eliminar", { type: "error" })
    }
  }

  return (
    <Paper elevation={2}>
      <Box px={2} py={1.5} display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h6" fontWeight={600}>
          Catálogo de {label}
        </Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate}>
          {createLabel}
        </Button>
      </Box>

      <Box px={2} pb={1.5}>
        <TextField
          label="Buscar"
          size="small"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
          sx={{ width: 280 }}
        />
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Código</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : !data?.length ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  Sin registros
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {row.codigo}
                    </Typography>
                  </TableCell>
                  <TableCell>{row.nombre}</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {row.descripcion || "—"}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => openEdit(row)}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteConfirm({ open: true, id: row.id, label: row.nombre })}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
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
        count={total ?? 0}
        page={page}
        rowsPerPage={perPage}
        rowsPerPageOptions={[10]}
        onPageChange={(_, p) => setPage(p)}
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
      />

      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, mode: "create" })} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog.mode === "create" ? createLabel : `Editar ${label}`}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Código"
              value={form.codigo}
              onChange={(e) => setForm((prev) => ({ ...prev, codigo: e.target.value }))}
              required
              fullWidth
              size="small"
              inputProps={{ maxLength: 10 }}
            />
            <TextField
              label="Nombre"
              value={form.nombre}
              onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
              required
              fullWidth
              size="small"
              inputProps={{ maxLength: 100 }}
            />
            <TextField
              label="Descripción"
              value={form.descripcion}
              onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
              fullWidth
              size="small"
              multiline
              rows={2}
              inputProps={{ maxLength: 255 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ open: false, mode: "create" })} disabled={creating || updating}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={submit}
            disabled={creating || updating || !form.codigo || !form.nombre}>
            {creating || updating ? <CircularProgress size={18} /> : dialog.mode === "create" ? "Crear" : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {deleteConfirm && (
        <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
          <DialogTitle>Confirmar eliminación</DialogTitle>
          <DialogContent>
            <DialogContentText>
              ¿Eliminar <strong>{deleteConfirm.label}</strong>? Esta acción no se puede deshacer.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirm(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button color="error" variant="contained" onClick={confirmDelete} disabled={deleting}>
              {deleting ? <CircularProgress size={18} /> : "Eliminar"}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Paper>
  )
}
