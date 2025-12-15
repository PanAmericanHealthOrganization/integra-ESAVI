import ENV_CONFIG from "../../utils/env_utils"

export const EsaviDashboardList = () => {
  const token = ENV_CONFIG.INT_ESAVI_DASHBOARD_TOKEN

  return (
    <>
      <iframe
        src={`http://127.0.0.1:3939/?token=${token}`}
        style={{ width: "100%", height: "96%" }}></iframe>
    </>
  )
}
