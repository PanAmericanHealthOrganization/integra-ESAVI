import AddIcon from "@mui/icons-material/Add"
import CloseIcon from "@mui/icons-material/Close"
import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline"
import EditOutlinedIcon from "@mui/icons-material/EditOutlined"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined"
import LockOutlinedIcon from "@mui/icons-material/LockOutlined"
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined"
import SearchIcon from "@mui/icons-material/Search"
import TuneIcon from "@mui/icons-material/Tune"
import VisibilityIcon from "@mui/icons-material/Visibility"
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff"
import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
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
import { alpha, useTheme } from "@mui/material/styles"
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

const UNASSIGNED_MODULE = "Sin módulo"

// Paleta de acento por módulo: se asigna de forma determinística (hash del
// nombre) para que cada módulo tenga siempre el mismo color entre recargas.
const MODULE_COLOR_KEYS = ["primary", "secondary", "success", "warning", "info", "error"] as const
type ModuleColorKey = (typeof MODULE_COLOR_KEYS)[number]

const getModuleColorKey = (modulo: string): ModuleColorKey => {
  let hash = 0
  for (let i = 0; i < modulo.length; i++) hash = (hash * 31 + modulo.charCodeAt(i)) >>> 0
  return MODULE_COLOR_KEYS[hash % MODULE_COLOR_KEYS.length]
}

const getModuleInitials = (modulo: string): string => {
  const parts = modulo.trim().split(/[\s_-]+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return modulo.trim().slice(0, 2).toUpperCase() || "?"
}

export const ParametrosList = () => {
  const notify = useNotify()
  const theme = useTheme()
  const [create, { isPending: creating }] = useCreate()
  const [update, { isPending: updating }] = useUpdate()
  const [deleteOne, { isPending: deleting }] = useDelete()

  const [search, setSearch] = useState("")
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
      const key = row.modulo?.trim() || UNASSIGNED_MODULE
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

  const moduleAccent = (modulo: string) => {
    if (modulo === UNASSIGNED_MODULE) {
      return { main: theme.palette.text.disabled, soft: alpha(theme.palette.text.disabled, 0.08) }
    }
    const main = theme.palette[getModuleColorKey(modulo)].main
    return { main, soft: alpha(main, 0.1) }
  }

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

  const copyValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value ?? "")
      notify("Valor copiado al portapapeles", { type: "info" })
    } catch {
      notify("No se pudo copiar el valor", { type: "warning" })
    }
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
      <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
        <Box
          px={2.5}
          py={2}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          gap={2}
          flexWrap="wrap"
          sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar sx={{ bgcolor: "primary.main", width: 38, height: 38 }}>
              <TuneIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                Parámetros
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {isLoading
                  ? "Cargando..."
                  : `${data?.length ?? 0} parámetro${data?.length === 1 ? "" : "s"} en ${moduleGroups.length} módulo${moduleGroups.length === 1 ? "" : "s"}`}
              </Typography>
            </Box>
          </Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <TextField
              placeholder="Buscar clave, valor o módulo..."
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: 280, bgcolor: "background.paper" }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
            />
            <Button size="small" onClick={() => setSearch("")} disabled={!search}>
              Limpiar
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={openCreate}
              sx={{ borderRadius: 5, px: 2, boxShadow: "none", "&:hover": { boxShadow: "none" } }}>
              Nuevo
            </Button>
          </Stack>
        </Box>

        <Divider />
        <TableContainer sx={{ maxHeight: "calc(100vh - 260px)", overflowY: "auto" }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {["Clave", "Valor", "Descripción", "Tipo de dato", "Encriptado", ""].map((head, idx) => (
                  <TableCell
                    key={head || idx}
                    align={head === "Encriptado" ? "center" : idx === 5 ? "right" : "left"}
                    sx={{
                      bgcolor: "background.paper",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 0.6,
                      textTransform: "uppercase",
                      color: "text.secondary",
                    }}>
                    {head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8, border: 0 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : !data?.length && search ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8, border: 0 }}>
                    <Stack alignItems="center" spacing={1}>
                      <InboxOutlinedIcon sx={{ fontSize: 42, color: "text.disabled" }} />
                      <Typography variant="body2" color="text.secondary">
                        Sin resultados para "{search}"
                      </Typography>
                      <Button size="small" onClick={() => setSearch("")}>
                        Limpiar búsqueda
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : !data?.length ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8, border: 0 }}>
                    <Stack alignItems="center" spacing={1}>
                      <InboxOutlinedIcon sx={{ fontSize: 42, color: "text.disabled" }} />
                      <Typography variant="body2" color="text.secondary">
                        Sin parámetros registrados
                      </Typography>
                      <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={openCreate}>
                        Crear el primero
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                moduleGroups.map((group) => {
                  const isCollapsed = collapsedModules.has(group.modulo)
                  const accent = moduleAccent(group.modulo)
                  return (
                    <Fragment key={group.modulo}>
                      <TableRow
                        hover
                        onClick={() => toggleModule(group.modulo)}
                        sx={{
                          cursor: "pointer",
                          bgcolor: accent.soft,
                          "& td": { borderBottom: isCollapsed ? "1px solid" : 0, borderColor: "divider" },
                        }}>
                        <TableCell colSpan={6} sx={{ py: 1, borderLeft: `3px solid ${accent.main}` }}>
                          <Box display="flex" alignItems="center" gap={1.25}>
                            <ExpandMoreIcon
                              sx={{
                                fontSize: 20,
                                color: "text.secondary",
                                transition: "transform 0.18s ease",
                                transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                              }}
                            />
                            <Avatar
                              variant="rounded"
                              sx={{
                                width: 26,
                                height: 26,
                                fontSize: 11,
                                fontWeight: 700,
                                bgcolor: accent.main,
                                color: theme.palette.getContrastText(accent.main),
                              }}>
                              {getModuleInitials(group.modulo)}
                            </Avatar>
                            <Typography variant="subtitle2" fontWeight={700}>
                              {group.modulo}
                            </Typography>
                            <Chip
                              label={group.rows.length}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: 11,
                                fontWeight: 600,
                                bgcolor: alpha(accent.main, 0.16),
                                color: accent.main,
                              }}
                            />
                          </Box>
                        </TableCell>
                      </TableRow>
                      {!isCollapsed &&
                        group.rows.map((row) => (
                          <TableRow
                            key={row.id}
                            hover
                            sx={{ "&:last-of-type td": { borderBottom: 0 } }}>
                            <TableCell sx={{ pl: 3.5, borderLeft: `3px solid ${alpha(accent.main, 0.25)}` }}>
                              <Box
                                component="span"
                                sx={{
                                  fontFamily: "monospace",
                                  fontSize: 12.5,
                                  fontWeight: 600,
                                  bgcolor: "action.hover",
                                  px: 0.9,
                                  py: 0.3,
                                  borderRadius: 1,
                                  whiteSpace: "nowrap",
                                }}>
                                {row.clave}
                              </Box>
                            </TableCell>
                            <TableCell>
                              {(() => {
                                const isMasked = row.es_encriptado && !revealedValues.has(row.id)
                                return (
                                  <Box display="flex" alignItems="center" gap={0.25}>
                                    <Typography
                                      variant="body2"
                                      fontFamily={row.es_encriptado ? "monospace" : undefined}
                                      color={isMasked ? "text.secondary" : "text.primary"}
                                      sx={{
                                        maxWidth: 220,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}>
                                      {isMasked ? "••••••••••" : row.valor || "—"}
                                    </Typography>
                                    {row.es_encriptado && (
                                      <Tooltip title={isMasked ? "Mostrar valor" : "Ocultar valor"}>
                                        <IconButton
                                          size="small"
                                          onClick={() => toggleReveal(row.id)}
                                          sx={{ p: 0.5, color: isMasked ? "text.secondary" : "primary.main" }}>
                                          {isMasked ? (
                                            <VisibilityIcon sx={{ fontSize: 15 }} />
                                          ) : (
                                            <VisibilityOffIcon sx={{ fontSize: 15 }} />
                                          )}
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                    {row.valor && (
                                      <Tooltip title="Copiar valor">
                                        <IconButton
                                          size="small"
                                          onClick={() => copyValue(row.valor)}
                                          sx={{ p: 0.5, color: "text.disabled", "&:hover": { color: "text.secondary" } }}>
                                          <ContentCopyIcon sx={{ fontSize: 14 }} />
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                  </Box>
                                )
                              })()}
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ maxWidth: 340, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {row.descripcion || "—"}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={row.tipo_dato || "—"}
                                size="small"
                                variant="outlined"
                                sx={{ height: 20, fontSize: 10.5, fontWeight: 600, color: "text.secondary" }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              {row.es_encriptado ? (
                                <Chip
                                  icon={<LockOutlinedIcon sx={{ fontSize: 13 }} />}
                                  label="Cifrado"
                                  size="small"
                                  sx={{
                                    height: 22,
                                    fontSize: 10.5,
                                    fontWeight: 600,
                                    bgcolor: alpha(theme.palette.success.main, 0.12),
                                    color: "success.dark",
                                    "& .MuiChip-icon": { color: "success.dark" },
                                  }}
                                />
                              ) : (
                                <Chip
                                  icon={<LockOpenOutlinedIcon sx={{ fontSize: 13 }} />}
                                  label="Plano"
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 22, fontSize: 10.5, fontWeight: 600, color: "text.disabled", borderColor: "divider" }}
                                />
                              )}
                            </TableCell>
                            <TableCell align="right">
                              <Stack direction="row" spacing={0.5} justifyContent="flex-end">
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
                              </Stack>
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
      <Dialog open={dialog.open} onClose={closeDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
          {dialog.mode === "create" ? "Nuevo parámetro" : "Editar parámetro"}
          <IconButton size="small" onClick={closeDialog}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Divider />
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
                inputProps={{ maxLength: 32, style: { fontFamily: "monospace" } }}
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
              inputProps={{ style: { fontFamily: "monospace", fontSize: 13 } }}
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
                gap={0.5}
                sx={{
                  width: 160,
                  height: 40,
                  px: 1.5,
                  border: "1px solid",
                  borderColor: form.es_encriptado ? "success.main" : "divider",
                  bgcolor: form.es_encriptado ? alpha(theme.palette.success.main, 0.08) : "transparent",
                  borderRadius: 5,
                  transition: "all 0.15s ease",
                }}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  {form.es_encriptado ? (
                    <LockOutlinedIcon sx={{ fontSize: 15, color: "success.dark" }} />
                  ) : (
                    <LockOpenOutlinedIcon sx={{ fontSize: 15, color: "text.disabled" }} />
                  )}
                  <Typography variant="body2" color={form.es_encriptado ? "success.dark" : "text.secondary"}>
                    Cifrado
                  </Typography>
                </Stack>
                <Switch
                  size="small"
                  checked={form.es_encriptado}
                  onChange={(e) => setForm((prev) => ({ ...prev, es_encriptado: e.target.checked }))}
                />
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeDialog} disabled={creating || updating}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={submit}
            disabled={creating || updating || !form.clave}
            sx={{ borderRadius: 5, px: 2.5, boxShadow: "none" }}>
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
        <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
          <DialogTitle>Confirmar eliminación</DialogTitle>
          <DialogContent>
            <DialogContentText>
              ¿Eliminar el parámetro <strong>{deleteConfirm.label}</strong>? Esta acción no se puede deshacer.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setDeleteConfirm(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button color="error" variant="contained" onClick={confirmDelete} disabled={deleting} sx={{ borderRadius: 5, boxShadow: "none" }}>
              {deleting ? <CircularProgress size={18} /> : "Eliminar"}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  )
}
