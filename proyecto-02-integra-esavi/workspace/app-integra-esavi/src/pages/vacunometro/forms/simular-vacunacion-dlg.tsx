import ScienceIcon from "@mui/icons-material/Science"
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material"
import {
  Button,
  Form,
  NumberInput,
  SaveButton,
  useDataProvider,
  useNotify,
  usePermissions,
  useRefresh,
} from "react-admin"
import { IVacunometroDataProvider } from "../../../dataProviders/vacunometro.dataprovider"
import ENV_CONFIG from "../../../utils/env_utils"

const defaultValues = {
  dias: 7,
}

/**
 * Validación para la cantidad de días a simular
 */
const validateDias = (value: any) => {
  if (!value) return "La cantidad de días es requerida"
  if (value < 1 || value > 365) return "La cantidad de días debe estar entre 1 y 365"
  return undefined
}

/**
 * Botón y diálogo para generar una simulación de vacunaciones diarias de todos
 * los establecimientos, con el mismo formato que entrega la entidad de vacunación.
 * Solo visible para usuarios con rol "admin" y en ambientes distintos de producción.
 */
export const SimularVacunacionDialog = ({
  open,
  setOpen,
}: {
  open: boolean
  setOpen: (open: boolean) => void
}) => {
  const dataProvider = useDataProvider<IVacunometroDataProvider>()
  const notify = useNotify()
  const refresh = useRefresh()
  const { permissions } = usePermissions()

  const isAdmin = Array.isArray(permissions) && permissions.includes("admin")
  if (ENV_CONFIG.IS_PRODUCTION || !isAdmin) return null

  const onSubmitHandler = async (values: any) => {
    try {
      const result = await dataProvider.simularVacunacion!("vacunometro", {
        dias: Number(values.dias),
      })
      setOpen(false)
      notify(
        result?.data?.message || "Simulación de vacunaciones generada",
        { type: "info" }
      )
      refresh()
    } catch (error) {
      notify(
        `Error en la simulación: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
        { type: "error" }
      )
    }
  }

  return (
    <>
      <Button
        startIcon={<ScienceIcon />}
        onClick={() => setOpen(true)}
        label="Simular"
        title="Genera vacunaciones simuladas por día para todos los establecimientos (solo ambientes de prueba)"
      />
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="xs"
        fullWidth>
        <DialogTitle>Simular Vacunaciones</DialogTitle>
        <Form onSubmit={onSubmitHandler} defaultValues={defaultValues}>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Genera registros agregados de vacunación por día para todos los
              establecimientos existentes, con el mismo formato que entrega la
              entidad de vacunación. Uso exclusivo para pruebas y demos.
            </DialogContentText>
            <NumberInput
              source="dias"
              label="Días a simular (hacia atrás desde hoy)"
              min={1}
              max={365}
              required
              fullWidth
              validate={validateDias}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              label="Cancelar"
              onClick={() => setOpen(false)}
              variant="outlined"
            />
            <SaveButton label="Simular" type="submit" variant="contained" />
          </DialogActions>
        </Form>
      </Dialog>
    </>
  )
}
