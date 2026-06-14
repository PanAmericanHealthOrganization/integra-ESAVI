import ExpandLessIcon from "@mui/icons-material/ExpandLess"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import LocalHospitalIcon from "@mui/icons-material/LocalHospital"
import SearchIcon from "@mui/icons-material/Search"
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Pagination,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material"
import { useEffect, useRef, useState } from "react"
import { Title } from "react-admin"
import intESAVIClient from "../../dataProviders/axios.client"

interface SOC {
  id: number
  code: string
  name: string
  abbrev: string
}

interface PT {
  id: number
  code: string
  name: string
  socCode: string
}

interface LLT {
  id: number
  code: string
  name: string
  ptCode: string
  currency: string
}

export const MeddraPage = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [socPage, setSocPage] = useState(1)
  const [socs, setSocs] = useState<SOC[]>([])
  const [socTotal, setSocTotal] = useState(0)
  const [socsLoading, setSocsLoading] = useState(false)

  const [expandedSoc, setExpandedSoc] = useState<string | null>(null)
  const [expandedPt, setExpandedPt] = useState<string | null>(null)

  const [ptsBySoc, setPtsBySoc] = useState<Record<string, PT[]>>({})
  const [ptsLoading, setPtsLoading] = useState<Record<string, boolean>>({})

  const [lltsByPt, setLltsByPt] = useState<Record<string, LLT[]>>({})
  const [lltsLoading, setLltsLoading] = useState<Record<string, boolean>>({})

  const PAGE_SIZE = 20
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setSocPage(1)
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchTerm])

  useEffect(() => {
    setSocsLoading(true)
    intESAVIClient
      .get("/meddra/soc/list", {
        params: { page: socPage - 1, size: PAGE_SIZE, ...(debouncedSearch ? { term: debouncedSearch } : {}) },
      })
      .then((res) => {
        setSocs(res.data.data ?? [])
        setSocTotal(res.data.total ?? 0)
      })
      .catch(() => setSocs([]))
      .finally(() => setSocsLoading(false))
  }, [socPage, debouncedSearch])

  const handleSocToggle = async (soc: SOC) => {
    if (expandedSoc === soc.code) {
      setExpandedSoc(null)
      return
    }
    setExpandedSoc(soc.code)
    setExpandedPt(null)
    if (!ptsBySoc[soc.code]) {
      setPtsLoading((prev) => ({ ...prev, [soc.code]: true }))
      try {
        const res = await intESAVIClient.get("/meddra/pt/list", {
          params: { socCode: soc.code, page: 0, size: 200 },
        })
        setPtsBySoc((prev) => ({ ...prev, [soc.code]: res.data.data ?? [] }))
      } finally {
        setPtsLoading((prev) => ({ ...prev, [soc.code]: false }))
      }
    }
  }

  const handlePtToggle = async (pt: PT) => {
    if (expandedPt === pt.code) {
      setExpandedPt(null)
      return
    }
    setExpandedPt(pt.code)
    if (!lltsByPt[pt.code]) {
      setLltsLoading((prev) => ({ ...prev, [pt.code]: true }))
      try {
        const res = await intESAVIClient.get("/meddra/llt/list", {
          params: { ptCode: pt.code, page: 0, size: 500 },
        })
        setLltsByPt((prev) => ({ ...prev, [pt.code]: res.data.data ?? [] }))
      } finally {
        setLltsLoading((prev) => ({ ...prev, [pt.code]: false }))
      }
    }
  }

  const totalPages = Math.ceil(socTotal / PAGE_SIZE)

  return (
    <Box p={2}>
      <Title title="MedDRA — Estándar Internacional" />

      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          <LocalHospitalIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            MedDRA — Árbol de Terminología Médica
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Sistema de Organización de Clasificación (SOC) → Término Preferido (PT) → Término de Nivel Inferior (LLT)
        </Typography>

        <TextField
          fullWidth
          size="small"
          placeholder="Buscar por nombre de SOC…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {socsLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : socs.length === 0 ? (
          <Typography color="text.secondary" align="center" py={4}>
            No se encontraron resultados.
          </Typography>
        ) : (
          <>
            {socs.map((soc) => (
              <Accordion
                key={soc.id}
                expanded={expandedSoc === soc.code}
                onChange={() => handleSocToggle(soc)}
                elevation={1}
                sx={{ mb: 0.5 }}>
                <AccordionSummary>
                  <Stack direction="row" alignItems="center" spacing={1} width="100%">
                    <IconButton size="small" sx={{ p: 0 }}>
                      {expandedSoc === soc.code ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                    <Tooltip title={soc.abbrev ?? ""}>
                      <Chip label="SOC" size="small" color="primary" variant="outlined" sx={{ minWidth: 44 }} />
                    </Tooltip>
                    <Chip label={soc.code} size="small" variant="outlined" sx={{ fontFamily: "monospace" }} />
                    <Typography variant="body2" fontWeight={500} flex={1}>
                      {soc.name}
                    </Typography>
                    {soc.abbrev && (
                      <Typography variant="caption" color="text.secondary">
                        {soc.abbrev}
                      </Typography>
                    )}
                  </Stack>
                </AccordionSummary>

                <AccordionDetails sx={{ pt: 0, pl: 4 }}>
                  {ptsLoading[soc.code] ? (
                    <Box display="flex" justifyContent="center" py={2}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : (ptsBySoc[soc.code] ?? []).length === 0 ? (
                    <Typography variant="body2" color="text.secondary" py={1}>
                      Sin Términos Preferidos (PT).
                    </Typography>
                  ) : (
                    (ptsBySoc[soc.code] ?? []).map((pt) => (
                      <Accordion
                        key={pt.id}
                        expanded={expandedPt === pt.code}
                        onChange={() => handlePtToggle(pt)}
                        elevation={0}
                        sx={{ border: "1px solid", borderColor: "divider", mb: 0.5 }}>
                        <AccordionSummary>
                          <Stack direction="row" alignItems="center" spacing={1} width="100%">
                            <IconButton size="small" sx={{ p: 0 }}>
                              {expandedPt === pt.code ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                            </IconButton>
                            <Chip label="PT" size="small" color="secondary" variant="outlined" sx={{ minWidth: 36 }} />
                            <Chip label={pt.code} size="small" variant="outlined" sx={{ fontFamily: "monospace" }} />
                            <Typography variant="body2" flex={1}>
                              {pt.name}
                            </Typography>
                          </Stack>
                        </AccordionSummary>

                        <AccordionDetails sx={{ pt: 0, pl: 3 }}>
                          {lltsLoading[pt.code] ? (
                            <Box display="flex" justifyContent="center" py={1}>
                              <CircularProgress size={20} />
                            </Box>
                          ) : (lltsByPt[pt.code] ?? []).length === 0 ? (
                            <Typography variant="caption" color="text.secondary">
                              Sin Términos LLT.
                            </Typography>
                          ) : (
                            <>
                              <Typography variant="caption" color="text.secondary" ml={1}>
                                {(lltsByPt[pt.code] ?? []).length} términos LLT
                              </Typography>
                              <Divider sx={{ my: 0.5 }} />
                              <List dense disablePadding>
                                {(lltsByPt[pt.code] ?? []).map((llt) => (
                                  <ListItem key={llt.id} disableGutters sx={{ py: 0.25 }}>
                                    <Stack direction="row" spacing={1} alignItems="center" width="100%">
                                      <Chip
                                        label="LLT"
                                        size="small"
                                        variant="outlined"
                                        sx={{ minWidth: 36, fontSize: "0.65rem", height: 18 }}
                                      />
                                      <Typography variant="caption" fontFamily="monospace" color="text.secondary" minWidth={80}>
                                        {llt.code}
                                      </Typography>
                                      <ListItemText
                                        primary={llt.name}
                                        primaryTypographyProps={{ variant: "body2" }}
                                      />
                                      {llt.currency && (
                                        <Chip
                                          label={llt.currency === "Y" ? "Vigente" : "No vigente"}
                                          size="small"
                                          color={llt.currency === "Y" ? "success" : "default"}
                                          sx={{ height: 18, fontSize: "0.65rem" }}
                                        />
                                      )}
                                    </Stack>
                                  </ListItem>
                                ))}
                              </List>
                            </>
                          )}
                        </AccordionDetails>
                      </Accordion>
                    ))
                  )}
                </AccordionDetails>
              </Accordion>
            ))}

            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={2}>
                <Pagination count={totalPages} page={socPage} onChange={(_, p) => setSocPage(p)} color="primary" />
              </Box>
            )}
            <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={1}>
              {socTotal} SOC{socTotal !== 1 ? "s" : ""} encontrado{socTotal !== 1 ? "s" : ""}
            </Typography>
          </>
        )}
      </Paper>
    </Box>
  )
}
