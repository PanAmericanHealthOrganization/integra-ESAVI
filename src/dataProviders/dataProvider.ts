import { combineDataProviders } from "react-admin"
import { esaviDataProvider } from "./esavis.dataprovider"
import { reporteDataProvider } from "./reportes.dataprovider"
import { dashboardDataProvider } from "./dashboard.dataprovider"

export const dataProvider = combineDataProviders((resource) => {
  switch (resource) {
    case "dashboard":
      return dashboardDataProvider
    case "esavis":
      return esaviDataProvider
    case "reportes":
      return reporteDataProvider
    default:
      throw new Error(`Unknown resource: ${resource}`)
  }
})
