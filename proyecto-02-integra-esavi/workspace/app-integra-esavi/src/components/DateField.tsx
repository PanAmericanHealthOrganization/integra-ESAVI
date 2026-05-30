import { DateFieldProps, DateField as RaDateField } from "react-admin"

// Componente DateField personalizado con formato yyyy-mm-dd por defecto
export const DateField = (props: DateFieldProps) => {
  return (
    <RaDateField
      locales="sv-SE"
      options={{
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }}
      {...props}
    />
  )
}

export default DateField
