import AddIcon from "@mui/icons-material/Add"
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline"
import EditOutlinedIcon from "@mui/icons-material/EditOutlined"
import SearchIcon from "@mui/icons-material/Search"
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
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
import { Title, useCreate, useDelete, useGetList, useNotify, useUpdate } from "react-admin"

interface ParametroRecord {
  id: string
  clave: string
  valor: string
  descripcion?: string
}

const DEFAULT_FORM = { clave: "", valor: "", descripcion: "" }

export const ParametrosList = () => {
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
  }, [search])

  const { data, total, isLoading, refetch } = useGetList<ParametroRecord>("parametros", {
    pagination: { page: page + 1, perPage },
    sort: { field: "clave", order: "ASC" },
    filter: { q: search },
  })

  const openCreate = () => {
    setForm({ ...DEFAULT_FORM })
    setDialog({ open: true, mode: "create" })
  }

  const openEdit = (record: ParametroRecord) => {
    setForm({ clave: record.clave, valor: record.valor ?? "", descripcion: record.descripcion ?? "" })
    setDialog({ open: true, mode: "edit", id: record.id })
  }

  const closeDialog = () => setDialog({ open: false, mode: "create" })

  const submit = async () => {
    try {
      if (dialog.mode === "create") {
        await create("parametros", { data: { ...form } }, { returnPromise: true })
        notify("Parámetro creado", { type: "success" })
      } else {
        await update("parametros", { id: dialog.id!, data: { ...form } }, { returnPromise: true })
        notify("Parámetro actualizado", { type: "success" })
      }
      closeDialog()
      refetch()
    } catch {
      notify("Error al guardar el parámetro", { type: "error" })
    }
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteOne("parametros", { id: deleteConfirm.id }, { returnPromise: true })
      notify("Parámetro eliminado", { type: "success" })
      setDeleteConfirm(null)
      refetch()
    } catch {
      notify("Error al eliminar el parámetro", { type: "error" })
    }
  }

  return (
    <Box p={2}>
      <Title title="Parámetros" />
      <Paper elevation={2}>
        <Box px={2} py={1.5} display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle1" fontWeight={700}>Parámetros</Typography>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate}>
            Nuevo
          </Button>
        </Box>
        <Divider />
        <Box px={2} py={1.5}>
          <TextField
            placeholder="Buscar por clave, valor o descripción"
            size="small"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <Divider />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Clave</TableCell>
                <TableCell>Valor</TableCell>
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
                      <Typography variant="body2" fontFamily="monospace" fontWeight={500}>
                        {row.clave}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {row.valor || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary"
                        sx={{ maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
                          onClick={() => setDeleteConfirm({ open: true, id: row.id, label: row.clave })}>
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
      </Paper>

      {/* Create / Edit Dialog */}
      <Dialog open={dialog.open} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog.mode === "create" ? "Nuevo Parámetro" : "Editar Parámetro"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Clave"
              value={form.clave}
              onChange={(e) => setForm((prev) => ({ ...prev, clave: e.target.value }))}
              required
              fullWidth
              size="small"
              inputProps={{ maxLength: 32 }}
              disabled={dialog.mode === "edit"}
              helperText={dialog.mode === "edit" ? "La clave no puede modificarse" : "Máximo 32 caracteres, debe ser única"}
            />
            <TextField
              label="Valor"
              value={form.valor}
              onChange={(e) => setForm((prev) => ({ ...prev, valor: e.target.value }))}
              fullWidth
              size="small"
              multiline
              rows={3}
            />
            <TextField
              label="Descripción"
              value={form.descripcion}
              onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
              fullWidth
              size="small"
              multiline
              rows={2}
              inputProps={{ maxLength: 512 }}
              helperText="Máximo 512 caracteres"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={creating || updating}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={submit}
            disabled={creating || updating || !form.clave}>
            {creating || updating ? (
              <CircularProgress size={18} />
            ) : dialog.mode === "create" ? (
              "Crear"
            ) : (
              "Guardar"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      {deleteConfirm && (
        <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth>
          <DialogTitle>Confirmar eliminación</DialogTitle>
          <DialogContent>
            <DialogContentText>
              ¿Eliminar el parámetro <strong>{deleteConfirm.label}</strong>? Esta acción no se puede deshacer.
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
    </Box>
  )
}
