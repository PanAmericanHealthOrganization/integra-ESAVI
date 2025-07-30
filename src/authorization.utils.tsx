import { useContext } from "react"
import { AuthenticationContext } from "./contexts/AuthContext "

const Authorize = ({ allowedRoles, deniedRoles, children }: any) => {
  const { authState } = useContext(AuthenticationContext)

  const roles = authState?.resource_access?.["app-integra-esavi"]?.roles || []
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
