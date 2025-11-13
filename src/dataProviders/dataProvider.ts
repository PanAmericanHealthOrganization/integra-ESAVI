import { combineDataProviders } from "react-admin"
import { dashboardDataProvider } from "./dashboard.dataprovider"
import { calidadDataProvider } from "./calidad.dataprovider"
import { esaviDataProvider } from "./esavis.dataprovider"
import { gacetaDataProvider } from "./gaceta.dataprovider"
import { reporteDataProvider } from "./reportes.dataprovider"
import { syncsDataProvider } from "./syncs.dataprovider"
import { vacunasDataProvider } from "./vacunas.dataprovider"
import { vacunometroDataProvider } from "./vacunometro.dataprovider"

export const dataProvider = combineDataProviders((resource) => {
  switch (resource) {
    case "dashboard":
      return dashboardDataProvider
    case "esavis":
      return esaviDataProvider
    case "reportes":
      return reporteDataProvider
    case "syncs":
      return syncsDataProvider
    case "vacunometro":
      return vacunometroDataProvider
    case "vacunacion-nominal-sync":
      return vacunasDataProvider
    case "gaceta":
      return gacetaDataProvider
    case "dataquality":
      return calidadDataProvider
    default:
      throw new Error(`Unknown resource: ${resource}`)
  }
})
