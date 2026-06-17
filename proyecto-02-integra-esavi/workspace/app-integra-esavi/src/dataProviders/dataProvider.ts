import { combineDataProviders } from "react-admin"
import { calidadDataProvider } from "./calidad.dataprovider"
import { dashboardDataProvider } from "./dashboard.dataprovider"
import { esaviDataProvider } from "./esavis.dataprovider"
import { gacetaDataProvider } from "./gaceta.dataprovider"
import { grupoEtarioDataProvider } from "./grupoEtario.provider"
import { homologationDataProvider } from "./homologation.dataprovider"
import { homologatorDataProvider } from "./homologator.dataprovider"
import { noopDataProvider } from "./noop.dataprovider"
import { reporteDataProvider } from "./reportes.dataprovider"
import { syncsDataProvider } from "./syncs.dataprovider"
import { vacunasDataProvider } from "./vacunas.dataprovider"
import { vacunometroDataProvider } from "./vacunometro.dataprovider"
import { xlsxDataProvider } from "./xlsx.dataprovider"

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
    case "parametros":
      return calidadDataProvider
    case "grupo-etario":
      return grupoEtarioDataProvider
    case "xlsx":
      return xlsxDataProvider
    case "homologators":
      return homologatorDataProvider
    case "homologations":
      return homologationDataProvider
    case "meddra":
    case "whodrug":
    case "estandar-syncs":
      return noopDataProvider
    default:
      throw new Error(`Unknown resource: ${resource}`)
  }
})
