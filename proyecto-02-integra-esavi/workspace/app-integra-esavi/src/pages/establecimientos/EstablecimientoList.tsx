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
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material"
import { useMemo, useState } from "react"
import { Title, useCreate, useDelete, useGetList, useNotify, useUpdate } from "react-admin"

interface ParroquiaRecord {
  id: string
  codigo: string
  nombre: string
  canton?: { codigo: string; nombre: string; provincia?: { codigo: string; nombre: string } }
}

interface EstablecimientoRecord {
  id: string
  uniCodigo: string
  uniNombre: string
  tipoEntidad?: string
  zonaCodigo?: string
  zonaDescripcion?: string
  distritoCodigo?: string
  distritoDescripcion?: string
  circuitoCodigo?: string
  longitudGps?: number
  latitudGps?: number
  mail?: string
  parroquiaResidencia?: ParroquiaRecord
}

const EMPTY_FORM = {
  uniCodigo: "",
  uniNombre: "",
  tipoEntidad: "",
  zonaCodigo: "",
  zonaDescripcion: "",
  distritoCodigo: "",
  distritoDescripcion: "",
  circuitoCodigo: "",
  mail: "",
  parroquiaCodigo: "",
}

export const EstablecimientoList = () => {
  const notify = useNotify()
  const [create, { isPending: creating }] = useCreate()
  const [update, { isPending: updating }] = useUpdate()
  const [deleteOne, { isPending: deleting }] = useDelete()

  const [search, setSearch] = useState("")
  const [showFilter, setShowFilter] = useState(false)
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

  const { data: establecimientos, isLoading, refetch } = useGetList<EstablecimientoRecord>(
    "establecimientos",
    { pagination: { page: 1, perPage: 9999 }, sort: { field: "uniNombre", order: "ASC" }, filter: {} }
  )

  const { data: todasParroquias } = useGetList<ParroquiaRecord>(
    "parroquias",
    { pagination: { page: 1, perPage: 9999 }, sort: { field: "nombre", order: "ASC" }, filter: {} }
  )

  const provincias = useMemo(() => {
    const map = new Map<string, string>()
    ;(todasParroquias ?? []).forEach((p) => {
      if (p.canton?.provincia) {
        map.set(p.canton.provincia.codigo, p.canton.provincia.nombre)
      }
    })
    return Array.from(map.entries())
      .map(([codigo, nombre]) => ({ codigo, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [todasParroquias])

  const cantones = useMemo(() => {
    if (!selectedProvincia) return []
    const map = new Map<string, string>()
    ;(todasParroquias ?? []).forEach((p) => {
      if (p.canton?.provincia?.codigo === selectedProvincia && p.canton) {
        map.set(p.canton.codigo, p.canton.nombre)
      }
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

  const filtered = useMemo(() => {
    const all = establecimientos ?? []
    if (!search) return all
    const q = search.toLowerCase()
    return all.filter(
      (e) =>
        e.uniCodigo.toLowerCase().includes(q) ||
        e.uniNombre.toLowerCase().includes(q) ||
        (e.tipoEntidad ?? "").toLowerCase().includes(q) ||
        (e.parroquiaResidencia?.nombre ?? "").toLowerCase().includes(q) ||
        (e.parroquiaResidencia?.canton?.nombre ?? "").toLowerCase().includes(q)
    )
  }, [establecimientos, search])


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
      tipoEntidad: r.tipoEntidad ?? "",
      zonaCodigo: r.zonaCodigo ?? "",
      zonaDescripcion: r.zonaDescripcion ?? "",
      distritoCodigo: r.distritoCodigo ?? "",
      distritoDescripcion: r.distritoDescripcion ?? "",
      circuitoCodigo: r.circuitoCodigo ?? "",
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
    const payload: Record<string, unknown> = {
      uniNombre: form.uniNombre,
    }
    if (includeCode) payload.uniCodigo = form.uniCodigo
    if (form.tipoEntidad) payload.tipoEntidad = form.tipoEntidad
    if (form.zonaCodigo) payload.zonaCodigo = form.zonaCodigo
    if (form.zonaDescripcion) payload.zonaDescripcion = form.zonaDescripcion
    if (form.distritoCodigo) payload.distritoCodigo = form.distritoCodigo
    if (form.distritoDescripcion) payload.distritoDescripcion = form.distritoDescripcion
    if (form.circuitoCodigo) payload.circuitoCodigo = form.circuitoCodigo
    if (form.mail) payload.mail = form.mail
    if (form.parroquiaCodigo) payload.parroquiaCodigo = form.parroquiaCodigo
    return payload
  }

  const submit = async () => {
    try {
      if (dlg.mode === "create") {
        await create(
          "establecimientos",
          { data: buildPayload(true) },
          { returnPromise: true }
        )
        notify("Establecimiento creado correctamente", { type: "success" })
      } else {
        await update(
          "establecimientos",
          { id: dlg.id!, data: buildPayload(false) },
          { returnPromise: true }
        )
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

      <Paper elevation={2}>
        <Box px={2} py={1.5} display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" fontWeight={600} lineHeight={1.2}>
              Establecimientos
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

        <TableContainer sx={{ maxHeight: 520 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 80 }}>Código</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell sx={{ minWidth: 90 }}>Tipo</TableCell>
                <TableCell sx={{ minWidth: 180 }}>Ubicación</TableCell>
                <TableCell sx={{ minWidth: 110 }}>Admin.</TableCell>
                <TableCell sx={{ minWidth: 140 }}>Correo</TableCell>
                <TableCell align="right" sx={{ pr: 1, width: 72 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : !filtered.length && search ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                      <InboxOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                      <Typography variant="body2" color="text.secondary">
                        Sin resultados para "{search}"
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : !filtered.length ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                      <InboxOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                      <Typography variant="body2" color="text.secondary">
                        No hay establecimientos registrados. Usa + Nuevo para agregar.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((est) => (
                  <TableRow key={est.id} hover>
                    <TableCell>
                      <Typography variant="caption" fontFamily="monospace" fontWeight={600}>
                        {est.uniCodigo}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{est.uniNombre}</Typography>
                    </TableCell>
                    <TableCell>
                      {est.tipoEntidad ? (
                        <Chip label={est.tipoEntidad} size="small" variant="outlined" />
                      ) : (
                        <Typography variant="body2" color="text.disabled">—</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {est.parroquiaResidencia?.nombre ?? "—"}
                      </Typography>
                      {est.parroquiaResidencia?.canton && (
                        <Typography variant="caption" color="text.secondary" display="block" noWrap>
                          {est.parroquiaResidencia.canton.nombre}
                          {est.parroquiaResidencia.canton.provincia
                            ? ` · ${est.parroquiaResidencia.canton.provincia.nombre}`
                            : ""}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip
                        title={[est.zonaDescripcion, est.distritoDescripcion].filter(Boolean).join(" / ")}
                        placement="top"
                        disableHoverListener={!est.zonaDescripcion && !est.distritoDescripcion}>
                        <Typography variant="caption" fontFamily="monospace" color="text.secondary">
                          {[est.zonaCodigo, est.distritoCodigo, est.circuitoCodigo]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {est.mail ? (
                        <Typography
                          variant="body2"
                          sx={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {est.mail}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.disabled">—</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap", pr: 0.5 }}>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={(e) => openEdit(est, e)}>
                          <EditOutlinedIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() =>
                            setDeleteConfirm({ open: true, id: est.id, label: est.uniNombre })
                          }>
                          <DeleteOutlineIcon sx={{ fontSize: 15 }} />
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
              <TextField
                label="Tipo de entidad"
                value={form.tipoEntidad}
                onChange={(e) => setForm((f) => ({ ...f, tipoEntidad: e.target.value }))}
                size="small"
                inputProps={{ maxLength: 50 }}
                sx={{ flex: 1 }}
              />
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
                <MenuItem value="">
                  <em>Sin seleccionar</em>
                </MenuItem>
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

            <Divider textAlign="left">
              <Typography variant="caption" color="text.secondary">
                Información administrativa (opcional)
              </Typography>
            </Divider>

            <Stack direction="row" spacing={1.5}>
              <TextField
                label="Zona (código)"
                value={form.zonaCodigo}
                onChange={(e) => setForm((f) => ({ ...f, zonaCodigo: e.target.value }))}
                size="small"
                inputProps={{ maxLength: 10 }}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Zona (descripción)"
                value={form.zonaDescripcion}
                onChange={(e) => setForm((f) => ({ ...f, zonaDescripcion: e.target.value }))}
                size="small"
                inputProps={{ maxLength: 100 }}
                sx={{ flex: 2 }}
              />
            </Stack>

            <Stack direction="row" spacing={1.5}>
              <TextField
                label="Distrito (código)"
                value={form.distritoCodigo}
                onChange={(e) => setForm((f) => ({ ...f, distritoCodigo: e.target.value }))}
                size="small"
                inputProps={{ maxLength: 10 }}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Distrito (descripción)"
                value={form.distritoDescripcion}
                onChange={(e) => setForm((f) => ({ ...f, distritoDescripcion: e.target.value }))}
                size="small"
                inputProps={{ maxLength: 100 }}
                sx={{ flex: 2 }}
              />
            </Stack>

            <Stack direction="row" spacing={1.5}>
              <TextField
                label="Circuito"
                value={form.circuitoCodigo}
                onChange={(e) => setForm((f) => ({ ...f, circuitoCodigo: e.target.value }))}
                size="small"
                inputProps={{ maxLength: 10 }}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Correo electrónico"
                value={form.mail}
                onChange={(e) => setForm((f) => ({ ...f, mail: e.target.value }))}
                size="small"
                inputProps={{ maxLength: 100 }}
                type="email"
                sx={{ flex: 2 }}
              />
            </Stack>
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
            {isBusy ? (
              <CircularProgress size={18} />
            ) : dlg.mode === "create" ? (
              "Crear"
            ) : (
              "Guardar"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Confirmar eliminación ── */}
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
            <Button
              color="error"
              variant="contained"
              onClick={confirmDelete}
              disabled={deleting}>
              {deleting ? <CircularProgress size={18} /> : "Eliminar"}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  )
}
