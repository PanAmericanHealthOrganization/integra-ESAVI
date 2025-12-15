import React,{createContext,ReactNode,useContext,useState} from "react"

interface CalidadNavigationContextValue {
  targetRuleCodigo: string | null
  setTargetRule: (codigo: string | null) => void
  navigateToRule: (dimension: string, codigo: string) => void
  clearTargetRule: () => void
}

const CalidadNavigationContext = createContext<
  CalidadNavigationContextValue | undefined
>(undefined)

export const useCalidadNavigation = () => {
  const context = useContext(CalidadNavigationContext)
  if (!context) {
    throw new Error(
      "useCalidadNavigation must be used within CalidadNavigationProvider"
    )
  }
  return context
}

interface CalidadNavigationProviderProps {
  children: ReactNode
  onNavigateToTab: (dimension: string) => void
}

export const CalidadNavigationProvider: React.FC<
  CalidadNavigationProviderProps
> = ({ children, onNavigateToTab }) => {
  const [targetRuleCodigo, setTargetRuleCodigo] = useState<string | null>(null)

  const navigateToRule = (dimension: string, codigo: string) => {
    setTargetRuleCodigo(codigo)
    onNavigateToTab(dimension)
  }

  const setTargetRule = (codigo: string | null) => {
    setTargetRuleCodigo(codigo)
  }

  const clearTargetRule = () => {
    setTargetRuleCodigo(null)
  }

  const value: CalidadNavigationContextValue = {
    targetRuleCodigo,
    setTargetRule,
    navigateToRule,
    clearTargetRule,
  }

  return (
    <CalidadNavigationContext.Provider value={value}>
      {children}
    </CalidadNavigationContext.Provider>
  )
}
