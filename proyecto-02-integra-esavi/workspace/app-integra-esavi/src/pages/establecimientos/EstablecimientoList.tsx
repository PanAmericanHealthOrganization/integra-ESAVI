import AddIcon from "@mui/icons-material/Add"
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline"
import EditOutlinedIcon from "@mui/icons-material/EditOutlined"
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined"
import LocalHospitalIcon from "@mui/icons-material/LocalHospital"
import SearchIcon from "@mui/icons-material/Search"
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
import { alpha, useTheme } from "@mui/material/styles"
import { useEffect, useMemo, useRef, useState } from "react"
import { Title, useCreate, useDelete, useGetList, useNotify, useUpdate } from "react-admin"

interface ParroquiaRecord {
  id: string
  codigo: string
  nombre: string
  canton?: { codigo: string; nombre: string; provincia?: { codigo: string; nombre: string } }
}

interface CatalogoPadreRecord {
  id: string
  codigo: string
  nombre: string
  padre?: { codigo: string; nombre: string }
}

interface EstablecimientoRecord {
  id: string
  uniCodigo: string
  uniNombre: string
  tipoEntidad?: CatalogoPadreRecord
  direccion?: string
  telefono?: string
  mail?: string
  parroquiaResidencia?: ParroquiaRecord
}

const EMPTY_FORM = {
  uniCodigo: "",
  uniNombre: "",
  tipoEntidadId: "",
  direccion: "",
  telefono: "",
  mail: "",
  parroquiaCodigo: "",
}

export const EstablecimientoList = () => {
  const notify = useNotify()
  const theme = useTheme()
  const [create, { isPending: creating }] = useCreate()
  const [update, { isPending: updating }] = useUpdate()
  const [deleteOne, { isPending: deleting }] = useDelete()

  const [page, setPage] = useState(0)
  const [perPage] = useState(10)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [selectedProvincia, setSelectedProvincia] = useState("")
  const [selectedCanton, setSelectedCanton] = useState("")
  const [dlg, setDlg] = useState<{ open: boolean; mode: "create" | "edit"; id?: string }>({
    open: false,
    mode: "create",
  })
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean; id: string; label: string
  } | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(0)
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  const { data: establecimientos, total, isLoading, refetch } = useGetList<EstablecimientoRecord>(
    "establecimientos",
    {
      pagination: { page: page + 1, perPage },
      sort: { field: "uniNombre", order: "ASC" },
      filter: debouncedSearch ? { q: debouncedSearch } : {},
    }
  )

  const { data: allCatalogoPadre } = useGetList<CatalogoPadreRecord>(
    "catalogo-padre",
    { pagination: { page: 1, perPage: 9999 }, sort: { field: "nombre", order: "ASC" }, filter: {} }
  )

  const tiposEntidad = useMemo(
    () => (allCatalogoPadre ?? []).filter((c) => c.padre?.codigo === "ENTIDAD"),
    [allCatalogoPadre]
  )

  const { data: todasParroquias } = useGetList<ParroquiaRecord>(
    "parroquias",
    { pagination: { page: 1, perPage: 9999 }, sort: { field: "nombre", order: "ASC" }, filter: {} }
  )

  const provincias = useMemo(() => {
    const map = new Map<string, string>()
    ;(todasParroquias ?? []).forEach((p) => {
      if (p.canton?.provincia) map.set(p.canton.provincia.codigo, p.canton.provincia.nombre)
    })
    return Array.from(map.entries())
      .map(([codigo, nombre]) => ({ codigo, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [todasParroquias])

  const cantones = useMemo(() => {
    if (!selectedProvincia) return []
    const map = new Map<string, string>()
    ;(todasParroquias ?? []).forEach((p) => {
      if (p.canton?.provincia?.codigo === selectedProvincia && p.canton)
        map.set(p.canton.codigo, p.canton.nombre)
    })
    return Array.from(map.entries())
      .map(([codigo, nombre]) => ({ codigo, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [todasParroquias, selectedProvincia])

  const parroquiasFiltradas = useMemo(() => {
    if (!selectedCanton) return []
    return (todasParroquias ?? [])
      .filter((p) => p.canton?.codigo === selectedCanton)
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [todasParroquias, selectedCanton])

  const rows = establecimientos ?? []

  const resetLocation = () => {
    setSelectedProvincia("")
    setSelectedCanton("")
    setForm((f) => ({ ...f, parroquiaCodigo: "" }))
  }

  const openCreate = () => {
    setForm({ ...EMPTY_FORM })
    resetLocation()
    setDlg({ open: true, mode: "create" })
  }

  const openEdit = (r: EstablecimientoRecord, e: React.MouseEvent) => {
    e.stopPropagation()
    const par = r.parroquiaResidencia
    setSelectedProvincia(par?.canton?.provincia?.codigo ?? "")
    setSelectedCanton(par?.canton?.codigo ?? "")
    setForm({
      uniCodigo: r.uniCodigo,
      uniNombre: r.uniNombre,
      tipoEntidadId: r.tipoEntidad?.id ?? "",
      direccion: r.direccion ?? "",
      telefono: r.telefono ?? "",
      mail: r.mail ?? "",
      parroquiaCodigo: par?.codigo ?? "",
    })
    setDlg({ open: true, mode: "edit", id: r.id })
  }

  const closeDialog = () => {
    setDlg({ open: false, mode: "create" })
    resetLocation()
  }

  const handleProvinciaChange = (codigo: string) => {
    setSelectedProvincia(codigo)
    setSelectedCanton("")
    setForm((f) => ({ ...f, parroquiaCodigo: "" }))
  }

  const handleCantonChange = (codigo: string) => {
    setSelectedCanton(codigo)
    setForm((f) => ({ ...f, parroquiaCodigo: "" }))
  }

  const buildPayload = (includeCode: boolean) => {
    const payload: Record<string, unknown> = { uniNombre: form.uniNombre }
    if (includeCode) payload.uniCodigo = form.uniCodigo
    if (form.tipoEntidadId) payload.tipoEntidadId = form.tipoEntidadId
    if (form.direccion) payload.direccion = form.direccion
    if (form.telefono) payload.telefono = form.telefono
    if (form.mail) payload.mail = form.mail
    if (form.parroquiaCodigo) payload.parroquiaCodigo = form.parroquiaCodigo
    return payload
  }

  const submit = async () => {
    try {
      if (dlg.mode === "create") {
        await create("establecimientos", { data: buildPayload(true) }, { returnPromise: true })
        notify("Establecimiento creado correctamente", { type: "success" })
      } else {
        await update("establecimientos", { id: dlg.id!, data: buildPayload(false) }, { returnPromise: true })
        notify("Establecimiento actualizado correctamente", { type: "success" })
      }
      closeDialog()
      refetch()
    } catch (err: any) {
      const backendMsg = err?.response?.data?.message
      const msg = Array.isArray(backendMsg)
        ? backendMsg.join(" | ")
        : backendMsg ?? err?.message ?? "Error al guardar el establecimiento"
      notify(msg, { type: "error" })
    }
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteOne("establecimientos", { id: deleteConfirm.id }, { returnPromise: true })
      notify("Establecimiento eliminado correctamente", { type: "success" })
      setDeleteConfirm(null)
      refetch()
    } catch (err: any) {
      const backendMsg = err?.response?.data?.message
      const msg = Array.isArray(backendMsg)
        ? backendMsg.join(" | ")
        : backendMsg ?? err?.message ?? "Error al eliminar el establecimiento"
      notify(msg, { type: "error" })
    }
  }

  const isBusy = creating || updating

  return (
    <Box p={2}>
      <Title title="Establecimientos" />
      <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
        {/* ── Cabecera ── */}
        <Box
          px={2.5}
          py={2}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          gap={1.5}
          flexWrap="wrap"
          sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar sx={{ bgcolor: "primary.main", width: 38, height: 38 }}>
              <LocalHospitalIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                Establecimientos
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {isLoading ? "Cargando..." : `${total ?? 0} establecimiento${total === 1 ? "" : "s"}`}
              </Typography>
            </Box>
          </Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <TextField
              placeholder="Buscar..."
              size="small"
              sx={{ width: 280, bgcolor: "background.paper" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
            />
            <Button size="small" onClick={() => { setSearch(""); setDebouncedSearch(""); setPage(0) }} disabled={!search}>
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

        {/* ── Tabla ── */}
        <TableContainer sx={{ maxHeight: 480 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {["Código", "Nombre", "Tipo", "Provincia", "Cantón", "Parroquia", "Ubicación", "Correo", ""].map((head, idx) => (
                  <TableCell
                    key={head || idx}
                    align={idx === 8 ? "right" : "left"}
                    sx={{
                      minWidth: idx === 0 ? 80 : idx === 2 ? 140 : [3, 4, 5].includes(idx) ? 110 : idx === 6 ? 160 : idx === 7 ? 140 : undefined,
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
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : !rows.length && debouncedSearch ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                      <InboxOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                      <Typography variant="body2" color="text.secondary">
                        Sin resultados para "{debouncedSearch}"
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : !rows.length ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                      <InboxOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                      <Typography variant="body2" color="text.secondary">
                        Sin establecimientos registrados. Crea el primero con + Nuevo.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((est) => (
                  <TableRow key={est.id} hover>
                    <TableCell>
                      <Box
                        component="span"
                        sx={{ display: "inline-block", fontFamily: "monospace", fontSize: 12.5, fontWeight: 600, bgcolor: "action.hover", px: 0.9, py: 0.3, borderRadius: 1 }}>
                        {est.uniCodigo}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {est.uniNombre}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 160 }}>
                      <Tooltip title={est.tipoEntidad?.nombre ?? ""} placement="top" disableHoverListener={!est.tipoEntidad?.nombre}>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {est.tipoEntidad?.nombre || "—"}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 120 }}>
                      <Tooltip title={est.parroquiaResidencia?.canton?.provincia?.nombre ?? ""} placement="top" disableHoverListener={!est.parroquiaResidencia?.canton?.provincia?.nombre}>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {est.parroquiaResidencia?.canton?.provincia?.nombre || "—"}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 120 }}>
                      <Tooltip title={est.parroquiaResidencia?.canton?.nombre ?? ""} placement="top" disableHoverListener={!est.parroquiaResidencia?.canton?.nombre}>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {est.parroquiaResidencia?.canton?.nombre || "—"}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 120 }}>
                      <Tooltip title={est.parroquiaResidencia?.nombre ?? ""} placement="top" disableHoverListener={!est.parroquiaResidencia?.nombre}>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {est.parroquiaResidencia?.nombre || "—"}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>
                      <Tooltip title={est.direccion ?? ""} placement="top" disableHoverListener={!est.direccion}>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {est.direccion || "—"}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {est.mail || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap", pr: 0.5 }}>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={(e) => openEdit(est, e)}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteConfirm({ open: true, id: est.id, label: est.uniNombre })}>
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

        {/* ── Paginación ── */}
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

      {/* ── Diálogo Crear / Editar ── */}
      <Dialog open={dlg.open} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dlg.mode === "create" ? "Nuevo Establecimiento" : "Editar Establecimiento"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Stack direction="row" spacing={1.5}>
              <TextField
                label="Código"
                value={form.uniCodigo}
                onChange={(e) => setForm((f) => ({ ...f, uniCodigo: e.target.value.toUpperCase() }))}
                required
                size="small"
                inputProps={{ maxLength: 10 }}
                disabled={dlg.mode === "edit"}
                helperText={dlg.mode === "edit" ? "No modificable" : "Código único (ej: AS01)"}
                sx={{ flex: 1 }}
              />
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Tipo de entidad</InputLabel>
                <Select
                  value={form.tipoEntidadId}
                  label="Tipo de entidad"
                  onChange={(e) => setForm((f) => ({ ...f, tipoEntidadId: e.target.value }))}
                  MenuProps={{ PaperProps: { sx: { maxHeight: 280 } } }}>
                  <MenuItem value=""><em>Sin seleccionar</em></MenuItem>
                  {tiposEntidad.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      <Typography variant="body2">{t.nombre}</Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <TextField
              label="Nombre"
              value={form.uniNombre}
              onChange={(e) => setForm((f) => ({ ...f, uniNombre: e.target.value }))}
              required
              fullWidth
              size="small"
              inputProps={{ maxLength: 100 }}
            />

            <Stack direction="row" spacing={1.5}>
              <TextField
                label="Dirección"
                value={form.direccion}
                onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
                size="small"
                inputProps={{ maxLength: 255 }}
                sx={{ flex: 2 }}
              />
              <TextField
                label="Teléfono"
                value={form.telefono}
                onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                size="small"
                inputProps={{ maxLength: 30 }}
                sx={{ flex: 1 }}
              />
            </Stack>

            <Divider textAlign="left">
              <Typography variant="caption" color="text.secondary">
                Ubicación geográfica
              </Typography>
            </Divider>

            <FormControl fullWidth size="small">
              <InputLabel>Provincia</InputLabel>
              <Select
                value={selectedProvincia}
                label="Provincia"
                onChange={(e) => handleProvinciaChange(e.target.value)}
                MenuProps={{ PaperProps: { sx: { maxHeight: 280 } } }}>
                <MenuItem value=""><em>Sin seleccionar</em></MenuItem>
                {provincias.map((prov) => (
                  <MenuItem key={prov.codigo} value={prov.codigo}>
                    <Typography variant="body2">
                      <Box component="span" fontFamily="monospace" fontWeight={600} mr={1}>
                        {prov.codigo}
                      </Box>
                      {prov.nombre}
                    </Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small" disabled={!selectedProvincia}>
              <InputLabel>Cantón</InputLabel>
              <Select
                value={selectedCanton}
                label="Cantón"
                onChange={(e) => handleCantonChange(e.target.value)}
                MenuProps={{ PaperProps: { sx: { maxHeight: 280 } } }}>
                <MenuItem value="">
                  <em>{selectedProvincia ? "Sin seleccionar" : "Selecciona una provincia primero"}</em>
                </MenuItem>
                {cantones.map((can) => (
                  <MenuItem key={can.codigo} value={can.codigo}>
                    <Typography variant="body2">
                      <Box component="span" fontFamily="monospace" fontWeight={600} mr={1}>
                        {can.codigo}
                      </Box>
                      {can.nombre}
                    </Typography>
                  </MenuItem>
                ))}
              </Select>
              {!selectedProvincia && (
                <FormHelperText>Selecciona una provincia primero</FormHelperText>
              )}
            </FormControl>

            <FormControl fullWidth size="small" disabled={!selectedCanton}>
              <InputLabel>Parroquia</InputLabel>
              <Select
                value={form.parroquiaCodigo}
                label="Parroquia"
                onChange={(e) => setForm((f) => ({ ...f, parroquiaCodigo: e.target.value }))}
                MenuProps={{ PaperProps: { sx: { maxHeight: 280 } } }}>
                <MenuItem value="">
                  <em>{selectedCanton ? "Sin asignar" : "Selecciona un cantón primero"}</em>
                </MenuItem>
                {parroquiasFiltradas.map((p) => (
                  <MenuItem key={p.id} value={p.codigo}>
                    <Typography variant="body2">
                      <Box component="span" fontFamily="monospace" fontWeight={600} mr={1}>
                        {p.codigo}
                      </Box>
                      {p.nombre}
                    </Typography>
                  </MenuItem>
                ))}
              </Select>
              {!selectedCanton && (
                <FormHelperText>Selecciona un cantón primero</FormHelperText>
              )}
            </FormControl>

            <TextField
              label="Correo electrónico"
              value={form.mail}
              onChange={(e) => setForm((f) => ({ ...f, mail: e.target.value }))}
              size="small"
              inputProps={{ maxLength: 100 }}
              type="email"
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={isBusy}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={submit}
            disabled={isBusy || !form.uniCodigo || !form.uniNombre}>
            {isBusy ? <CircularProgress size={18} /> : dlg.mode === "create" ? "Crear" : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Confirmar eliminación ── */}
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
    </Box>
  )
}
