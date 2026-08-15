import AddIcon from "@mui/icons-material/Add"
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos"
import CompareArrowsIcon from "@mui/icons-material/CompareArrows"
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline"
import EditOutlinedIcon from "@mui/icons-material/EditOutlined"
import SearchIcon from "@mui/icons-material/Search"
import {
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
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
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
import { useState } from "react"
import { PanelHeader, PanelTabla } from "../../components/PanelTabla"
import { LAYOUT } from "../../theme"
import { Title, useCreate, useDelete, useGetList, useNotify, useUpdate } from "react-admin"

// ─── Types ───────────────────────────────────────────────────────────────────

type DataType = "STRING" | "NUMBER" | "BOOLEAN"
type ComparisonType = "EQUALS" | "CONTAINS" | "STARTS_WITH" | "ENDS_WITH" | "REGEX"

interface HomologatorRecord {
  id: string
  entity: string
  field: string
  targetType: DataType
  description?: string
  isActive: boolean
}

interface HomologationRecord {
  id: string
  homologatorId: string
  sourceSystem: string
  sourceField: string
  sourceValue: string
  targetValue: string
  comparisonType: ComparisonType
  caseSensitive: boolean
  priority: number
  isActive: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DATA_TYPES: { id: DataType; label: string }[] = [
  { id: "STRING", label: "Texto (STRING)" },
  { id: "NUMBER", label: "Número (NUMBER)" },
  { id: "BOOLEAN", label: "Booleano (BOOLEAN)" },
]

const COMPARISON_TYPES: { id: ComparisonType; label: string }[] = [
  { id: "EQUALS", label: "Igual (EQUALS)" },
  { id: "CONTAINS", label: "Contiene (CONTAINS)" },
  { id: "STARTS_WITH", label: "Empieza con (STARTS_WITH)" },
  { id: "ENDS_WITH", label: "Termina con (ENDS_WITH)" },
  { id: "REGEX", label: "Expresión regular (REGEX)" },
]

const COMPARISON_COLOR: Record<ComparisonType, "default" | "primary" | "secondary" | "info" | "warning"> = {
  EQUALS: "default",
  CONTAINS: "info",
  STARTS_WITH: "primary",
  ENDS_WITH: "secondary",
  REGEX: "warning",
}

const DEFAULT_HOM_FORM = {
  entity: "",
  field: "",
  targetType: "STRING" as DataType,
  description: "",
  createdBy: "ADMIN",
}

const DEFAULT_HON_FORM = {
  sourceSystem: "",
  sourceField: "",
  sourceValue: "",
  targetValue: "",
  comparisonType: "EQUALS" as ComparisonType,
  caseSensitive: false,
  priority: 0,
  createdBy: "ADMIN",
}

// ─── Homologator Dialog ───────────────────────────────────────────────────────

interface HomologatorDialogProps {
  open: boolean
  mode: "create" | "edit"
  form: typeof DEFAULT_HOM_FORM
  onChange: (field: string, value: string) => void
  onClose: () => void
  onSubmit: () => void
  loading: boolean
}

const HomologatorDialog = ({ open, mode, form, onChange, onClose, onSubmit, loading }: HomologatorDialogProps) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>{mode === "create" ? "Nuevo Homologador" : "Editar Homologador"}</DialogTitle>
    <DialogContent>
      <Stack spacing={2} mt={1}>
        <TextField
          label="Entidad destino"
          placeholder="ej. Persona"
          value={form.entity}
          onChange={(e) => onChange("entity", e.target.value)}
          required
          fullWidth
          size="small"
        />
        <TextField
          label="Campo destino"
          placeholder="ej. sexo"
          value={form.field}
          onChange={(e) => onChange("field", e.target.value)}
          required
          fullWidth
          size="small"
        />
        <FormControl size="small" fullWidth required>
          <InputLabel>Tipo de dato destino</InputLabel>
          <Select
            label="Tipo de dato destino"
            value={form.targetType}
            onChange={(e) => onChange("targetType", e.target.value)}>
            {DATA_TYPES.map((d) => (
              <MenuItem key={d.id} value={d.id}>
                {d.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Descripción"
          value={form.description}
          onChange={(e) => onChange("description", e.target.value)}
          multiline
          rows={2}
          fullWidth
          size="small"
        />
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={loading}>
        Cancelar
      </Button>
      <Button variant="contained" onClick={onSubmit} disabled={loading || !form.entity || !form.field}>
        {loading ? <CircularProgress size={18} /> : mode === "create" ? "Crear" : "Guardar"}
      </Button>
    </DialogActions>
  </Dialog>
)

// ─── Homologation Dialog ──────────────────────────────────────────────────────

interface HomologationDialogProps {
  open: boolean
  mode: "create" | "edit"
  form: typeof DEFAULT_HON_FORM
  onChange: (field: string, value: unknown) => void
  onClose: () => void
  onSubmit: () => void
  loading: boolean
}

const HomologationDialog = ({ open, mode, form, onChange, onClose, onSubmit, loading }: HomologationDialogProps) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>{mode === "create" ? "Nueva Regla de Homologación" : "Editar Regla"}</DialogTitle>
    <DialogContent>
      <Stack spacing={2} mt={1}>
        <TextField
          label="Sistema origen"
          placeholder="ej. DHIS2, VIGIFLOW"
          value={form.sourceSystem}
          onChange={(e) => onChange("sourceSystem", e.target.value)}
          required
          fullWidth
          size="small"
        />
        <TextField
          label="Campo en sistema origen"
          placeholder="ej. sex, genero"
          value={form.sourceField}
          onChange={(e) => onChange("sourceField", e.target.value)}
          required
          fullWidth
          size="small"
        />
        <TextField
          label="Valor origen (a comparar)"
          placeholder='ej. "H", "hombre"'
          value={form.sourceValue}
          onChange={(e) => onChange("sourceValue", e.target.value)}
          required
          fullWidth
          size="small"
        />
        <TextField
          label="Valor destino"
          placeholder='ej. "1"'
          value={form.targetValue}
          onChange={(e) => onChange("targetValue", e.target.value)}
          required
          fullWidth
          size="small"
        />
        <FormControl size="small" fullWidth required>
          <InputLabel>Tipo de comparación</InputLabel>
          <Select
            label="Tipo de comparación"
            value={form.comparisonType}
            onChange={(e) => onChange("comparisonType", e.target.value)}>
            {COMPARISON_TYPES.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControlLabel
            control={
              <Switch
                checked={form.caseSensitive}
                onChange={(e) => onChange("caseSensitive", e.target.checked)}
                size="small"
              />
            }
            label="Distinguir mayúsculas/minúsculas"
          />
          <TextField
            label="Prioridad"
            type="number"
            value={form.priority}
            onChange={(e) => onChange("priority", parseInt(e.target.value) || 0)}
            size="small"
            sx={{ width: 120 }}
            inputProps={{ min: 0 }}
          />
        </Stack>
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={loading}>
        Cancelar
      </Button>
      <Button
        variant="contained"
        onClick={onSubmit}
        disabled={loading || !form.sourceSystem || !form.sourceField || !form.sourceValue || !form.targetValue}>
        {loading ? <CircularProgress size={18} /> : mode === "create" ? "Agregar" : "Guardar"}
      </Button>
    </DialogActions>
  </Dialog>
)

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

interface DeleteConfirmProps {
  open: boolean
  label: string
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}

const DeleteConfirmDialog = ({ open, label, onClose, onConfirm, loading }: DeleteConfirmProps) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle>Confirmar eliminación</DialogTitle>
    <DialogContent>
      <DialogContentText>
        ¿Eliminar <strong>{label}</strong>? Esta acción no se puede deshacer.
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={loading}>
        Cancelar
      </Button>
      <Button color="error" variant="contained" onClick={onConfirm} disabled={loading}>
        {loading ? <CircularProgress size={18} /> : "Eliminar"}
      </Button>
    </DialogActions>
  </Dialog>
)

// ─── Main Page ────────────────────────────────────────────────────────────────

export const HomologadoresPage = () => {
  const notify = useNotify()
  const theme = useTheme()
  const [create, { isPending: creating }] = useCreate()
  const [update, { isPending: updating }] = useUpdate()
  const [deleteOne, { isPending: deleting }] = useDelete()

  // ── Homologators state ──
  const [homPage, setHomPage] = useState(0)
  const [homPerPage] = useState(10)
  const [filterEntity, setFilterEntity] = useState("")
  const [filterField, setFilterField] = useState("")
  const [selectedHom, setSelectedHom] = useState<HomologatorRecord | null>(null)

  // ── Homologations state ──
  const [honPage, setHonPage] = useState(0)
  const [honPerPage] = useState(10)

  // ── Homologator dialog ──
  const [homDialog, setHomDialog] = useState<{ open: boolean; mode: "create" | "edit"; id?: string }>({
    open: false,
    mode: "create",
  })
  const [homForm, setHomForm] = useState({ ...DEFAULT_HOM_FORM })

  // ── Homologation dialog ──
  const [honDialog, setHonDialog] = useState<{ open: boolean; mode: "create" | "edit"; id?: string }>({
    open: false,
    mode: "create",
  })
  const [honForm, setHonForm] = useState({ ...DEFAULT_HON_FORM })

  // ── Delete confirm ──
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean
    type: "homologator" | "homologation"
    id: string
    label: string
  } | null>(null)

  // ── Data fetching ──
  const {
    data: homologators,
    total: homTotal,
    isLoading: homLoading,
    refetch: refetchHom,
  } = useGetList<HomologatorRecord>(
    "homologators",
    {
      pagination: { page: homPage + 1, perPage: homPerPage },
      sort: { field: "entity", order: "ASC" },
      filter: {
        ...(filterEntity ? { entity: filterEntity } : {}),
        ...(filterField ? { field: filterField } : {}),
      },
    },
  )

  const {
    data: homologations,
    total: honTotal,
    isLoading: honLoading,
    refetch: refetchHon,
  } = useGetList<HomologationRecord>(
    "homologations",
    {
      pagination: { page: honPage + 1, perPage: honPerPage },
      sort: { field: "priority", order: "ASC" },
      filter: { homologatorId: selectedHom?.id ?? "" },
    },
    { enabled: !!selectedHom?.id },
  )

  // ── Handlers: Homologator ──
  const openCreateHom = () => {
    setHomForm({ ...DEFAULT_HOM_FORM })
    setHomDialog({ open: true, mode: "create" })
  }

  const openEditHom = (record: HomologatorRecord) => {
    setHomForm({
      entity: record.entity,
      field: record.field,
      targetType: record.targetType,
      description: record.description ?? "",
      createdBy: "ADMIN",
    })
    setHomDialog({ open: true, mode: "edit", id: record.id })
  }

  const submitHom = async () => {
    try {
      if (homDialog.mode === "create") {
        await create("homologators", { data: { ...homForm } }, { returnPromise: true })
        notify("Homologador creado", { type: "success" })
      } else {
        await update("homologators", { id: homDialog.id!, data: { ...homForm } }, { returnPromise: true })
        notify("Homologador actualizado", { type: "success" })
        if (selectedHom?.id === homDialog.id) {
          setSelectedHom((prev) => prev ? { ...prev, ...homForm } : null)
        }
      }
      setHomDialog({ open: false, mode: "create" })
      refetchHom()
    } catch {
      notify("Error al guardar", { type: "error" })
    }
  }

  // ── Handlers: Homologation ──
  const openCreateHon = () => {
    setHonForm({ ...DEFAULT_HON_FORM })
    setHonDialog({ open: true, mode: "create" })
  }

  const openEditHon = (record: HomologationRecord) => {
    setHonForm({
      sourceSystem: record.sourceSystem,
      sourceField: record.sourceField,
      sourceValue: record.sourceValue,
      targetValue: record.targetValue,
      comparisonType: record.comparisonType,
      caseSensitive: record.caseSensitive,
      priority: record.priority,
      createdBy: "ADMIN",
    })
    setHonDialog({ open: true, mode: "edit", id: record.id })
  }

  const submitHon = async () => {
    try {
      if (honDialog.mode === "create") {
        await create(
          "homologations",
          { data: { ...honForm, homologatorId: selectedHom!.id } },
          { returnPromise: true },
        )
        notify("Regla creada", { type: "success" })
      } else {
        await update("homologations", { id: honDialog.id!, data: { ...honForm } }, { returnPromise: true })
        notify("Regla actualizada", { type: "success" })
      }
      setHonDialog({ open: false, mode: "create" })
      refetchHon()
    } catch {
      notify("Error al guardar", { type: "error" })
    }
  }

  // ── Handlers: Delete ──
  const confirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteOne(
        deleteConfirm.type === "homologator" ? "homologators" : "homologations",
        { id: deleteConfirm.id },
        { returnPromise: true },
      )
      notify("Registro eliminado", { type: "success" })
      if (deleteConfirm.type === "homologator" && selectedHom?.id === deleteConfirm.id) {
        setSelectedHom(null)
      }
      setDeleteConfirm(null)
      deleteConfirm.type === "homologator" ? refetchHom() : refetchHon()
    } catch {
      notify("Error al eliminar", { type: "error" })
    }
  }

  // ── Render ──
  return (
    <Box p={LAYOUT.paddingPagina}>
      <Title title="Homologación ESAVI" />

      {/* ── HOMOLOGATORS TABLE ── */}
      <PanelTabla sx={{ mb: 2 }}>
        <PanelHeader
          icono={<CompareArrowsIcon fontSize="small" />}
          titulo="Homologadores"
          subtitulo={
            homLoading ? "Cargando..." : `${homTotal ?? 0} homologador${homTotal === 1 ? "" : "es"}`
          }
          acciones={
            <>
              <TextField
                placeholder="Filtrar entidad..."
                value={filterEntity}
                onChange={(e) => { setFilterEntity(e.target.value); setHomPage(0) }}
                sx={{ width: 170 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                placeholder="Filtrar campo..."
                value={filterField}
                onChange={(e) => { setFilterField(e.target.value); setHomPage(0) }}
                sx={{ width: 170 }}
              />
              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateHom}>
                Nuevo
              </Button>
            </>
          }
        />

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {["", "Entidad", "Campo", "Tipo destino", "Descripción", "Estado", ""].map((head, idx) => (
                  <TableCell
                    key={head || idx}
                    align={idx === 6 ? "right" : "left"}
                    sx={{
                    }}>
                    {head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {homLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : !homologators?.length ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    Sin registros
                  </TableCell>
                </TableRow>
              ) : (
                homologators.map((row) => {
                  const isSelected = selectedHom?.id === row.id
                  return (
                    <TableRow
                      key={row.id}
                      hover
                      selected={isSelected}
                      sx={{ cursor: "pointer" }}
                      onClick={() => {
                        setSelectedHom(isSelected ? null : row)
                        setHonPage(0)
                      }}>
                      <TableCell sx={{ width: 32, pr: 0 }}>
                        <ArrowForwardIosIcon
                          sx={{
                            fontSize: 12,
                            color: isSelected ? "primary.main" : "transparent",
                            transition: "all 0.2s",
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {row.entity}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box
                          component="span"
                          sx={{
                            display: "inline-block",
                            fontFamily: "monospace",
                            fontSize: 12.5,
                            fontWeight: 600,
                            bgcolor: "action.hover",
                            px: 0.9,
                            py: 0.3,
                            borderRadius: 1,
                          }}>
                          {row.field}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.targetType}
                          size="small"
                          variant="outlined"
                          sx={{ height: 20, fontSize: 10.5, fontWeight: 600, color: "text.secondary" }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 260 }}>
                          {row.description ?? "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.isActive ? "Activo" : "Inactivo"}
                          size="small"
                          sx={
                            row.isActive
                              ? { height: 22, fontSize: 10.5, fontWeight: 600, bgcolor: alpha(theme.palette.success.main, 0.12), color: "success.dark" }
                              : { height: 22, fontSize: 10.5, fontWeight: 600, color: "text.disabled" }
                          }
                          variant={row.isActive ? "filled" : "outlined"}
                        />
                      </TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => openEditHom(row)}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              setDeleteConfirm({
                                open: true,
                                type: "homologator",
                                id: row.id,
                                label: `${row.entity}.${row.field}`,
                              })
                            }>
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
        <TablePagination
          component="div"
          count={homTotal ?? 0}
          page={homPage}
          rowsPerPage={homPerPage}
          rowsPerPageOptions={[10]}
          onPageChange={(_, p) => setHomPage(p)}
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        />
      </PanelTabla>

      {/* ── HOMOLOGATIONS TABLE ── */}
      <Collapse in={!!selectedHom} unmountOnExit>
        <PanelTabla>
          <PanelHeader
            color="secondary"
            icono={<CompareArrowsIcon fontSize="small" />}
            titulo="Reglas de Homologación"
            subtitulo={
              selectedHom && (
                <>
                  {selectedHom.entity}.<strong>{selectedHom.field}</strong> → tipo{" "}
                  <strong>{selectedHom.targetType}</strong> · {honTotal ?? 0} regla
                  {honTotal === 1 ? "" : "s"}
                </>
              )
            }
            acciones={
              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateHon}>
                Nuevo
              </Button>
            }
          />

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {["Sistema origen", "Campo origen", "Valor origen", "Valor destino", "Comparación", "Case", "Prioridad", "Estado", ""].map(
                    (head, idx) => (
                      <TableCell
                        key={head || idx}
                        align={idx === 8 ? "right" : "left"}
                        sx={{
                        }}>
                        {head}
                      </TableCell>
                    ),
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {honLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                ) : !homologations?.length ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4, color: "text.secondary" }}>
                      Sin reglas definidas. Haz clic en "Agregar Regla" para comenzar.
                    </TableCell>
                  </TableRow>
                ) : (
                  homologations.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Chip
                          label={row.sourceSystem}
                          size="small"
                          variant="outlined"
                          sx={{ height: 20, fontSize: 10.5, fontWeight: 600, color: "text.secondary" }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box
                          component="span"
                          sx={{ display: "inline-block", fontFamily: "monospace", fontSize: 12.5, bgcolor: "action.hover", px: 0.9, py: 0.3, borderRadius: 1 }}>
                          {row.sourceField}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace" color="text.secondary">
                          {row.sourceValue}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
                          {row.targetValue}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.comparisonType}
                          size="small"
                          color={COMPARISON_COLOR[row.comparisonType]}
                          sx={{ height: 20, fontSize: 10.5, fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.caseSensitive ? "Sí" : "No"}
                          size="small"
                          variant="outlined"
                          color={row.caseSensitive ? "warning" : "default"}
                          sx={{ height: 20, fontSize: 10.5, fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell align="center">{row.priority}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.isActive ? "Activo" : "Inactivo"}
                          size="small"
                          sx={
                            row.isActive
                              ? { height: 22, fontSize: 10.5, fontWeight: 600, bgcolor: alpha(theme.palette.success.main, 0.12), color: "success.dark" }
                              : { height: 22, fontSize: 10.5, fontWeight: 600, color: "text.disabled" }
                          }
                          variant={row.isActive ? "filled" : "outlined"}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => openEditHon(row)}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              setDeleteConfirm({
                                open: true,
                                type: "homologation",
                                id: row.id,
                                label: `${row.sourceSystem}:${row.sourceValue} → ${row.targetValue}`,
                              })
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
          <TablePagination
            component="div"
            count={honTotal ?? 0}
            page={honPage}
            rowsPerPage={honPerPage}
            rowsPerPageOptions={[10]}
            onPageChange={(_, p) => setHonPage(p)}
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
          />
        </PanelTabla>
      </Collapse>

      {/* ── DIALOGS ── */}
      <HomologatorDialog
        open={homDialog.open}
        mode={homDialog.mode}
        form={homForm}
        onChange={(f, v) => setHomForm((prev) => ({ ...prev, [f]: v }))}
        onClose={() => setHomDialog({ open: false, mode: "create" })}
        onSubmit={submitHom}
        loading={creating || updating}
      />

      <HomologationDialog
        open={honDialog.open}
        mode={honDialog.mode}
        form={honForm}
        onChange={(f, v) => setHonForm((prev) => ({ ...prev, [f]: v }))}
        onClose={() => setHonDialog({ open: false, mode: "create" })}
        onSubmit={submitHon}
        loading={creating || updating}
      />

      {deleteConfirm && (
        <DeleteConfirmDialog
          open={deleteConfirm.open}
          label={deleteConfirm.label}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={confirmDelete}
          loading={deleting}
        />
      )}
    </Box>
  )
}
