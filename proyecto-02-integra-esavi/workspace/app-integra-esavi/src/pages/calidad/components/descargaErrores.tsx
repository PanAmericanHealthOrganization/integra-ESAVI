import DownloadIcon from "@mui/icons-material/Download"
import { IconButton, Tooltip } from "@mui/material"
import React, { useState } from "react"
import { calidadDataProvider } from "../../../dataProviders/calidad.dataprovider"

interface DescargaErroresProps {
  anio: number
  mes: number
  codigoRegla: string
  resource?: string
}

export const DescargaErrores: React.FC<DescargaErroresProps> = ({
  anio,
  mes,
  codigoRegla,
  resource = "calidad",
}) => {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (isDownloading) return

    setIsDownloading(true)
    try {
      await calidadDataProvider.downloadProblemsCSV(
        resource,
        anio,
        mes,
        codigoRegla
      )
    } catch (error) {
      console.error("Error al descargar errores:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Tooltip title="Descargar errores en CSV" arrow>
      <IconButton
        size="small"
        color="primary"
        onClick={handleDownload}
        disabled={isDownloading}>
        <DownloadIcon />
      </IconButton>
    </Tooltip>
  )
}
