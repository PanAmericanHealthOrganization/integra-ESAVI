import LocalHospitalIcon from "@mui/icons-material/LocalHospital"
import SearchIcon from "@mui/icons-material/Search"
import {
  Box,
  Chip,
  CircularProgress,
  InputAdornment,
  Pagination,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material"
import { TreeItem } from "@mui/x-tree-view/TreeItem"
import { TreeView } from "@mui/x-tree-view/TreeView"
import { useEffect, useRef, useState } from "react"
import { Title } from "react-admin"
import intESAVIClient from "../../dataProviders/axios.client"

// ─── Types ────────────────────────────────────────────────────────────────────

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

type ChildrenState<T> = "unloaded" | "loading" | T[]

// ─── Label sub-components ─────────────────────────────────────────────────────

const SocLabel = ({ soc }: { soc: SOC }) => (
  <Stack direction="row" alignItems="center" spacing={1} py={0.25}>
    <Chip label="SOC" size="small" color="primary" sx={{ height: 18, fontSize: "0.65rem", minWidth: 38 }} />
    <Typography variant="caption" fontFamily="monospace" color="text.secondary" sx={{ minWidth: 72 }}>
      {soc.code}
    </Typography>
    <Typography variant="body2" fontWeight={600}>
      {soc.name}
    </Typography>
    {soc.abbrev && (
      <Typography variant="caption" color="text.secondary">
        ({soc.abbrev})
      </Typography>
    )}
  </Stack>
)

const PtLabel = ({ pt }: { pt: PT }) => (
  <Stack direction="row" alignItems="center" spacing={1} py={0.25}>
    <Chip label="PT" size="small" color="secondary" sx={{ height: 18, fontSize: "0.65rem", minWidth: 38 }} />
    <Typography variant="caption" fontFamily="monospace" color="text.secondary" sx={{ minWidth: 72 }}>
      {pt.code}
    </Typography>
    <Typography variant="body2">{pt.name}</Typography>
  </Stack>
)

const LltLabel = ({ llt }: { llt: LLT }) => (
  <Stack direction="row" alignItems="center" spacing={1} py={0.25}>
    <Chip
      label="LLT"
      size="small"
      variant="outlined"
      sx={{ height: 16, fontSize: "0.6rem", minWidth: 38 }}
    />
    <Typography variant="caption" fontFamily="monospace" color="text.secondary" sx={{ minWidth: 72 }}>
      {llt.code}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {llt.name}
    </Typography>
    {llt.currency && (
      <Chip
        label={llt.currency === "Y" ? "Vigente" : "No vigente"}
        size="small"
        color={llt.currency === "Y" ? "success" : "default"}
        sx={{ height: 16, fontSize: "0.6rem" }}
      />
    )}
  </Stack>
)

const LoadingItem = ({ nodeId }: { nodeId: string }) => (
  <TreeItem nodeId={nodeId} label={<CircularProgress size={14} sx={{ my: 0.5, ml: 1 }} />} />
)

// ─── Main Page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

export const MeddraPage = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [socPage, setSocPage] = useState(1)
  const [socs, setSocs] = useState<SOC[]>([])
  const [socTotal, setSocTotal] = useState(0)
  const [socsLoading, setSocsLoading] = useState(false)

  const [ptsBySoc, setPtsBySoc] = useState<Record<string, ChildrenState<PT>>>({})
  const [lltsByPt, setLltsByPt] = useState<Record<string, ChildrenState<LLT>>>({})
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Debounced search ──
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setSocPage(1)
      setPtsBySoc({})
      setLltsByPt({})
      setExpandedItems([])
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchTerm])

  // ── Load SOC page ──
  useEffect(() => {
    setSocsLoading(true)
    intESAVIClient
      .get("/meddra/soc/list", {
        params: {
          page: socPage - 1,
          size: PAGE_SIZE,
          ...(debouncedSearch ? { term: debouncedSearch } : {}),
        },
      })
      .then((res) => {
        setSocs(res.data.data ?? [])
        setSocTotal(res.data.total ?? 0)
      })
      .catch(() => setSocs([]))
      .finally(() => setSocsLoading(false))
  }, [socPage, debouncedSearch])

  // ── Lazy load PTs for a SOC ──
  const loadPts = async (socCode: string) => {
    if (ptsBySoc[socCode] !== undefined && ptsBySoc[socCode] !== "unloaded") return
    setPtsBySoc((prev) => ({ ...prev, [socCode]: "loading" }))
    try {
      const res = await intESAVIClient.get("/meddra/pt/list", {
        params: { socCode, page: 0, size: 500 },
      })
      setPtsBySoc((prev) => ({ ...prev, [socCode]: res.data.data ?? [] }))
    } catch {
      setPtsBySoc((prev) => ({ ...prev, [socCode]: [] }))
    }
  }

  // ── Lazy load LLTs for a PT ──
  const loadLlts = async (ptCode: string) => {
    if (lltsByPt[ptCode] !== undefined && lltsByPt[ptCode] !== "unloaded") return
    setLltsByPt((prev) => ({ ...prev, [ptCode]: "loading" }))
    try {
      const res = await intESAVIClient.get("/meddra/llt/list", {
        params: { ptCode, page: 0, size: 1000 },
      })
      setLltsByPt((prev) => ({ ...prev, [ptCode]: res.data.data ?? [] }))
    } catch {
      setLltsByPt((prev) => ({ ...prev, [ptCode]: [] }))
    }
  }

  // ── Expansion handler — triggers lazy load (v6 API: onNodeToggle) ──
  const handleNodeToggle = (_event: React.SyntheticEvent, nodeIds: string[]) => {
    const newlyExpanded = nodeIds.filter((id) => !expandedItems.includes(id))
    setExpandedItems(nodeIds)

    newlyExpanded.forEach((nodeId) => {
      if (nodeId.startsWith("soc-")) {
        loadPts(nodeId.slice(4))
      } else if (nodeId.startsWith("pt-")) {
        loadLlts(nodeId.slice(3))
      }
    })
  }

  // ── Render PT children of a SOC ──
  const renderPtChildren = (socCode: string) => {
    const state = ptsBySoc[socCode]
    if (!state || state === "unloaded") {
      // Hidden placeholder → TreeItem shows expand arrow
      return <TreeItem nodeId={`ph-soc-${socCode}`} label="" sx={{ display: "none" }} />
    }
    if (state === "loading") {
      return <LoadingItem nodeId={`loading-soc-${socCode}`} />
    }
    if (state.length === 0) {
      return (
        <TreeItem
          nodeId={`empty-soc-${socCode}`}
          label={
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
              Sin Términos Preferidos
            </Typography>
          }
        />
      )
    }
    return state.map((pt) => (
      <TreeItem key={pt.code} nodeId={`pt-${pt.code}`} label={<PtLabel pt={pt} />}>
        {renderLltChildren(pt.code)}
      </TreeItem>
    ))
  }

  // ── Render LLT children of a PT ──
  const renderLltChildren = (ptCode: string) => {
    const state = lltsByPt[ptCode]
    if (!state || state === "unloaded") {
      return <TreeItem nodeId={`ph-pt-${ptCode}`} label="" sx={{ display: "none" }} />
    }
    if (state === "loading") {
      return <LoadingItem nodeId={`loading-pt-${ptCode}`} />
    }
    if (state.length === 0) {
      return (
        <TreeItem
          nodeId={`empty-pt-${ptCode}`}
          label={
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
              Sin términos LLT
            </Typography>
          }
        />
      )
    }
    return state.map((llt) => (
      <TreeItem key={llt.code} nodeId={`llt-${llt.code}`} label={<LltLabel llt={llt} />} />
    ))
  }

  const totalPages = Math.ceil(socTotal / PAGE_SIZE)

  return (
    <Box p={2}>
      <Title title="MedDRA — Estándar Internacional" />

      <Paper elevation={2} sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          <LocalHospitalIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            MedDRA — Árbol de Terminología Médica
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" mb={2}>
          SOC → PT → LLT · Los hijos se cargan bajo demanda al expandir cada nodo
        </Typography>

        <TextField
          fullWidth
          size="small"
          placeholder="Buscar SOC por nombre o abreviatura…"
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
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : socs.length === 0 ? (
          <Typography color="text.secondary" align="center" py={4}>
            No se encontraron resultados.
          </Typography>
        ) : (
          <>
            <TreeView
              expanded={expandedItems}
              onNodeToggle={handleNodeToggle}
              sx={{
                "& .MuiTreeItem-root": { my: 0.25 },
                "& .MuiTreeItem-content": {
                  borderRadius: 1,
                  py: 0.25,
                  "&:hover": { bgcolor: "action.hover" },
                  "&.Mui-selected, &.Mui-selected.Mui-focused": {
                    bgcolor: "primary.50",
                  },
                },
                "& .MuiTreeItem-group": {
                  ml: 2,
                  borderLeft: "1px dashed",
                  borderColor: "divider",
                  pl: 1,
                },
              }}>
              {socs.map((soc) => (
                <TreeItem key={soc.code} nodeId={`soc-${soc.code}`} label={<SocLabel soc={soc} />}>
                  {renderPtChildren(soc.code)}
                </TreeItem>
              ))}
            </TreeView>

            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={2}>
                <Pagination
                  count={totalPages}
                  page={socPage}
                  onChange={(_, p) => {
                    setSocPage(p)
                    setPtsBySoc({})
                    setLltsByPt({})
                    setExpandedItems([])
                  }}
                  color="primary"
                />
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
