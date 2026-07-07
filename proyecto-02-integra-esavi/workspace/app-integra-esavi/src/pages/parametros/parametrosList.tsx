import AddIcon from "@mui/icons-material/Add"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import ChevronRightIcon from "@mui/icons-material/ChevronRight"
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline"
import EditOutlinedIcon from "@mui/icons-material/EditOutlined"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import FilterListIcon from "@mui/icons-material/FilterList"
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined"
import SearchIcon from "@mui/icons-material/Search"
import VisibilityIcon from "@mui/icons-material/Visibility"
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff"
import {
  Autocomplete,
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material"
import { Fragment, useMemo, useState } from "react"
import { Title, useCreate, useDelete, useGetList, useNotify, useUpdate } from "react-admin"

enum TipoDato {
  STRING = "STRING",
  NUMBER = "NUMBER",
  BOOLEAN = "BOOLEAN",
}

const TIPO_DATO_OPTIONS: { value: TipoDato; label: string }[] = [
  { value: TipoDato.STRING, label: "STRING (Para guardar textos, palabras, correos o URLs)" },
  { value: TipoDato.NUMBER, label: "NUMBER (Para guardar números enteros, decimales, montos o porcentajes)" },
  { value: TipoDato.BOOLEAN, label: "BOOLEAN (Para guardar estados de verdadero/falso o activar/desactivar funciones)" },
]

interface ParametroRecord {
  id: string
  clave: string
  valor: string
  descripcion?: string
  modulo?: string
  tipo_dato?: TipoDato
  es_encriptado?: boolean
}

const DEFAULT_FORM = {
  clave: "",
  valor: "",
  descripcion: "",
  modulo: "",
  tipo_dato: TipoDato.STRING,
  es_encriptado: false,
}

export const ParametrosList = () => {
  const notify = useNotify()
  const [create, { isPending: creating }] = useCreate()
  const [update, { isPending: updating }] = useUpdate()
  const [deleteOne, { isPending: deleting }] = useDelete()

  const [search, setSearch] = useState("")
  const [showFilter, setShowFilter] = useState(false)
  const [collapsedModules, setCollapsedModules] = useState<Set<string>>(new Set())
  const [revealedValues, setRevealedValues] = useState<Set<string>>(new Set())

  const [dialog, setDialog] = useState<{ open: boolean; mode: "create" | "edit"; id?: string }>({
    open: false,
    mode: "create",
  })
  const [form, setForm] = useState({ ...DEFAULT_FORM })
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; label: string } | null>(null)

  const { data, isLoading, refetch } = useGetList<ParametroRecord>("parametros", {
    pagination: { page: 1, perPage: 1000 },
    sort: { field: "clave", order: "ASC" },
    filter: { q: search },
  })

  const moduleGroups = useMemo(() => {
    const map = new Map<string, ParametroRecord[]>()
    ;(data ?? []).forEach((row) => {
      const key = row.modulo?.trim() || "Sin módulo"
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(row)
    })
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b, "es"))
      .map(([modulo, rows]) => ({ modulo, rows }))
  }, [data])

  const moduloOptions = useMemo(() => {
    const set = new Set<string>()
    ;(data ?? []).forEach((row) => {
      if (row.modulo) set.add(row.modulo)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"))
  }, [data])

  const toggleModule = (modulo: string) => {
    setCollapsedModules((prev) => {
      const next = new Set(prev)
      if (next.has(modulo)) next.delete(modulo)
      else next.add(modulo)
      return next
    })
  }

  const toggleReveal = (id: string) => {
    setRevealedValues((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const openCreate = () => {
    setForm({ ...DEFAULT_FORM })
    setDialog({ open: true, mode: "create" })
  }

  const openEdit = (record: ParametroRecord) => {
    setForm({
      clave: record.clave,
      valor: record.valor ?? "",
      descripcion: record.descripcion ?? "",
      modulo: record.modulo ?? "",
      tipo_dato: record.tipo_dato ?? TipoDato.STRING,
      es_encriptado: record.es_encriptado ?? false,
    })
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
    <Box p={2} pb={4}>
      <Title title="Parámetros" />
      <Paper elevation={2}>
        <Box px={2} py={1.5} display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" fontWeight={600} lineHeight={1.2}>
              Parámetros
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title={showFilter ? "Ocultar filtros" : "Mostrar filtros"}>
              <IconButton
                size="small"
                onClick={() => setShowFilter((v) => !v)}
                color={showFilter ? "primary" : "default"}>
                <Badge variant="dot" color="primary" invisible={!search}>
                  <FilterListIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate}>
              Nuevo
            </Button>
          </Stack>
        </Box>

        <Collapse in={showFilter}>
          <Box px={2} pb={1.5} display="flex" gap={2} alignItems="center">
            <TextField
              placeholder="Buscar..."
              size="small"
              sx={{ width: 300 }}
              value={search}
              autoFocus={showFilter}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
            />
            <Button size="small" onClick={() => setSearch("")}>
              Limpiar
            </Button>
          </Box>
        </Collapse>

        <Divider />
        <TableContainer sx={{ maxHeight: "calc(100vh - 260px)", overflowY: "auto" }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Clave</TableCell>
                <TableCell>Valor</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Tipo de dato</TableCell>
                <TableCell align="center">Encriptado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : !data?.length && search ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                      <InboxOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                      <Typography variant="body2" color="text.secondary">
                        Sin resultados para "{search}"
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : !data?.length ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                      <InboxOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                      <Typography variant="body2" color="text.secondary">
                        Sin parámetros registrados. Crea el primero con + Nuevo.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                moduleGroups.map((group) => {
                  const isCollapsed = collapsedModules.has(group.modulo)
                  return (
                    <Fragment key={group.modulo}>
                      <TableRow
                        hover
                        onClick={() => toggleModule(group.modulo)}
                        sx={{ cursor: "pointer", bgcolor: "action.hover" }}>
                        <TableCell colSpan={6} sx={{ py: 0.75 }}>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            {isCollapsed ? (
                              <ChevronRightIcon sx={{ fontSize: 20, color: "text.secondary" }} />
                            ) : (
                              <ExpandMoreIcon sx={{ fontSize: 20, color: "text.secondary" }} />
                            )}
                            <Typography variant="subtitle2" fontWeight={700}>
                              {group.modulo}
                            </Typography>
                            <Chip label={group.rows.length} size="small" sx={{ height: 20, fontSize: 11 }} />
                          </Box>
                        </TableCell>
                      </TableRow>
                      {!isCollapsed &&
                        group.rows.map((row) => (
                          <TableRow key={row.id} hover>
                            <TableCell sx={{ pl: 5 }}>
                              <Typography variant="body2" fontFamily="monospace" fontWeight={500}>
                                {row.clave}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {(() => {
                                const isMasked = row.es_encriptado && !revealedValues.has(row.id)
                                return (
                                  <Box display="flex" alignItems="center">
                                    <Typography
                                      variant="body2"
                                      fontFamily={row.es_encriptado ? "monospace" : undefined}
                                      color={isMasked ? "text.secondary" : "text.primary"}
                                      sx={{
                                        maxWidth: 260,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}>
                                      {isMasked ? "••••••••••" : row.valor || "—"}
                                    </Typography>
                                    <Box sx={{ width: 30, flexShrink: 0, display: "flex", justifyContent: "center" }}>
                                      {row.es_encriptado && (
                                        <Tooltip title={isMasked ? "Mostrar valor" : "Ocultar valor"}>
                                          <IconButton
                                            size="small"
                                            onClick={() => toggleReveal(row.id)}
                                            sx={{ p: 0.5, color: isMasked ? "text.secondary" : "primary.main" }}>
                                            {isMasked ? (
                                              <VisibilityIcon sx={{ fontSize: 16 }} />
                                            ) : (
                                              <VisibilityOffIcon sx={{ fontSize: 16 }} />
                                            )}
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                    </Box>
                                  </Box>
                                )
                              })()}
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {row.descripcion || "—"}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{row.tipo_dato || "—"}</Typography>
                            </TableCell>
                            <TableCell align="center">
                              {row.es_encriptado ? (
                                <CheckCircleIcon sx={{ fontSize: 18 }} color="success" />
                              ) : (
                                <Typography variant="body2" color="text.disabled">
                                  —
                                </Typography>
                              )}
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
                        ))}
                    </Fragment>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create / Edit Dialog */}
      <Dialog open={dialog.open} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog.mode === "create" ? "Nuevo Parámetro" : "Editar Parámetro"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} mt={1}>
            <Box display="flex" gap={2}>
              <Autocomplete
                freeSolo
                fullWidth
                size="small"
                options={moduloOptions}
                inputValue={form.modulo}
                onInputChange={(_, value) => setForm((prev) => ({ ...prev, modulo: value.slice(0, 64) }))}
                renderInput={(params) => (
                  <TextField {...params} label="Módulo" helperText="Máximo 64 caracteres, agrupa parámetros relacionados" />
                )}
              />
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
            </Box>
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
            <Box display="flex" gap={2} alignItems="flex-start">
              <TextField
                select
                label="Tipo de dato"
                value={form.tipo_dato}
                onChange={(e) => setForm((prev) => ({ ...prev, tipo_dato: e.target.value as TipoDato }))}
                fullWidth
                size="small"
                required>
                {TIPO_DATO_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                flexShrink={0}
                sx={{
                  width: 150,
                  height: 40,
                  px: 1.5,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                }}>
                <Typography variant="body2" color="text.secondary">
                  Encriptado
                </Typography>
                <Switch
                  size="small"
                  checked={form.es_encriptado}
                  onChange={(e) => setForm((prev) => ({ ...prev, es_encriptado: e.target.checked }))}
                />
              </Box>
            </Box>
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
