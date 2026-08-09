import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined"
import LocalHospitalIcon from "@mui/icons-material/LocalHospital"
import SearchIcon from "@mui/icons-material/Search"
import {
  Box,
  Button,
  Chip,
  Divider,
  CircularProgress,
  InputAdornment,
  Pagination,
  Stack,
  TextField,
  Typography,
} from "@mui/material"
import { ReactNode } from "react"
import { TreeItem, TreeView } from "@mui/x-tree-view"
import { useEffect, useMemo, useRef, useState } from "react"
import { Title } from "react-admin"
import { SincronizarMeddraButton } from "../../components/SyncActions"
import { PanelHeader, PanelTabla } from "../../components/PanelTabla"
import { LAYOUT } from "../../theme"
import intESAVIClient from "../../dataProviders/axios.client"

// ─── Types ────────────────────────────────────────────────────────────────────

interface SOC {
  id?: number
  code: string
  name: string
  abbrev: string
}

interface PT {
  id?: number
  code: string
  name: string
  socCode: string
}

interface LLT {
  id?: number
  code: string
  name: string
  ptCode: string
  currency: string
}

type ChildrenState<T> = "unloaded" | "loading" | T[]

type NivelMeddra = "SOC" | "PT" | "LLT"

/**
 * Coincidencia devuelta por /meddra/busqueda: el elemento encontrado más su camino hasta
 * la raíz, para poder pintar el árbol ya expandido hasta él. Los ancestros vienen en `null`
 * si el diccionario tiene filas huérfanas.
 */
interface Coincidencia {
  nivel: NivelMeddra
  soc: SOC | null
  pt: PT | null
  llt: LLT | null
}

interface TotalPorNivel {
  soc: number
  pt: number
  llt: number
}

/** Ramas del árbol derivadas de las coincidencias de una búsqueda. */
interface ArbolBusqueda {
  socs: SOC[]
  ptsPorSoc: Record<string, PT[]>
  lltsPorPt: Record<string, LLT[]>
  ptsHuerfanos: PT[]
  lltsHuerfanos: LLT[]
  /** nodeIds de los ancestros que deben abrirse para dejar visible cada coincidencia. */
  expandidos: string[]
}

const ARBOL_VACIO: ArbolBusqueda = {
  socs: [],
  ptsPorSoc: {},
  lltsPorPt: {},
  ptsHuerfanos: [],
  lltsHuerfanos: [],
  expandidos: [],
}

// ─── Label sub-components ─────────────────────────────────────────────────────

/** Escapa los metacaracteres para poder buscar el término como texto literal. */
const escaparRegExp = (texto: string) => texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

/**
 * Resalta las apariciones del término dentro del texto.
 *
 * Antes se pintaba de naranja la fila completa del nodo coincidente, lo que tapaba el
 * contenido y no decía *por qué* había coincidido. Marcando sólo la porción que empata se
 * ve de inmediato qué parte del nombre —o del código— disparó el resultado.
 *
 * La comparación es insensible a mayúsculas, igual que la del API (`LOWER(...) LIKE`), para
 * que lo resaltado sea exactamente lo que hizo entrar a la fila en el resultado.
 */
const resaltar = (texto: string, termino: string): ReactNode => {
  const limpio = (termino ?? "").trim()
  if (!limpio || !texto) return texto

  const partes = texto.split(new RegExp(`(${escaparRegExp(limpio)})`, "gi"))
  return partes.map((parte, i) =>
    parte.toLowerCase() === limpio.toLowerCase() ? (
      <Box
        key={i}
        component="mark"
        sx={{ bgcolor: "warning.light", color: "inherit", px: 0.25, borderRadius: 0.5 }}>
        {parte}
      </Box>
    ) : (
      parte
    )
  )
}

const SocLabel = ({ soc, termino = "" }: { soc: SOC; termino?: string }) => (
  <Stack direction="row" alignItems="center" spacing={1} py={0.25}>
    <Chip label="SOC" size="small" color="primary" sx={{ height: 18, fontSize: "0.65rem", minWidth: 38 }} />
    <Typography variant="caption" fontFamily="monospace" color="text.secondary" sx={{ minWidth: 72 }}>
      {resaltar(soc.code, termino)}
    </Typography>
    <Typography variant="body2" fontWeight={600}>
      {resaltar(soc.name, termino)}
    </Typography>
    {soc.abbrev && (
      <Typography variant="caption" color="text.secondary">
        ({resaltar(soc.abbrev, termino)})
      </Typography>
    )}
  </Stack>
)

const PtLabel = ({ pt, termino = "" }: { pt: PT; termino?: string }) => (
  <Stack direction="row" alignItems="center" spacing={1} py={0.25}>
    <Chip label="PT" size="small" color="secondary" sx={{ height: 18, fontSize: "0.65rem", minWidth: 38 }} />
    <Typography variant="caption" fontFamily="monospace" color="text.secondary" sx={{ minWidth: 72 }}>
      {resaltar(pt.code, termino)}
    </Typography>
    <Typography variant="body2">{resaltar(pt.name, termino)}</Typography>
  </Stack>
)

const LltLabel = ({ llt, termino = "" }: { llt: LLT; termino?: string }) => (
  <Stack direction="row" alignItems="center" spacing={1} py={0.25}>
    <Chip
      label="LLT"
      size="small"
      variant="outlined"
      sx={{ height: 16, fontSize: "0.6rem", minWidth: 38 }}
    />
    <Typography variant="caption" fontFamily="monospace" color="text.secondary" sx={{ minWidth: 72 }}>
      {resaltar(llt.code, termino)}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {resaltar(llt.name, termino)}
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

// ─── Derivación del árbol de resultados ───────────────────────────────────────

/**
 * Agrupa las coincidencias en las ramas SOC → PT → LLT que hay que pintar, junto con los
 * nodos que hay que expandir para dejar visible cada coincidencia. Cada coincidencia trae su camino completo, así que basta
 * con recorrerlas una vez sin pedir nada más al API.
 */
const construirArbol = (coincidencias: Coincidencia[]): ArbolBusqueda => {
  const socs = new Map<string, SOC>()
  const ptsPorSoc = new Map<string, Map<string, PT>>()
  const lltsPorPt = new Map<string, Map<string, LLT>>()
  const ptsHuerfanos = new Map<string, PT>()
  const lltsHuerfanos = new Map<string, LLT>()
  const expandidos = new Set<string>()

  const agregar = <T,>(mapa: Map<string, Map<string, T>>, padre: string, clave: string, valor: T) => {
    if (!mapa.has(padre)) mapa.set(padre, new Map())
    mapa.get(padre)!.set(clave, valor)
  }

  for (const c of coincidencias) {
    if (c.soc) socs.set(c.soc.code, c.soc)

    if (c.pt) {
      if (c.soc) agregar(ptsPorSoc, c.soc.code, c.pt.code, c.pt)
      else ptsHuerfanos.set(c.pt.code, c.pt)
    }

    if (c.llt) {
      if (c.pt) agregar(lltsPorPt, c.pt.code, c.llt.code, c.llt)
      else lltsHuerfanos.set(c.llt.code, c.llt)
    }

    // Se abren los ancestros, no el nodo coincidente: si el usuario quiere ver sus hijos
    // los despliega él y ahí se cargan completos desde el API.
    if (c.nivel === "PT" && c.pt) {
      if (c.soc) expandidos.add(`soc-${c.soc.code}`)
    }
    if (c.nivel === "LLT" && c.llt) {
      if (c.soc) expandidos.add(`soc-${c.soc.code}`)
      if (c.pt) expandidos.add(`pt-${c.pt.code}`)
    }
  }

  const porNombre = <T extends { name: string }>(valores: Iterable<T>): T[] =>
    Array.from(valores).sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))

  const aRegistro = <T extends { name: string }>(
    mapa: Map<string, Map<string, T>>
  ): Record<string, T[]> =>
    Object.fromEntries(
      Array.from(mapa).map(([padre, hijos]): [string, T[]] => [padre, porNombre(hijos.values())])
    )

  return {
    socs: porNombre(socs.values()),
    ptsPorSoc: aRegistro(ptsPorSoc),
    lltsPorPt: aRegistro(lltsPorPt),
    ptsHuerfanos: porNombre(ptsHuerfanos.values()),
    lltsHuerfanos: porNombre(lltsHuerfanos.values()),
    expandidos: Array.from(expandidos),
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

export const MeddraPage = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [socs, setSocs] = useState<SOC[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  // Coincidencias de la búsqueda; vacías cuando se está navegando el árbol sin filtro.
  const [coincidencias, setCoincidencias] = useState<Coincidencia[]>([])
  const [totalPorNivel, setTotalPorNivel] = useState<TotalPorNivel>({ soc: 0, pt: 0, llt: 0 })

  const [ptsBySoc, setPtsBySoc] = useState<Record<string, ChildrenState<PT>>>({})
  const [lltsByPt, setLltsByPt] = useState<Record<string, ChildrenState<LLT>>>({})
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const enBusqueda = debouncedSearch.trim().length > 0
  const arbol = useMemo(
    () => (enBusqueda ? construirArbol(coincidencias) : ARBOL_VACIO),
    [enBusqueda, coincidencias]
  )

  // ── Debounced search ──
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1)
      setPtsBySoc({})
      setLltsByPt({})
      setExpandedItems([])
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchTerm])

  // ── Carga de la página: búsqueda en los tres niveles o listado de SOCs ──
  useEffect(() => {
    const term = debouncedSearch.trim()
    setLoading(true)

    // Con término se consulta el buscador transversal (código/nombre de SOC, PT y LLT);
    // sin término se listan los SOC raíz y el árbol se recorre expandiendo a demanda.
    const peticion = term
      ? intESAVIClient
          .get("/meddra/busqueda", { params: { term, page: page - 1, size: PAGE_SIZE } })
          .then((res) => {
            const encontradas: Coincidencia[] = res.data.data ?? []
            setCoincidencias(encontradas)
            setSocs([])
            setTotal(res.data.total ?? 0)
            setTotalPorNivel(res.data.totalPorNivel ?? { soc: 0, pt: 0, llt: 0 })
            // El árbol se abre hasta cada elemento encontrado.
            setExpandedItems(construirArbol(encontradas).expandidos)
          })
      : intESAVIClient
          .get("/meddra/soc/list", { params: { page: page - 1, size: PAGE_SIZE } })
          .then((res) => {
            setSocs(res.data.data ?? [])
            setTotal(res.data.total ?? 0)
            setCoincidencias([])
            setTotalPorNivel({ soc: 0, pt: 0, llt: 0 })
          })

    peticion
      .catch(() => {
        setSocs([])
        setCoincidencias([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [page, debouncedSearch])

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

    // Mientras no se hayan traído todos los PT del SOC se muestran los que coincidieron con
    // la búsqueda; al desplegar el nodo se cargan completos y estos quedan reemplazados.
    if (!Array.isArray(state)) {
      const coincidentes = arbol.ptsPorSoc[socCode]
      if (coincidentes?.length) {
        return coincidentes.map((pt) => (
          <TreeItem
            key={pt.code}
            nodeId={`pt-${pt.code}`}
            label={<PtLabel pt={pt} termino={debouncedSearch} />}>
            {renderLltChildren(pt.code)}
          </TreeItem>
        ))
      }
    }

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
      <TreeItem
        key={pt.code}
        nodeId={`pt-${pt.code}`}
        label={<PtLabel pt={pt} termino={debouncedSearch} />}>
        {renderLltChildren(pt.code)}
      </TreeItem>
    ))
  }

  // ── Render LLT children of a PT ──
  const renderLltChildren = (ptCode: string) => {
    const state = lltsByPt[ptCode]

    if (!Array.isArray(state)) {
      const coincidentes = arbol.lltsPorPt[ptCode]
      if (coincidentes?.length) {
        return coincidentes.map((llt) => (
          <TreeItem
            key={llt.code}
            nodeId={`llt-${llt.code}`}
            label={<LltLabel llt={llt} termino={debouncedSearch} />}
          />
        ))
      }
    }

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
      <TreeItem
        key={llt.code}
        nodeId={`llt-${llt.code}`}
        label={<LltLabel llt={llt} termino={debouncedSearch} />}
      />
    ))
  }

  // Raíces del árbol: los SOC de la página, más los PT/LLT cuyos ancestros no existen en el
  // diccionario y que si no quedarían fuera del resultado.
  const socsVisibles = enBusqueda ? arbol.socs : socs
  const hayResultados =
    socsVisibles.length > 0 || arbol.ptsHuerfanos.length > 0 || arbol.lltsHuerfanos.length > 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const resumenNiveles = [
    totalPorNivel.soc ? `${totalPorNivel.soc} SOC` : null,
    totalPorNivel.pt ? `${totalPorNivel.pt} PT` : null,
    totalPorNivel.llt ? `${totalPorNivel.llt} LLT` : null,
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <Box p={LAYOUT.paddingPagina}>
      <Title title="MedDRA — Estándar Internacional" />

      <PanelTabla>
        <PanelHeader
          icono={<LocalHospitalIcon fontSize="small" />}
          titulo="MedDRA — Árbol de Terminología Médica"
          subtitulo={
            enBusqueda
              ? "Coincidencias por código o nombre en cualquier nivel · El árbol se abre hasta cada elemento encontrado"
              : "SOC → PT → LLT · Los hijos se cargan bajo demanda al expandir cada nodo"
          }
          acciones={<SincronizarMeddraButton />}>
          {/* Filtro visible en la banda, igual que en el resto de pantallas. */}
          <Box display="flex" gap={1.5} alignItems="center">
            <TextField
              placeholder="Buscar por código o nombre de SOC, PT o LLT…"
              sx={{ flex: 1 }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
            />
            <Button onClick={() => setSearchTerm("")} disabled={!searchTerm}>
              Limpiar
            </Button>
          </Box>
        </PanelHeader>


        {/* ── Árbol ── */}
        <Box sx={{ maxHeight: 480, overflow: "auto" }} px={2} py={1.5}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress size={28} />
            </Box>
          ) : !hayResultados ? (
            <Box display="flex" flexDirection="column" alignItems="center" gap={1} py={6}>
              <InboxOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
              <Typography variant="body2" color="text.secondary">
                No se encontraron resultados.
              </Typography>
            </Box>
          ) : (
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
              {socsVisibles.map((soc) => (
                <TreeItem
                  key={soc.code}
                  nodeId={`soc-${soc.code}`}
                  label={<SocLabel soc={soc} termino={debouncedSearch} />}>
                  {renderPtChildren(soc.code)}
                </TreeItem>
              ))}

              {arbol.ptsHuerfanos.map((pt) => (
                <TreeItem
                  key={`huerfano-pt-${pt.code}`}
                  nodeId={`pt-${pt.code}`}
                  label={<PtLabel pt={pt} termino={debouncedSearch} />}>
                  {renderLltChildren(pt.code)}
                </TreeItem>
              ))}

              {arbol.lltsHuerfanos.map((llt) => (
                <TreeItem
                  key={`huerfano-llt-${llt.code}`}
                  nodeId={`llt-${llt.code}`}
                  label={<LltLabel llt={llt} termino={debouncedSearch} />}
                />
              ))}
            </TreeView>
          )}
        </Box>

        {!loading && hayResultados && (
          <>
            <Divider />
            <Box display="flex" flexDirection="column" alignItems="center" gap={0.5} py={1.5}>
              {totalPages > 1 && (
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, p) => {
                    setPage(p)
                    setPtsBySoc({})
                    setLltsByPt({})
                    setExpandedItems([])
                  }}
                  color="primary"
                  size="small"
                />
              )}
              <Typography variant="caption" color="text.secondary">
                {enBusqueda
                  ? `${total} coincidencia${total !== 1 ? "s" : ""}${resumenNiveles ? ` · ${resumenNiveles}` : ""}`
                  : `${total} SOC${total !== 1 ? "s" : ""} encontrado${total !== 1 ? "s" : ""}`}
              </Typography>
            </Box>
          </>
        )}
      </PanelTabla>
    </Box>
  )
}
