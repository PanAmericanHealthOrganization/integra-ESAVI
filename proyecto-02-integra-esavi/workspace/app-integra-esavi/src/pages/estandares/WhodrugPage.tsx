import MedicationIcon from "@mui/icons-material/Medication"
import SearchIcon from "@mui/icons-material/Search"
import {
  Box,
  Chip,
  CircularProgress,
  FormControl,
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
  Typography,
} from "@mui/material"
import { useEffect, useRef, useState } from "react"
import { Title } from "react-admin"
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
    <Box p={2}>
      <Title title="WHODrug — Diccionario de Medicamentos" />

      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          <MedicationIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            WHODrug — Medicamentos
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Diccionario internacional de medicamentos de la OMS (WHO Drug Dictionary)
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
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

          <TextField
            size="small"
            placeholder="Buscar por nombre de medicamento…"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Stack>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nombre del Medicamento</TableCell>
                <TableCell>Código</TableCell>
                <TableCell>ID Producto Medicinal</TableCell>
                <TableCell align="center">Genérico</TableCell>
                <TableCell align="center">Preferido</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : drugs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    No se encontraron medicamentos. Seleccione un país e intente nuevamente.
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
                      <Typography variant="body2" fontFamily="monospace" color="text.secondary">
                        {drug.drugCode}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{drug.medicinalProductID}</Typography>
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
