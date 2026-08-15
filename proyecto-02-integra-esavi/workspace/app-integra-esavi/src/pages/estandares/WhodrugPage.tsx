import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined"
import MedicationIcon from "@mui/icons-material/Medication"
import SearchIcon from "@mui/icons-material/Search"
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material"
import { useEffect, useRef, useState } from "react"
import { Title } from "react-admin"
import { SincronizarWhodrugButton } from "../../components/SyncActions"
import { PanelHeader, PanelTabla } from "../../components/PanelTabla"
import { LAYOUT } from "../../theme"
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
    <Box p={LAYOUT.paddingPagina}>
      <Title title="WHODrug — Diccionario de Medicamentos" />

      <PanelTabla>
        <PanelHeader
          icono={<MedicationIcon fontSize="small" />}
          titulo="WHODrug — Medicamentos"
          subtitulo={
            loading
              ? "Cargando..."
              : `${total} medicamento${total === 1 ? "" : "s"} · Diccionario de la OMS`
          }
          acciones={<SincronizarWhodrugButton />}>
          {/* Los filtros van visibles en la banda, como en el resto de pantallas. Antes
              vivían tras un <Collapse> que se abría con un icono de embudo: era la única
              pantalla —junto con MedDRA— donde había que descubrir dónde estaba el buscador. */}
          <Box display="flex" gap={1.5} alignItems="center" flexWrap="wrap">
            <TextField
              placeholder="Buscar por nombre de medicamento…"
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
            <FormControl sx={{ width: 200 }}>
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
          </Box>
        </PanelHeader>


        {/* ── Tabla ── */}
        <TableContainer sx={{ maxHeight: LAYOUT.alturaTabla, minHeight: LAYOUT.alturaTablaMinima }}>
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
      </PanelTabla>
    </Box>
  )
}
