import { combineDataProviders } from "react-admin"
import { esaviDataProvider } from "./esavis.dataprovider"
import { reporteDataProvider } from "./reportes.dataprovider"
import { dashboardDataProvider } from "./dashboard.dataprovider"
import { syncsDataProvider } from "./syncs.dataprovider"
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
    default:
      throw new Error(`Unknown resource: ${resource}`)
  }
})
