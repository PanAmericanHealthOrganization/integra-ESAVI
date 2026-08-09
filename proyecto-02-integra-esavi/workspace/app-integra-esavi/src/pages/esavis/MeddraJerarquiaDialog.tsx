import CloseIcon from "@mui/icons-material/Close"
import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material"

/** Un nivel de la jerarquía MedDRA. */
export interface MeddraNode {
  code: string
  name: string
  level: "LLT" | "PT" | "SOC"
}

/**
 * Orden de lectura de la jerarquía: del más general al más específico. El API devuelve el
 * LLT con sus ancestros colgando (`llt.pt.soc`), o sea de abajo hacia arriba, así que hay
 * que invertirlo para mostrarlo como árbol.
 */
const ORDEN: MeddraNode["level"][] = ["SOC", "PT", "LLT"]

const DESCRIPCION: Record<MeddraNode["level"], string> = {
  SOC: "Clasificación por órganos y sistemas",
  PT: "Término preferente",
  LLT: "Término de nivel inferior — es el que se registra en la notificación",
}

const COLOR: Record<MeddraNode["level"], "primary" | "secondary" | "default"> = {
  SOC: "secondary",
  PT: "default",
  LLT: "primary",
}

/**
 * Un nivel y, anidado dentro, el siguiente.
 *
 * La sangría es **estructural**: cada nivel se dibuja dentro del anterior, así que el
 * escalonado sale del propio anidamiento. Calcularla con un margen creciente sobre una
 * lista plana dejaba a PT y LLT alineados entre sí, sin el salto que hace legible la
 * relación de pertenencia.
 */
const Rama = ({
  porNivel,
  indice,
}: {
  porNivel: Map<MeddraNode["level"], MeddraNode>
  indice: number
}) => {
  const nivel = ORDEN[indice]
  if (!nivel) return null

  const nodo = porNivel.get(nivel)
  const esRaiz = indice === 0

  return (
    <Box
      sx={{
        pl: esRaiz ? 0 : 2.5,
        borderLeft: esRaiz ? "none" : "2px solid",
        borderColor: "divider",
      }}>
      <Box sx={{ opacity: nodo ? 1 : 0.5 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Chip
            label={nivel}
            size="small"
            color={COLOR[nivel]}
            variant={nivel === "LLT" ? "filled" : "outlined"}
            sx={{ height: 20, fontSize: "0.65rem", minWidth: 44 }}
          />
          <Typography variant="caption" fontFamily="monospace" color="text.secondary">
            {nodo?.code || "—"}
          </Typography>
        </Stack>
        <Typography variant="body2" fontWeight={nivel === "LLT" ? 600 : 400} sx={{ mt: 0.25 }}>
          {/* Un nivel puede faltar si el diccionario tiene la fila huérfana: se muestra
              igual, atenuado, en vez de esconder el hueco. */}
          {nodo?.name || "No disponible en el diccionario"}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {DESCRIPCION[nivel]}
        </Typography>
      </Box>

      {indice < ORDEN.length - 1 && (
        <Box sx={{ mt: 1.5, ml: 1 }}>
          <Rama porNivel={porNivel} indice={indice + 1} />
        </Box>
      )}
    </Box>
  )
}

interface MeddraJerarquiaDialogProps {
  open: boolean
  onClose: () => void
  /** Los niveles disponibles, en cualquier orden. */
  nodos: MeddraNode[]
  /** Nombre del evento adverso, para dar contexto al diálogo. */
  evento?: string
}

/**
 * Muestra la jerarquía MedDRA completa (SOC → PT → LLT) de un evento adverso, con el código
 * de cada nivel.
 *
 * En la tabla sólo cabe el LLT, que es el término que se registra; los otros dos niveles
 * son los que permiten agrupar y comparar casos, y antes había que ir a la pantalla de
 * MedDRA a buscarlos a mano.
 */
export const MeddraJerarquiaDialog = ({
  open,
  onClose,
  nodos,
  evento,
}: MeddraJerarquiaDialogProps) => {
  const porNivel = new Map(nodos.map((n) => [n.level, n]))

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        Jerarquía MedDRA
        {evento && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {evento}
          </Typography>
        )}
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ position: "absolute", right: 12, top: 12 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ py: 1 }}>
          <Rama porNivel={porNivel} indice={0} />
        </Box>
      </DialogContent>
    </Dialog>
  )
}
