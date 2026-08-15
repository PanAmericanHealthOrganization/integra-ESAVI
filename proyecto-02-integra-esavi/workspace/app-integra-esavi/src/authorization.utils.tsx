import { useContext } from "react"
import { usePermissions } from "react-admin"
import { AuthenticationContext } from "./contexts/AuthContext "

/**
 * ¿El usuario del token trae el rol `admin`?
 *
 * Se apoya en `usePermissions` de react-admin, que devuelve lo que entrega `onPermissions`
 * en App.tsx: el array de roles del realm. Existe como gancho compartido porque la misma
 * comprobación estaba escrita a mano en varias pantallas y cada copia es una oportunidad de
 * que una acción de escritura se quede sin protección.
 *
 * Se usa como lista blanca —«sólo admin»— y no como lista negra sobre un rol concreto: un
 * rol nuevo en el realm queda excluido por omisión, que es el lado seguro en el que
 * equivocarse. La contrapartida es que dar acceso a un perfil nuevo exige tocar el código.
 *
 * Ojo: esto sólo decide qué se dibuja. La autorización real la imponen los guards del API;
 * ocultar un botón no protege un endpoint.
 */
export const useEsAdmin = (): boolean => {
  const { permissions } = usePermissions()
  return Array.isArray(permissions) && permissions.includes("admin")
}

const Authorize = ({ allowedRoles, deniedRoles, children }: any) => {
  const { authState } = useContext(AuthenticationContext)

  const roles = authState?.realm_access?.roles || []
  // Función para verificar si el usuario tiene un rol específico
  const hasRole = (role: any) => roles.includes(role)

  // Lógica para determinar si el usuario tiene acceso
  const hasAccess = () => {
    const hasAllowedRole = allowedRoles.some((role: any) => hasRole(role))
    const hasDeniedRole = deniedRoles.some((role: any) => hasRole(role))
    return hasAllowedRole && !hasDeniedRole
  }

  return <>{hasAccess() ? children : null}</>
}

export default Authorize
