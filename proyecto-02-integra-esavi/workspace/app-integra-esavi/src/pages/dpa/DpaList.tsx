import AddIcon from "@mui/icons-material/Add"
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline"
import EditOutlinedIcon from "@mui/icons-material/EditOutlined"
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined"
import LocationCityIcon from "@mui/icons-material/LocationCity"
import SearchIcon from "@mui/icons-material/Search"
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
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
import { PanelHeader, PanelTabla } from "../../components/PanelTabla"
import { LAYOUT } from "../../theme"
import { Title, useCreate, useDelete, useGetList, useNotify, useUpdate } from "react-admin"

interface ProvinciaRecord {
  id: string
  codigo: string
  nombre: string
}

interface CantonRecord {
  id: string
  codigo: string
  nombre: string
  provincia?: { codigo: string; nombre: string }
}

interface ParroquiaRecord {
  id: string
  codigo: string
  nombre: string
  canton?: { codigo: string; nombre: string; provincia?: { codigo: string } }
}

const EMPTY_PROVINCIA = { codigo: "", nombre: "" }
const EMPTY_CANTON = { codigo: "", nombre: "", provinciaCodigo: "" }
const EMPTY_PARROQUIA = { codigo: "", nombre: "", cantonCodigo: "" }

export const DpaList = () => {
  const notify = useNotify()
  const [create, { isPending: creating }] = useCreate()
  const [update, { isPending: updating }] = useUpdate()
  const [deleteOne, { isPending: deleting }] = useDelete()

  // Selection state
  const [selectedProvincia, setSelectedProvincia] = useState<ProvinciaRecord | null>(null)
  const [selectedCanton, setSelectedCanton] = useState<CantonRecord | null>(null)

  // Search state
  const [searchProvincia, setSearchProvincia] = useState("")
  const [searchCanton, setSearchCanton] = useState("")
  const [searchParroquia, setSearchParroquia] = useState("")

  // Form state
  const [formProvincia, setFormProvincia] = useState({ ...EMPTY_PROVINCIA })
  const [formCanton, setFormCanton] = useState({ ...EMPTY_CANTON })
  const [formParroquia, setFormParroquia] = useState({ ...EMPTY_PARROQUIA })

  // Dialog state
  const [dlgProvincia, setDlgProvincia] = useState<{ open: boolean; mode: "create" | "edit"; id?: string }>({
    open: false, mode: "create",
  })
  const [dlgCanton, setDlgCanton] = useState<{ open: boolean; mode: "create" | "edit"; id?: string }>({
    open: false, mode: "create",
  })
  const [dlgParroquia, setDlgParroquia] = useState<{ open: boolean; mode: "create" | "edit"; id?: string }>({
    open: false, mode: "create",
  })
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean; id: string; label: string; resource: string
  } | null>(null)

  // Data
  const { data: provincias, isLoading: loadingProvincias, refetch: refetchProvincias } =
    useGetList<ProvinciaRecord>("provincias", {
      pagination: { page: 1, perPage: 9999 },
      sort: { field: "nombre", order: "ASC" },
      filter: {},
    })

  const { data: todosCantones, isLoading: loadingCantones, refetch: refetchCantones } =
    useGetList<CantonRecord>("cantones", {
      pagination: { page: 1, perPage: 9999 },
      sort: { field: "nombre", order: "ASC" },
      filter: {},
    })

  const { data: todasParroquias, isLoading: loadingParroquias, refetch: refetchParroquias } =
    useGetList<ParroquiaRecord>("parroquias", {
      pagination: { page: 1, perPage: 9999 },
      sort: { field: "nombre", order: "ASC" },
      filter: {},
    })

  // Derived data
  const filteredProvincias = useMemo(() => {
    const all = provincias ?? []
    if (!searchProvincia) return all
    const q = searchProvincia.toLowerCase()
    return all.filter((p) => p.codigo.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q))
  }, [provincias, searchProvincia])

  const cantonesOfProvincia = useMemo(
    () => (todosCantones ?? []).filter((c) => c.provincia?.codigo === selectedProvincia?.codigo),
    [todosCantones, selectedProvincia]
  )

  const filteredCantones = useMemo(() => {
    if (!searchCanton) return cantonesOfProvincia
    const q = searchCanton.toLowerCase()
    return cantonesOfProvincia.filter(
      (c) => c.codigo.toLowerCase().includes(q) || c.nombre.toLowerCase().includes(q)
    )
  }, [cantonesOfProvincia, searchCanton])

  const parroquiasOfCanton = useMemo(
    () => (todasParroquias ?? []).filter((p) => p.canton?.codigo === selectedCanton?.codigo),
    [todasParroquias, selectedCanton]
  )

  const filteredParroquias = useMemo(() => {
    if (!searchParroquia) return parroquiasOfCanton
    const q = searchParroquia.toLowerCase()
    return parroquiasOfCanton.filter(
      (p) => p.codigo.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q)
    )
  }, [parroquiasOfCanton, searchParroquia])

  // Cantones disponibles para el combo en el diálogo de parroquia
  const cantonesParaCombo = useMemo(
    () =>
      selectedProvincia
        ? (todosCantones ?? []).filter((c) => c.provincia?.codigo === selectedProvincia.codigo)
        : (todosCantones ?? []),
    [todosCantones, selectedProvincia]
  )

  const refetchAll = () => {
    refetchProvincias()
    refetchCantones()
    refetchParroquias()
  }

  // ── Provincia handlers ──────────────────────────────────────────────────────
  const openCreateProvincia = () => {
    setFormProvincia({ ...EMPTY_PROVINCIA })
    setDlgProvincia({ open: true, mode: "create" })
  }

  const openEditProvincia = (r: ProvinciaRecord, e: React.MouseEvent) => {
    e.stopPropagation()
    setFormProvincia({ codigo: r.codigo, nombre: r.nombre })
    setDlgProvincia({ open: true, mode: "edit", id: r.id })
  }

  const submitProvincia = async () => {
    try {
      if (dlgProvincia.mode === "create") {
        await create("provincias", { data: formProvincia }, { returnPromise: true })
        notify("Provincia creada correctamente", { type: "success" })
      } else {
        await update("provincias", { id: dlgProvincia.id!, data: { nombre: formProvincia.nombre } }, { returnPromise: true })
        notify("Provincia actualizada correctamente", { type: "success" })
      }
      setDlgProvincia({ open: false, mode: "create" })
      refetchProvincias()
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? "Error al guardar la provincia"
      notify(Array.isArray(msg) ? msg.join(", ") : msg, { type: "error" })
    }
  }

  // ── Canton handlers ─────────────────────────────────────────────────────────
  const openCreateCanton = () => {
    setFormCanton({ ...EMPTY_CANTON, provinciaCodigo: selectedProvincia?.codigo ?? "" })
    setDlgCanton({ open: true, mode: "create" })
  }

  const openEditCanton = (r: CantonRecord, e: React.MouseEvent) => {
    e.stopPropagation()
    setFormCanton({ codigo: r.codigo, nombre: r.nombre, provinciaCodigo: r.provincia?.codigo ?? "" })
    setDlgCanton({ open: true, mode: "edit", id: r.id })
  }

  const submitCanton = async () => {
    try {
      if (dlgCanton.mode === "create") {
        await create("cantones", { data: formCanton }, { returnPromise: true })
        notify("Cantón creado correctamente", { type: "success" })
      } else {
        await update(
          "cantones",
          { id: dlgCanton.id!, data: { nombre: formCanton.nombre, provinciaCodigo: formCanton.provinciaCodigo } },
          { returnPromise: true }
        )
        notify("Cantón actualizado correctamente", { type: "success" })
      }
      setDlgCanton({ open: false, mode: "create" })
      refetchCantones()
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? "Error al guardar el cantón"
      notify(Array.isArray(msg) ? msg.join(", ") : msg, { type: "error" })
    }
  }

  // ── Parroquia handlers ──────────────────────────────────────────────────────
  const openCreateParroquia = () => {
    setFormParroquia({ ...EMPTY_PARROQUIA, cantonCodigo: selectedCanton?.codigo ?? "" })
    setDlgParroquia({ open: true, mode: "create" })
  }

  const openEditParroquia = (r: ParroquiaRecord) => {
    setFormParroquia({ codigo: r.codigo, nombre: r.nombre, cantonCodigo: r.canton?.codigo ?? "" })
    setDlgParroquia({ open: true, mode: "edit", id: r.id })
  }

  const submitParroquia = async () => {
    try {
      if (dlgParroquia.mode === "create") {
        await create("parroquias", { data: formParroquia }, { returnPromise: true })
        notify("Parroquia creada correctamente", { type: "success" })
      } else {
        await update(
          "parroquias",
          { id: dlgParroquia.id!, data: { nombre: formParroquia.nombre, cantonCodigo: formParroquia.cantonCodigo } },
          { returnPromise: true }
        )
        notify("Parroquia actualizada correctamente", { type: "success" })
      }
      setDlgParroquia({ open: false, mode: "create" })
      refetchParroquias()
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? "Error al guardar la parroquia"
      notify(Array.isArray(msg) ? msg.join(", ") : msg, { type: "error" })
    }
  }

  // ── Delete handler ──────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteOne(deleteConfirm.resource, { id: deleteConfirm.id }, { returnPromise: true })
      if (deleteConfirm.resource === "provincias" && selectedProvincia?.id === deleteConfirm.id) {
        setSelectedProvincia(null)
        setSelectedCanton(null)
      }
      if (deleteConfirm.resource === "cantones" && selectedCanton?.id === deleteConfirm.id) {
        setSelectedCanton(null)
      }
      notify("Registro eliminado correctamente", { type: "success" })
      setDeleteConfirm(null)
      refetchAll()
    } catch {
      notify("Error al eliminar el registro", { type: "error" })
    }
  }

  const isBusy = creating || updating

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Box p={LAYOUT.paddingPagina}>
      <Title title="DPA" />
      <Box display="flex" gap={2} alignItems="flex-start" sx={{ overflowX: "auto" }}>

        {/* ── Panel Provincias ── */}
        <PanelTabla sx={{ flex: 1, minWidth: 220 }}>
          <PanelHeader
            apilado
            densidad="compacta"
            icono={<LocationCityIcon sx={{ fontSize: 16 }} />}
            titulo="Provincias"
            subtitulo={loadingProvincias ? "..." : `${provincias?.length ?? 0}`}
            acciones={
              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateProvincia}>
                Nueva
              </Button>
            }>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                placeholder="Buscar…"
                fullWidth
                value={searchProvincia}
                onChange={(e) => setSearchProvincia(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
              />
              <Button onClick={() => setSearchProvincia("")} disabled={!searchProvincia} sx={{ minWidth: "auto", px: 1 }}>
                Limpiar
              </Button>
            </Stack>
          </PanelHeader>
          <TableContainer sx={{ maxHeight: LAYOUT.alturaTabla, minHeight: LAYOUT.alturaTablaMinima }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {["Cód", "Nombre", ""].map((head, idx) => (
                    <TableCell
                      key={head || idx}
                      align={idx === 2 ? "right" : "left"}>
                      {head}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingProvincias ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={22} />
                    </TableCell>
                  </TableRow>
                ) : !(provincias?.length) ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                      <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                        <InboxOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                        <Typography variant="body2" color="text.secondary">
                          Sin provincias registradas.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : !filteredProvincias.length ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                      <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                        <InboxOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                        <Typography variant="body2" color="text.secondary">
                          Sin resultados para "{searchProvincia}"
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProvincias.map((p) => {
                    const isSelected = selectedProvincia?.id === p.id
                    return (
                      <TableRow
                        key={p.id}
                        hover
                        selected={isSelected}
                        sx={{ cursor: "pointer" }}
                        onClick={() => {
                          setSelectedProvincia(p)
                          setSelectedCanton(null)
                          setSearchCanton("")
                          setSearchParroquia("")
                        }}>
                        <TableCell>
                          <Box
                            component="span"
                            sx={{ display: "inline-block", fontFamily: "monospace", fontSize: 12.5, fontWeight: 600, bgcolor: "action.hover", px: 0.9, py: 0.3, borderRadius: 1 }}>
                            {p.codigo}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={isSelected ? 700 : 500}>
                            {p.nombre}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ whiteSpace: "nowrap", pr: 0.5 }}>
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={(e) => openEditProvincia(p, e)}>
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteConfirm({ open: true, id: p.id, label: p.nombre, resource: "provincias" })
                              }}>
                              <DeleteOutlineIcon fontSize="small" />
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
        </PanelTabla>

        {/* ── Panel Cantones ── */}
        <PanelTabla sx={{ flex: 1.2, minWidth: 240 }}>
          <PanelHeader
            apilado
            densidad="compacta"
            color="secondary"
            icono={<LocationCityIcon sx={{ fontSize: 16 }} />}
            titulo="Cantones"
            adorno={
              selectedProvincia && (
                <Chip label={selectedProvincia.nombre} size="small" color="secondary" variant="outlined" sx={{ maxWidth: 100, overflow: "hidden", height: 18, fontSize: 10 }} />
              )
            }
            subtitulo={!selectedProvincia ? "Selecciona provincia" : `${cantonesOfProvincia.length}`}
            acciones={
              <Tooltip title={!selectedProvincia ? "Selecciona una provincia primero" : ""} placement="left">
                <span>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    disabled={!selectedProvincia}
                    onClick={openCreateCanton}>
                    Nuevo
                  </Button>
                </span>
              </Tooltip>
            }>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                placeholder="Buscar…"
                fullWidth
                value={searchCanton}
                onChange={(e) => setSearchCanton(e.target.value)}
                disabled={!selectedProvincia}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
              />
              <Button onClick={() => setSearchCanton("")} disabled={!searchCanton} sx={{ minWidth: "auto", px: 1 }}>
                Limpiar
              </Button>
            </Stack>
          </PanelHeader>
          <TableContainer sx={{ maxHeight: LAYOUT.alturaTabla, minHeight: LAYOUT.alturaTablaMinima }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {["Cód", "Nombre", ""].map((head, idx) => (
                    <TableCell
                      key={head || idx}
                      align={idx === 2 ? "right" : "left"}>
                      {head}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {!selectedProvincia ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                      <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                        <InboxOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                        <Typography variant="body2" color="text.secondary">
                          Selecciona una provincia para ver sus cantones
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : loadingCantones ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={22} />
                    </TableCell>
                  </TableRow>
                ) : !cantonesOfProvincia.length ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                      <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                        <InboxOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                        <Typography variant="body2" color="text.secondary">
                          Sin cantones en {selectedProvincia.nombre}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : !filteredCantones.length ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                      <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                        <InboxOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                        <Typography variant="body2" color="text.secondary">
                          Sin resultados para "{searchCanton}"
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCantones.map((c) => {
                    const isSelected = selectedCanton?.id === c.id
                    return (
                      <TableRow
                        key={c.id}
                        hover
                        selected={isSelected}
                        sx={{ cursor: "pointer" }}
                        onClick={() => {
                          setSelectedCanton(c)
                          setSearchParroquia("")
                        }}>
                        <TableCell>
                          <Box
                            component="span"
                            sx={{ display: "inline-block", fontFamily: "monospace", fontSize: 12.5, fontWeight: 600, bgcolor: "action.hover", px: 0.9, py: 0.3, borderRadius: 1 }}>
                            {c.codigo}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={isSelected ? 700 : 500}>
                            {c.nombre}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ whiteSpace: "nowrap", pr: 0.5 }}>
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={(e) => openEditCanton(c, e)}>
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteConfirm({ open: true, id: c.id, label: c.nombre, resource: "cantones" })
                              }}>
                              <DeleteOutlineIcon fontSize="small" />
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
        </PanelTabla>

        {/* ── Panel Parroquias ── */}
        <PanelTabla sx={{ flex: 1.2, minWidth: 240 }}>
          <PanelHeader
            apilado
            densidad="compacta"
            color="success"
            icono={<LocationCityIcon sx={{ fontSize: 16 }} />}
            titulo="Parroquias"
            adorno={
              selectedCanton && (
                <Chip label={selectedCanton.nombre} size="small" color="success" variant="outlined" sx={{ maxWidth: 100, overflow: "hidden", height: 18, fontSize: 10 }} />
              )
            }
            subtitulo={!selectedCanton ? "Selecciona cantón" : `${parroquiasOfCanton.length}`}
            acciones={
              <Tooltip title={!selectedCanton ? "Selecciona un cantón primero" : ""} placement="left">
                <span>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    disabled={!selectedCanton}
                    onClick={openCreateParroquia}>
                    Nueva
                  </Button>
                </span>
              </Tooltip>
            }>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                placeholder="Buscar…"
                fullWidth
                value={searchParroquia}
                onChange={(e) => setSearchParroquia(e.target.value)}
                disabled={!selectedCanton}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
              />
              <Button onClick={() => setSearchParroquia("")} disabled={!searchParroquia} sx={{ minWidth: "auto", px: 1 }}>
                Limpiar
              </Button>
            </Stack>
          </PanelHeader>
          <TableContainer sx={{ maxHeight: LAYOUT.alturaTabla, minHeight: LAYOUT.alturaTablaMinima }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {["Cód", "Nombre", ""].map((head, idx) => (
                    <TableCell
                      key={head || idx}
                      align={idx === 2 ? "right" : "left"}>
                      {head}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {!selectedCanton ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                      <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                        <InboxOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                        <Typography variant="body2" color="text.secondary">
                          Selecciona un cantón para ver sus parroquias
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : loadingParroquias ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={22} />
                    </TableCell>
                  </TableRow>
                ) : !parroquiasOfCanton.length ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                      <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                        <InboxOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                        <Typography variant="body2" color="text.secondary">
                          Sin parroquias en {selectedCanton.nombre}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : !filteredParroquias.length ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                      <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                        <InboxOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                        <Typography variant="body2" color="text.secondary">
                          Sin resultados para "{searchParroquia}"
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredParroquias.map((p) => (
                    <TableRow key={p.id} hover>
                      <TableCell>
                        <Box
                          component="span"
                          sx={{ display: "inline-block", fontFamily: "monospace", fontSize: 12.5, fontWeight: 600, bgcolor: "action.hover", px: 0.9, py: 0.3, borderRadius: 1 }}>
                          {p.codigo}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{p.nombre}</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap", pr: 0.5 }}>
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => openEditParroquia(p)}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              setDeleteConfirm({ open: true, id: p.id, label: p.nombre, resource: "parroquias" })
                            }>
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
        </PanelTabla>
      </Box>

      {/* ── Diálogo Provincia ── */}
      <Dialog open={dlgProvincia.open} onClose={() => setDlgProvincia({ open: false, mode: "create" })} maxWidth="xs" fullWidth>
        <DialogTitle>
          {dlgProvincia.mode === "create" ? "Nueva Provincia" : "Editar Provincia"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Código"
              value={formProvincia.codigo}
              onChange={(e) => setFormProvincia((p) => ({ ...p, codigo: e.target.value.toUpperCase() }))}
              required
              fullWidth
              size="small"
              inputProps={{ maxLength: 2 }}
              disabled={dlgProvincia.mode === "edit"}
              helperText={dlgProvincia.mode === "edit" ? "El código no puede modificarse" : "2 dígitos INEC (ej: 17)"}
            />
            <TextField
              label="Nombre"
              value={formProvincia.nombre}
              onChange={(e) => setFormProvincia((p) => ({ ...p, nombre: e.target.value }))}
              required
              fullWidth
              size="small"
              inputProps={{ maxLength: 100 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlgProvincia({ open: false, mode: "create" })} disabled={isBusy}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={submitProvincia}
            disabled={isBusy || !formProvincia.codigo || !formProvincia.nombre}>
            {isBusy ? <CircularProgress size={18} /> : dlgProvincia.mode === "create" ? "Crear" : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Diálogo Cantón ── */}
      <Dialog open={dlgCanton.open} onClose={() => setDlgCanton({ open: false, mode: "create" })} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dlgCanton.mode === "create" ? "Nuevo Cantón" : "Editar Cantón"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Código"
              value={formCanton.codigo}
              onChange={(e) => setFormCanton((p) => ({ ...p, codigo: e.target.value }))}
              required
              fullWidth
              size="small"
              inputProps={{ maxLength: 4 }}
              disabled={dlgCanton.mode === "edit"}
              helperText={dlgCanton.mode === "edit" ? "El código no puede modificarse" : "4 dígitos INEC (ej: 1701)"}
            />
            <TextField
              label="Nombre"
              value={formCanton.nombre}
              onChange={(e) => setFormCanton((p) => ({ ...p, nombre: e.target.value }))}
              required
              fullWidth
              size="small"
              inputProps={{ maxLength: 100 }}
            />
            <FormControl fullWidth size="small" required>
              <InputLabel>Provincia</InputLabel>
              <Select
                value={formCanton.provinciaCodigo}
                label="Provincia"
                onChange={(e) => setFormCanton((p) => ({ ...p, provinciaCodigo: e.target.value }))}>
                {(provincias ?? []).map((prov) => (
                  <MenuItem key={prov.id} value={prov.codigo}>
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
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlgCanton({ open: false, mode: "create" })} disabled={isBusy}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={submitCanton}
            disabled={isBusy || !formCanton.codigo || !formCanton.nombre || !formCanton.provinciaCodigo}>
            {isBusy ? <CircularProgress size={18} /> : dlgCanton.mode === "create" ? "Crear" : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Diálogo Parroquia ── */}
      <Dialog open={dlgParroquia.open} onClose={() => setDlgParroquia({ open: false, mode: "create" })} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dlgParroquia.mode === "create" ? "Nueva Parroquia" : "Editar Parroquia"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Código"
              value={formParroquia.codigo}
              onChange={(e) => setFormParroquia((p) => ({ ...p, codigo: e.target.value }))}
              required
              fullWidth
              size="small"
              inputProps={{ maxLength: 6 }}
              disabled={dlgParroquia.mode === "edit"}
              helperText={dlgParroquia.mode === "edit" ? "El código no puede modificarse" : "6 dígitos INEC (ej: 170101)"}
            />
            <TextField
              label="Nombre"
              value={formParroquia.nombre}
              onChange={(e) => setFormParroquia((p) => ({ ...p, nombre: e.target.value }))}
              required
              fullWidth
              size="small"
              inputProps={{ maxLength: 100 }}
            />
            <FormControl fullWidth size="small" required>
              <InputLabel>Cantón</InputLabel>
              <Select
                value={formParroquia.cantonCodigo}
                label="Cantón"
                onChange={(e) => setFormParroquia((p) => ({ ...p, cantonCodigo: e.target.value }))}
                MenuProps={{ PaperProps: { sx: { maxHeight: 280 } } }}>
                {cantonesParaCombo.map((c) => (
                  <MenuItem key={c.id} value={c.codigo}>
                    <Typography variant="body2">
                      <Box component="span" fontFamily="monospace" fontWeight={600} mr={1}>
                        {c.codigo}
                      </Box>
                      {c.nombre}
                    </Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlgParroquia({ open: false, mode: "create" })} disabled={isBusy}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={submitParroquia}
            disabled={isBusy || !formParroquia.codigo || !formParroquia.nombre || !formParroquia.cantonCodigo}>
            {isBusy ? <CircularProgress size={18} /> : dlgParroquia.mode === "create" ? "Crear" : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Diálogo Confirmar Eliminación ── */}
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
