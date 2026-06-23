import AddIcon from "@mui/icons-material/Add"
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline"
import EditOutlinedIcon from "@mui/icons-material/EditOutlined"
import FilterListIcon from "@mui/icons-material/FilterList"
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined"
import SearchIcon from "@mui/icons-material/Search"
import {
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
  Paper,
  Stack,
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
import { useState } from "react"
import { Title, useCreate, useDelete, useGetList, useNotify, useUpdate } from "react-admin"

interface CatalogoPadreRecord {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  padre?: { id: string; codigo: string; nombre: string }
}

type DialogMode = "nueva-categoria" | "nueva-subcategoria" | "edit-categoria" | "edit-subcategoria"

const DEFAULT_FORM = { codigo: "", nombre: "", descripcion: "" }

export const CatalogosConfigList = () => {
  const notify = useNotify()
  const [create, { isPending: creating }] = useCreate()
  const [update, { isPending: updating }] = useUpdate()
  const [deleteOne, { isPending: deleting }] = useDelete()

  const [selectedCategoria, setSelectedCategoria] = useState<CatalogoPadreRecord | null>(null)
  const [searchCategoria, setSearchCategoria] = useState("")
  const [searchSubcategoria, setSearchSubcategoria] = useState("")
  const [showFilterCat, setShowFilterCat] = useState(false)
  const [showFilterSub, setShowFilterSub] = useState(false)

  const [dialog, setDialog] = useState<{
    open: boolean
    mode: DialogMode
    id?: string
    padreId?: string
  }>({ open: false, mode: "nueva-categoria" })

  const [form, setForm] = useState({ ...DEFAULT_FORM })
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean
    id: string
    label: string
  } | null>(null)

  const { data: todos, isLoading, refetch } = useGetList<CatalogoPadreRecord>("catalogo-padre", {
    pagination: { page: 1, perPage: 1000 },
    sort: { field: "nombre", order: "ASC" },
    filter: {},
  })

  const categorias = (todos ?? []).filter((r) => !r.padre)
  const subcategorias = selectedCategoria
    ? (todos ?? []).filter((r) => r.padre?.id === selectedCategoria.id)
    : []

  const filteredCategorias = searchCategoria
    ? categorias.filter(
        (c) =>
          c.codigo.toLowerCase().includes(searchCategoria.toLowerCase()) ||
          c.nombre.toLowerCase().includes(searchCategoria.toLowerCase())
      )
    : categorias

  const filteredSubcategorias = searchSubcategoria
    ? subcategorias.filter(
        (s) =>
          s.codigo.toLowerCase().includes(searchSubcategoria.toLowerCase()) ||
          s.nombre.toLowerCase().includes(searchSubcategoria.toLowerCase()) ||
          (s.descripcion ?? "").toLowerCase().includes(searchSubcategoria.toLowerCase())
      )
    : subcategorias

  const openNuevaCategoria = () => {
    setForm({ ...DEFAULT_FORM })
    setDialog({ open: true, mode: "nueva-categoria" })
  }

  const openNuevaSubcategoria = () => {
    if (!selectedCategoria) return
    setForm({ ...DEFAULT_FORM })
    setDialog({ open: true, mode: "nueva-subcategoria", padreId: selectedCategoria.id })
  }

  const openEditCategoria = (record: CatalogoPadreRecord, e: React.MouseEvent) => {
    e.stopPropagation()
    setForm({ codigo: record.codigo, nombre: record.nombre, descripcion: record.descripcion ?? "" })
    setDialog({ open: true, mode: "edit-categoria", id: record.id })
  }

  const openEditSubcategoria = (record: CatalogoPadreRecord) => {
    setForm({ codigo: record.codigo, nombre: record.nombre, descripcion: record.descripcion ?? "" })
    setDialog({ open: true, mode: "edit-subcategoria", id: record.id, padreId: record.padre?.id })
  }

  const closeDialog = () => setDialog((prev) => ({ ...prev, open: false }))

  const submit = async () => {
    try {
      const isSubDialog =
        dialog.mode === "nueva-subcategoria" || dialog.mode === "edit-subcategoria"
      const payload = {
        ...form,
        padreId: isSubDialog ? dialog.padreId : undefined,
      }
      const isEditMode = dialog.mode === "edit-categoria" || dialog.mode === "edit-subcategoria"

      if (isEditMode) {
        await update("catalogo-padre", { id: dialog.id!, data: payload }, { returnPromise: true })
        notify("Registro actualizado correctamente", { type: "success" })
      } else {
        await create("catalogo-padre", { data: payload }, { returnPromise: true })
        notify(
          dialog.mode === "nueva-categoria"
            ? "Categoría creada correctamente"
            : "Subcategoría creada correctamente",
          { type: "success" }
        )
      }
      closeDialog()
      refetch()
    } catch {
      notify("Error al guardar el registro", { type: "error" })
    }
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteOne("catalogo-padre", { id: deleteConfirm.id }, { returnPromise: true })
      if (selectedCategoria?.id === deleteConfirm.id) setSelectedCategoria(null)
      notify("Registro eliminado correctamente", { type: "success" })
      setDeleteConfirm(null)
      refetch()
    } catch {
      notify("Error al eliminar el registro", { type: "error" })
    }
  }

  const isEditMode = dialog.mode === "edit-categoria" || dialog.mode === "edit-subcategoria"

  const dialogTitles: Record<DialogMode, string> = {
    "nueva-categoria": "Nueva Categoría",
    "nueva-subcategoria": `Nueva Subcategoría — ${selectedCategoria?.nombre ?? ""}`,
    "edit-categoria": "Editar Categoría",
    "edit-subcategoria": "Editar Subcategoría",
  }


  return (
    <Box p={2}>
      <Title title="Catálogos" />
      <Box display="flex" gap={2} alignItems="flex-start">

        {/* ── Panel: Categorías ── */}
        <Paper elevation={2} sx={{ flex: 2, minWidth: 0 }}>
          <Box px={2} py={1.5} display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="baseline" gap={1}>
              <Typography variant="subtitle1" fontWeight={700}>
                Categorías
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Tooltip title={showFilterCat ? "Ocultar filtros" : "Mostrar filtros"}>
                <IconButton
                  size="small"
                  onClick={() => setShowFilterCat((v) => !v)}
                  color={showFilterCat ? "primary" : "default"}>
                  <Badge variant="dot" color="primary" invisible={!searchCategoria}>
                    <FilterListIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
              <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openNuevaCategoria}>
                Nuevo
              </Button>
            </Stack>
          </Box>

          <Collapse in={showFilterCat}>
            <Box px={2} pb={1.5} display="flex" gap={2} alignItems="center">
              <TextField
                placeholder="Buscar..."
                size="small"
                autoFocus
                sx={{ width: 240 }}
                value={searchCategoria}
                onChange={(e) => setSearchCategoria(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
              />
              <Button size="small" onClick={() => setSearchCategoria("")}>
                Limpiar
              </Button>
            </Box>
          </Collapse>

          <Divider />
          <TableContainer sx={{ maxHeight: 460 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Código</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell align="right" sx={{ pr: 1 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : !categorias.length ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                      <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                        <InboxOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                        <Typography variant="body2" color="text.secondary">
                          Sin categorías registradas. Crea la primera con + Nuevo.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : !filteredCategorias.length ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                      <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                        <InboxOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                        <Typography variant="body2" color="text.secondary">
                          Sin resultados para "{searchCategoria}"
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategorias.map((cat) => {
                    const isSelected = selectedCategoria?.id === cat.id
                    return (
                      <TableRow
                        key={cat.id}
                        hover
                        selected={isSelected}
                        sx={{ cursor: "pointer" }}
                        onClick={() => { setSelectedCategoria(cat); setSearchSubcategoria("") }}>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace" fontWeight={500}>
                            {cat.codigo}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={isSelected ? 700 : 400}>
                            {cat.nombre}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ whiteSpace: "nowrap", pr: 1 }}>
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={(e) => openEditCategoria(cat, e)}>
                              <EditOutlinedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteConfirm({ open: true, id: cat.id, label: cat.nombre })
                              }}>
                              <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* ── Panel: Subcategorías ── */}
        <Paper elevation={2} sx={{ flex: 3, minWidth: 0 }}>
          <Box px={2} py={1.5} display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1} sx={{ minWidth: 0, overflow: "hidden", flex: 1, mr: 1 }}>
              <Box display="flex" alignItems="baseline" gap={1} sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ whiteSpace: "nowrap" }}>
                  Subcategorías
                </Typography>
              </Box>
              {selectedCategoria && (
                <Chip
                  label={selectedCategoria.nombre}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ maxWidth: 140, overflow: "hidden" }}
                />
              )}
            </Box>
            <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
              <Tooltip title={showFilterSub ? "Ocultar filtros" : "Mostrar filtros"}>
                <span>
                  <IconButton
                    size="small"
                    onClick={() => setShowFilterSub((v) => !v)}
                    color={showFilterSub ? "primary" : "default"}
                    disabled={!selectedCategoria}>
                    <Badge variant="dot" color="primary" invisible={!searchSubcategoria}>
                      <FilterListIcon />
                    </Badge>
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={!selectedCategoria ? "Selecciona una categoría primero" : ""} placement="left">
                <span>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    disabled={!selectedCategoria}
                    onClick={openNuevaSubcategoria}>
                    Nuevo
                  </Button>
                </span>
              </Tooltip>
            </Stack>
          </Box>

          <Collapse in={showFilterSub && !!selectedCategoria}>
            <Box px={2} pb={1.5} display="flex" gap={2} alignItems="center">
              <TextField
                placeholder="Buscar..."
                size="small"
                autoFocus
                sx={{ width: 240 }}
                value={searchSubcategoria}
                onChange={(e) => setSearchSubcategoria(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
              />
              <Button size="small" onClick={() => setSearchSubcategoria("")}>
                Limpiar
              </Button>
            </Box>
          </Collapse>

          <Divider />
          <TableContainer sx={{ maxHeight: 460 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Código</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell align="right" sx={{ pr: 1 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {!selectedCategoria ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                      <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                        <InboxOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                        <Typography variant="body2" color="text.secondary">
                          Selecciona una categoría para ver sus subcategorías
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : !subcategorias.length ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                      <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                        <InboxOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                        <Typography variant="body2" color="text.secondary">
                          "{selectedCategoria.nombre}" no tiene subcategorías. Usa + Nuevo para agregar.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : !filteredSubcategorias.length ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                      <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                        <InboxOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                        <Typography variant="body2" color="text.secondary">
                          Sin resultados para "{searchSubcategoria}"
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubcategorias.map((sub) => (
                    <TableRow key={sub.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace" fontWeight={500}>
                          {sub.codigo}
                        </Typography>
                      </TableCell>
                      <TableCell>{sub.nombre}</TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {sub.descripcion || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap", pr: 1 }}>
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => openEditSubcategoria(sub)}>
                            <EditOutlinedIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteConfirm({ open: true, id: sub.id, label: sub.nombre })}>
                            <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      {/* ── Diálogo Crear / Editar ── */}
      <Dialog open={dialog.open} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogTitles[dialog.mode]}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Código"
              value={form.codigo}
              onChange={(e) => setForm((prev) => ({ ...prev, codigo: e.target.value }))}
              required
              fullWidth
              size="small"
              inputProps={{ maxLength: 20 }}
              disabled={isEditMode}
              helperText={
                isEditMode
                  ? "El código no puede modificarse"
                  : "Máximo 20 caracteres, debe ser único"
              }
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
            disabled={creating || updating || !form.codigo || !form.nombre}>
            {creating || updating ? (
              <CircularProgress size={18} />
            ) : isEditMode ? (
              "Guardar"
            ) : (
              "Crear"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Diálogo Confirmar Eliminación ── */}
      {deleteConfirm && (
        <Dialog
          open={deleteConfirm.open}
          onClose={() => setDeleteConfirm(null)}
          maxWidth="xs"
          fullWidth>
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
    </Box>
  )
}
