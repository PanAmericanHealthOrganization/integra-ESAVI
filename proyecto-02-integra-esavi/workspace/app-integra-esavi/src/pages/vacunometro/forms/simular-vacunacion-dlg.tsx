import ScienceIcon from "@mui/icons-material/Science"
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
} from "@mui/material"
import { startOfDay, subDays } from "date-fns"
import {
  Button,
  DateInput,
  Form,
  SaveButton,
  useDataProvider,
  useNotify,
  useRefresh,
} from "react-admin"
import { useEsAdmin } from "../../../authorization.utils"
import { IVacunometroDataProvider } from "../../../dataProviders/vacunometro.dataprovider"
import ENV_CONFIG from "../../../utils/env_utils"
import { FechaUtils } from "../../../utils/fecha_utils"

/**
 * Mismo tope que aplica el API (MAX_DIAS_SIMULACION en seed.controller.ts). Se valida
 * también aquí para no disparar una petición que el backend va a rechazar con 400.
 */
const MAX_DIAS_SIMULACION = 365

// Los valores por defecto se guardan ya normalizados a "YYYY-MM-DD", que es el mismo
// formato que <DateInput> escribe en el formulario al editarlo: así el valor tiene un
// único formato, se toque o no el campo.
const defaultValues = {
  desde: FechaUtils.aFechaIso(subDays(startOfDay(new Date()), 6)),
  hasta: FechaUtils.aFechaIso(startOfDay(new Date())),
}

/**
 * Validación para la fecha inicial del rango a simular
 */
const validateDesde = (value: any, allValues: any) => {
  if (!value) return "La fecha desde es requerida"
  if (!allValues.hasta) return undefined
  const dias = FechaUtils.diasDelRango(value, allValues.hasta)
  if (dias < 1) return "La fecha desde debe ser menor o igual a la fecha hasta"
  if (dias > MAX_DIAS_SIMULACION) {
    return `El rango no puede superar ${MAX_DIAS_SIMULACION} días (seleccionados: ${dias})`
  }
  return undefined
}

/**
 * Validación para la fecha final del rango a simular
 */
const validateHasta = (value: any, allValues: any) => {
  if (!value) return "La fecha hasta es requerida"
  if (!allValues.desde) return undefined
  const dias = FechaUtils.diasDelRango(allValues.desde, value)
  if (dias < 1) return "La fecha hasta debe ser mayor o igual a la fecha desde"
  if (dias > MAX_DIAS_SIMULACION) {
    return `El rango no puede superar ${MAX_DIAS_SIMULACION} días (seleccionados: ${dias})`
  }
  return undefined
}

/**
 * Botón y diálogo para generar una simulación de vacunaciones diarias de todos
 * los establecimientos, con el mismo formato que entrega la entidad de vacunación.
 * Se simula un lote por cada día del rango indicado, ambos extremos incluidos.
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
  // La comprobación de rol vive en `useEsAdmin`: estaba escrita a mano aquí y ahora la
  // comparten las tres acciones de escritura de estas dos pantallas.
  const esAdmin = useEsAdmin()

  if (ENV_CONFIG.IS_PRODUCTION || !esAdmin) return null

  const onSubmitHandler = async (values: any) => {
    try {
      const result = await dataProvider.simularVacunacion!("vacunometro", {
        desde: FechaUtils.aFechaIso(values.desde),
        hasta: FechaUtils.aFechaIso(values.hasta),
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
      {/* `variant` explícito: el Button de react-admin es de texto por defecto y quedaba
          desalineado con los botones contenidos del resto de cabeceras. */}
      <Button
        variant="contained"
        startIcon={<ScienceIcon />}
        onClick={() => setOpen(true)}
        label="Simular"
        title="Genera vacunaciones simuladas por día para todos los establecimientos (solo ambientes de prueba)"
      />
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth>
        <DialogTitle>Simular Vacunaciones</DialogTitle>
        <Form onSubmit={onSubmitHandler} defaultValues={defaultValues}>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Genera registros agregados de vacunación por cada día del rango
              seleccionado (ambas fechas incluidas) para todos los
              establecimientos existentes, con el mismo formato que entrega la
              entidad de vacunación. Uso exclusivo para pruebas y demos.
            </DialogContentText>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <DateInput
                  source="desde"
                  label="Fecha desde"
                  required
                  fullWidth
                  validate={validateDesde}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={6}>
                <DateInput
                  source="hasta"
                  label="Fecha hasta"
                  required
                  fullWidth
                  validate={validateHasta}
                  sx={{ mb: 2 }}
                />
              </Grid>
            </Grid>
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
