import { ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { useNotify } from "react-admin"
import { Socket, io } from "socket.io-client"
import intESAVIClient from "../../dataProviders/axios.client"
import ENV_CONFIG from "../../utils/env_utils"
import { TokenUtils } from "../../utils/token_utils"

/** Espejo de `INotificacion` en el API (`src/mensajes/models/notificacion.interface.ts`). */
export interface Notificacion {
  id: string
  tipo: string
  nivel: "EXITO" | "ERROR" | "INFO"
  titulo: string
  mensaje: string
  source?: string
  syncId?: string
  fecha: string
  leida: boolean
}

interface EstadoNotificaciones {
  notificaciones: Notificacion[]
  noLeidas: number
  cargando: boolean
  /** `true` mientras el WebSocket está conectado; si se cae, el sondeo toma el relevo. */
  conectado: boolean
  recargar: () => Promise<void>
  marcarLeidas: (ids?: string[]) => Promise<void>
  eliminar: (id: string) => Promise<void>
  limpiar: () => Promise<void>
}

const NotificacionesContext = createContext<EstadoNotificaciones | null>(null)

/** Evento que emite el gateway; debe coincidir con EVENTO_NOTIFICACION en el API. */
const EVENTO_NOTIFICACION = "notificacion"

/**
 * Buzón de notificaciones del usuario.
 *
 * Los procesos largos (cargar MedDRA, sincronizar WHODrug, regenerar el datamart) ya no
 * mantienen la petición abierta hasta terminar: responden enseguida y avisan después. El
 * aviso llega por dos vías, y las dos hacen falta:
 *
 * - **WebSocket**, para que aparezca en el momento en que el proceso termina.
 * - **La lista persistida** que se pide al montar, para lo que ocurrió mientras el
 *   navegador estaba cerrado o la conexión caída. El API guarda las 100 últimas.
 */
export const NotificacionesProvider = ({ children }: { children: ReactNode }) => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [noLeidas, setNoLeidas] = useState(0)
  const [cargando, setCargando] = useState(false)
  const [conectado, setConectado] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const notify = useNotify()

  const recargar = useCallback(async () => {
    setCargando(true)
    try {
      const { data } = await intESAVIClient.get("/mensajes")
      setNotificaciones(data.notificaciones ?? [])
      setNoLeidas(data.noLeidas ?? 0)
    } catch {
      // Un buzón que no carga no debe romper la aplicación: es información accesoria.
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void recargar()
  }, [recargar])

  useEffect(() => {
    const socket = io(`${ENV_CONFIG.INT_ESAV_API}/notificaciones`, {
      // `auth` como función se evalúa en cada intento de conexión, incluidas las
      // reconexiones. Pasar el token como valor fijo significaría reconectar con un JWT
      // vencido y que el gateway cerrara la conexión una y otra vez.
      auth: async (cb: (datos: { token?: string }) => void) => {
        cb({ token: await TokenUtils.asegurarVigente() })
      },
      transports: ["websocket", "polling"],
      reconnectionDelayMax: 10000,
    })

    socket.on("connect", () => setConectado(true))
    socket.on("disconnect", () => setConectado(false))
    socket.on("connect_error", () => setConectado(false))

    socket.on(EVENTO_NOTIFICACION, (notificacion: Notificacion) => {
      setNotificaciones((previas) => {
        // El sondeo inicial y el socket pueden traer la misma notificación.
        if (previas.some((n) => n.id === notificacion.id)) return previas
        return [notificacion, ...previas].slice(0, 100)
      })
      setNoLeidas((n) => n + 1)
      notify(`${notificacion.titulo} — ${notificacion.mensaje}`, {
        type: notificacion.nivel === "ERROR" ? "error" : "success",
        autoHideDuration: 10000,
      })
    })

    socketRef.current = socket
    return () => {
      socket.removeAllListeners()
      socket.disconnect()
      socketRef.current = null
    }
  }, [notify])

  // Las tres mutaciones son optimistas: la campana reacciona al instante y el servidor
  // confirma después. Si la petición falla, se recarga para volver al estado real en vez
  // de dejar la interfaz mintiendo.
  const marcarLeidas = useCallback(
    async (ids?: string[]) => {
      setNotificaciones((previas) =>
        previas.map((n) => (!ids || ids.includes(n.id) ? { ...n, leida: true } : n))
      )
      setNoLeidas((previas) => (ids ? Math.max(0, previas - ids.length) : 0))
      try {
        await intESAVIClient.patch("/mensajes/leidas", ids?.length ? { ids } : {})
      } catch {
        await recargar()
      }
    },
    [recargar]
  )

  const eliminar = useCallback(
    async (id: string) => {
      setNotificaciones((previas) => previas.filter((n) => n.id !== id))
      try {
        await intESAVIClient.delete(`/mensajes/${id}`)
      } catch {
        await recargar()
      }
    },
    [recargar]
  )

  const limpiar = useCallback(async () => {
    setNotificaciones([])
    setNoLeidas(0)
    try {
      await intESAVIClient.delete("/mensajes/todas")
    } catch {
      await recargar()
    }
  }, [recargar])

  return (
    <NotificacionesContext.Provider
      value={{ notificaciones, noLeidas, cargando, conectado, recargar, marcarLeidas, eliminar, limpiar }}>
      {children}
    </NotificacionesContext.Provider>
  )
}

/**
 * Acceso al buzón. Devuelve `null` fuera del provider en lugar de lanzar: la campana es
 * un accesorio del layout y no debe impedir que se renderice una pantalla suelta —por
 * ejemplo en un test— por no tener el provider montado.
 */
export const useNotificaciones = () => useContext(NotificacionesContext)
