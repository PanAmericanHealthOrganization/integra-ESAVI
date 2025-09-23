import SyncIcon from "@mui/icons-material/Sync"
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
} from "@mui/material"
import { endOfMonth, format, isAfter, isBefore, startOfDay } from "date-fns"
import {
  Button,
  DateInput,
  Form,
  SaveButton,
  useDataProvider,
  useNotify,
} from "react-admin"
import { IVacunometroDataProvider } from "../../../dataProviders/vacunas.dataprovider"
/**
 *
 */
const defaultValues = {
  desde: startOfDay(new Date()),
  hasta: endOfMonth(new Date()),
}

/**
 * Validación para fecha desde
 */
const validateDesde = (value: any, allValues: any) => {
  if (!value) return "La fecha desde es requerida"
  if (allValues.hasta && isAfter(new Date(value), new Date(allValues.hasta))) {
    return "La fecha desde debe ser menor o igual a la fecha hasta"
  }
  return undefined
}

/**
 * Validación para fecha hasta
 */
const validateHasta = (value: any, allValues: any) => {
  if (!value) return "La fecha hasta es requerida"
  if (allValues.desde && isBefore(new Date(value), new Date(allValues.desde))) {
    return "La fecha hasta debe ser mayor o igual a la fecha desde"
  }
  return undefined
}
/**
 *
 * @param param0
 * @returns
 */
export const SyncVacunometroDialog = ({
  open,
  setOpen,
}: {
  open: boolean
  setOpen: (open: boolean) => void
}) => {
  const dataProvider = useDataProvider<IVacunometroDataProvider>()
  /**
   *
   * @param e
   * @param values
   */
  const notify = useNotify()
  const onSubmitHandler = async (values: any) => {
    try {
      const { desde, hasta } = values
      const params = {
        desde: format(new Date(desde), "yyyy-MM-dd"),
        hasta: format(new Date(hasta), "yyyy-MM-dd"),
      }
      await dataProvider.syncVacunometro("vacunacion-nominal-sync", {
        ...params,
      })
      setOpen(false)
      notify("Sincronización finalizada", { type: "info" })
    } catch (error) {
      notify(
        `Error en la sincronización: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
        { type: "error" }
      )
    }
  }

  return (
    <>
      <Button
        startIcon={<SyncIcon />}
        onClick={() => setOpen(true)}
        label="Sincronizar"
        title="Recupera los agregados de vacunametro desde el sistema de vacunación"
      />
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth>
        <DialogTitle>Sincronizar Vacunómetro</DialogTitle>
        <Form onSubmit={onSubmitHandler} defaultValues={defaultValues}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
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
            <SaveButton label="Sincronizar" type="submit" variant="contained" />
          </DialogActions>
        </Form>
      </Dialog>
    </>
  )
}
