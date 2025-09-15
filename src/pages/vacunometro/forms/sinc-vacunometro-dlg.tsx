import {Dialog} from "@mui/material"
import { Button, DateField, Form, SimpleForm } from "react-admin"

export const SyncVacunometroDialog = (
  { open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }
) => {
 
  const onSubmitHandler = (e:any,  values: any) => {
    console.log(values)
  }
 
 return (
   <>
     <Button onClick={() => setOpen(true)} label="Sincronizar Vacunometro" />
     <Dialog open={open} onClose={() => setOpen(false)}>
       <Form onSubmit={onSubmitHandler}>
         <DateField source="desde" label="Desde" />
         <DateField source="hasta" label="Hasta" />
       </Form>
     </Dialog>
   </>
 )
}
