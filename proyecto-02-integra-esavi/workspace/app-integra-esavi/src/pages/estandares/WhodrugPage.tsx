import FilterListIcon from "@mui/icons-material/FilterList"
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined"
import MedicationIcon from "@mui/icons-material/Medication"
import SearchIcon from "@mui/icons-material/Search"
import {
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  FormControl,
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
import { useEffect, useRef, useState } from "react"
import { Title } from "react-admin"
import { SincronizarWhodrugButton } from "../../components/SyncActions"
import intESAVIClient from "../../dataProviders/axios.client"

interface Drug {
  id: string
  drugName: string
  drugCode: string
  medicinalProductID: number
  isGeneric: boolean
  isPreferred: boolean
}

const COUNTRIES = [
  { code: "EC", label: "Ecuador (EC)" },
  { code: "US", label: "Estados Unidos (US)" },
  { code: "ES", label: "España (ES)" },
  { code: "CO", label: "Colombia (CO)" },
  { code: "PE", label: "Perú (PE)" },
  { code: "MX", label: "México (MX)" },
  { code: "AR", label: "Argentina (AR)" },
  { code: "BR", label: "Brasil (BR)" },
]

export const WhodrugPage = () => {
  const [drugs, setDrugs] = useState<Drug[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [rowsPerPage] = useState(10)
  const [loading, setLoading] = useState(false)
  const [country, setCountry] = useState("EC")
  const [searchName, setSearchName] = useState("")
  const [showFilter, setShowFilter] = useState(false)
  const [debouncedName, setDebouncedName] = useState("")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedName(searchName)
      setPage(0)
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchName])

  useEffect(() => {
    setLoading(true)
    intESAVIClient
      .post("/whodrug", {}, {
        params: {
          page,
          size: rowsPerPage,
          country,
          ...(debouncedName ? { drugName: debouncedName } : {}),
        },
      })
      .then((res) => {
        setDrugs(res.data.data ?? res.data ?? [])
        setTotal(res.data.total ?? res.data.length ?? 0)
      })
      .catch(() => setDrugs([]))
      .finally(() => setLoading(false))
  }, [page, rowsPerPage, country, debouncedName])

  return (
    <Box p={2}>
      <Title title="WHODrug — Diccionario de Medicamentos" />

      <Paper elevation={2}>
        {/* ── Cabecera ── */}
        <Box px={2} py={1.5} display="flex" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <MedicationIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              WHODrug — Medicamentos
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <SincronizarWhodrugButton />
            <Tooltip title={showFilter ? "Ocultar filtros" : "Mostrar filtros"}>
              <IconButton
                size="small"
                onClick={() => setShowFilter((v) => !v)}
                color={showFilter ? "primary" : "default"}>
                <Badge variant="dot" color="primary" invisible={!searchName}>
                  <FilterListIcon />
                </Badge>
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        <Box px={2} pb={1.5}>
          <Typography variant="body2" color="text.secondary">
            Diccionario internacional de medicamentos de la OMS (WHO Drug Dictionary)
          </Typography>
        </Box>

        {/* ── Filtros ── */}
        <Collapse in={showFilter}>
          <Box px={2} pb={1.5} display="flex" gap={1.5} alignItems="center" flexWrap="wrap">
            <TextField
              placeholder="Buscar por nombre de medicamento…"
              size="small"
              autoFocus={showFilter}
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              sx={{ width: 280 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ width: 280 }}>
              <InputLabel>País</InputLabel>
              <Select
                label="País"
                value={country}
                onChange={(e) => { setCountry(e.target.value); setPage(0) }}>
                {COUNTRIES.map((c) => (
                  <MenuItem key={c.code} value={c.code}>
                    {c.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button size="small" sx={{ ml: "auto" }} onClick={() => { setSearchName(""); setPage(0) }}>
              Limpiar
            </Button>
          </Box>
        </Collapse>

        <Divider />

        {/* ── Tabla ── */}
        <TableContainer sx={{ maxHeight: 480 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Nombre del Medicamento</TableCell>
                <TableCell sx={{ minWidth: 100 }}>Código</TableCell>
                <TableCell sx={{ minWidth: 140 }}>ID Producto Medicinal</TableCell>
                <TableCell align="center" sx={{ minWidth: 100 }}>Genérico</TableCell>
                <TableCell align="center" sx={{ minWidth: 100 }}>Preferido</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : drugs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                      <InboxOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
                      <Typography variant="body2" color="text.secondary">
                        No se encontraron medicamentos. Seleccione un país e intente nuevamente.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                drugs.map((drug) => (
                  <TableRow key={drug.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {drug.drugName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" fontWeight={500}>
                        {drug.drugCode}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {drug.medicinalProductID}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={drug.isGeneric ? "Sí" : "No"}
                        size="small"
                        color={drug.isGeneric ? "info" : "default"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={drug.isPreferred ? "Sí" : "No"}
                        size="small"
                        color={drug.isPreferred ? "success" : "default"}
                        variant="outlined"
                      />
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
          count={total}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10]}
          onPageChange={(_, p) => setPage(p)}
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        />
      </Paper>
    </Box>
  )
}
