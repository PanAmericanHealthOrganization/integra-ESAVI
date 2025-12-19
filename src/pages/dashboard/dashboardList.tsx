import { Box, Grid, Button, Typography, Breadcrumbs, Link } from "@mui/material"
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js"
import { useEffect, useState } from "react"
import { Bar, Pie } from "react-chartjs-2"
import { dashboardDataProvider } from "../../dataProviders/dashboard.dataprovider"

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

const optionsGrave = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top" as const,
    },
    title: {
      display: true,
      text: " Casos esvai por sexo grave",
    },
  },
}

const optionsNoGrave = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top" as const,
    },
    title: {
      display: true,
      text: "Casos esavi por sexo no grave",
    },
  },
}

const optionsPorAnio = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top" as const,
    },
    title: {
      display: true,
      text: "Casos esavi grave/ no grave 2021",
    },
  },
}

const cruceMeddra = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top" as const,
    },
    title: {
      display: true,
      text: "DATOS CRUZADOS MEDDRA",
    },
  },
}

const cruceWhoDrug = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top" as const,
    },
    title: {
      display: true,
      text: "DATOS CRUZADOS WhoDrug",
    },
  },
  options: {
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        max: 100,
        ticks: {
          stepSize: 10,
        },
        type: "logarithmic",
      },
    },
  },
}

const crucenoMeddra = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top" as const,
    },
    title: {
      display: true,
      text: "DATOS NO CRUZADOS MEDDRA",
    },
  },
}

const DashBoardList = () => {
  console.log("En DashBoardList")
  const [dataCasosEsaviPorSexoGrave, setDataCasosEsaviPorSexoGrave] = useState({
    labels: ["NO REGISTRA", "DESCONOCIDO", "HOMBRE", "MUJER"],
    datasets: [
      {
        label: "CANTIDAD",
        data: [0, 0, 0, 0],
        backgroundColor: [
          "rgba(255, 99, 132, 0.2)",
          "rgba(54, 162, 235, 0.2)",
          "rgba(255, 206, 86, 0.2)",
          "rgba(75, 192, 192, 0.2)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
        ],
        borderWidth: 1,
      },
    ],
  })

  const [dataCasosEsaviPorSexoNoGrave, setDataCasosEsaviPorSexoNoGrave] =
    useState({
      labels: ["NO REGISTRA", "DESCONOCIDO", "HOMBRE", "MUJER"],
      datasets: [
        {
          label: "CANTIDAD",
          data: [0, 0, 0, 0],
          backgroundColor: [
            "rgba(255, 99, 132, 0.2)",
            "rgba(54, 162, 235, 0.2)",
            "rgba(255, 206, 86, 0.2)",
            "rgba(75, 192, 192, 0.2)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
          ],
          borderWidth: 1,
        },
      ],
    })

  const [datosCasosEsaviPorMes, setDatosCasosEsaviPorMes] = useState({
    labels: [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ],
    datasets: [
      {
        label: "Graves",
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        backgroundColor: "rgba(255, 99, 132, 0.5)",
      },
      {
        label: "No graves",
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        backgroundColor: "rgba(53, 162, 235, 0.5)",
      },
    ],
  })

  const dataInicialMeddra = {
    total_registros: "0",
    total_llt: "0",
    total_pt: "0",
    total_soc: "0",
  }

  const dataInicialWhoDrug = {
    total_registros: "0",
    total_whudrug: "0",
    total_no_whudrug: "0",
  }

  const [datosCruceMeddra, setDatosCruceMeddra] = useState({
    labels: ["T. Registros", "LLT", "PT", "SOC"],
    datasets: [
      {
        label: "",
        data: [
          parseInt(dataInicialMeddra.total_registros, 10) || 0,
          parseInt(dataInicialMeddra.total_llt, 10) || 0,
          parseInt(dataInicialMeddra.total_pt, 10) || 0,
          parseInt(dataInicialMeddra.total_soc, 10) || 0,
        ],
        backgroundColor: [
          "rgba(255, 99, 132, 0.5)",
          "rgba(53, 162, 235, 0.5)",
          "rgba(255, 159, 64, 0.5)",
          "rgba(75, 192, 192, 0.5)",
        ],
      },
    ],
  })

  const [datosNoCruceMeddra, setNoDatosCruceMeddra] = useState({
    labels: ["T. Registros", "LLT", "PT", "SOC"],
    datasets: [
      {
        label: "",
        data: [
          parseInt(dataInicialMeddra.total_registros, 10) || 0,
          parseInt(dataInicialMeddra.total_llt, 10) || 0,
          parseInt(dataInicialMeddra.total_pt, 10) || 0,
          parseInt(dataInicialMeddra.total_soc, 10) || 0,
        ],
        backgroundColor: [
          "rgba(255, 99, 132, 0.5)",
          "rgba(53, 162, 235, 0.5)",
          "rgba(255, 159, 64, 0.5)",
          "rgba(75, 192, 192, 0.5)",
        ],
      },
    ],
  })

  const [datosCruceWhoDrug, setDatosCruceWhoDrug] = useState({
    labels: ["T. Registros", "Cruzados", "Sin Cruce"],

    datasets: [
      {
        label: "",
        data: [
          parseInt(dataInicialWhoDrug.total_registros, 100) || 0,
          parseInt(dataInicialWhoDrug.total_whudrug, 100) || 0,
          parseInt(dataInicialWhoDrug.total_no_whudrug, 100) || 0,
        ],
        backgroundColor: [
          "rgba(255, 99, 132, 0.5)",
          "rgba(53, 162, 235, 0.5)",
          "rgba(255, 159, 64, 0.5)",
        ],
      },
    ],
  })

  const consultar = async () => {
    try {
      console.log("*** INICIO consultar", import.meta.env.VITE_ESAVI_GRAVE)
      const respuesta = await dashboardDataProvider.casosEsaviPorSexoGrave()
      console.log("*** casosEsaviPorSexoGrave", respuesta)

      // Verificar si la respuesta es válida antes de parsearla como JSON
      if (respuesta && respuesta.msg === "OK" && respuesta.data) {
        console.log("Respuesta Esavi Grave")

        const cantidad = respuesta.data.map((d: any) => parseInt(d.cantidad))
        const labels = respuesta.data.map((d: any) => d.sexo)

        const data = {
          labels: labels,
          datasets: [
            {
              label: "CANTIDAD",
              data: cantidad,
              backgroundColor: [
                "rgba(255, 99, 132, 0.2)",
                "rgba(54, 162, 235, 0.2)",
                "rgba(255, 206, 86, 0.2)",
                "rgba(75, 192, 192, 0.2)",
              ],
              borderColor: [
                "rgba(255, 99, 132, 1)",
                "rgba(54, 162, 235, 1)",
                "rgba(255, 206, 86, 1)",
                "rgba(75, 192, 192, 1)",
              ],
              borderWidth: 1,
            },
          ],
        }

        setDataCasosEsaviPorSexoGrave(data)
      } else {
        console.error(
          "Error en la solicitud casosEsaviPorSexoGrave: Respuesta inválida",
          respuesta
        )
        // Manejar el error como consideres adecuado (ej. mostrar un mensaje al usuario)
      }
    } catch (error) {
      console.error("Error en la solicitud casosEsaviPorSexoGrave:", error)
      // Manejar error de red u otros errores
      // Ej. mostrar un mensaje de error al usuario
    }
  }

  const consultar2 = async () => {
    try {
      const respuesta = await dashboardDataProvider.casosEsaviPorSexoNoGrave()
      console.log("*** casosEsaviPorSexoNoGrave", respuesta)

      // Verificar si la respuesta es válida antes de parsearla como JSON
      if (respuesta && respuesta.msg === "OK" && respuesta.data) {
        const cantidad = respuesta.data.map((d: any) => parseInt(d.cantidad))
        const labels = respuesta.data.map((d: any) => d.sexo)

        const data = {
          labels: labels,
          datasets: [
            {
              label: "CANTIDAD",
              data: cantidad,
              backgroundColor: [
                "rgba(255, 99, 132, 0.2)",
                "rgba(54, 162, 235, 0.2)",
                "rgba(255, 206, 86, 0.2)",
                "rgba(75, 192, 192, 0.2)",
              ],
              borderColor: [
                "rgba(255, 99, 132, 1)",
                "rgba(54, 162, 235, 1)",
                "rgba(255, 206, 86, 1)",
                "rgba(75, 192, 192, 1)",
              ],
              borderWidth: 1,
            },
          ],
        }

        setDataCasosEsaviPorSexoNoGrave(data)
      } else {
        console.error(
          "Error en la solicitud casosEsaviPorSexoNoGrave: Respuesta inválida",
          respuesta
        )
        // Manejar el error como consideres adecuado (ej. mostrar un mensaje al usuario)
      }
    } catch (error) {
      console.error("Error en la solicitud casosEsaviPorSexoNoGrave:", error)
      // Manejar error de red u otros errores
      // Ej. mostrar un mensaje de error al usuario
    }
  }

  const consultar3 = async () => {
    try {
      const respuesta = await dashboardDataProvider.casosEsaviPorMes()
      console.log("*** casosEsaviPorMes", respuesta)

      // Verificar si la respuesta es válida antes de parsearla como JSON
      if (respuesta && respuesta.msg === "OK" && respuesta.data) {
        const labels = respuesta.data.map((d: any) => d.mes)
        const graves = respuesta.data.map((d: any) => parseInt(d.grave))
        const noGraves = respuesta.data.map((d: any) => parseInt(d.nograve))

        const data = {
          labels: labels,
          datasets: [
            {
              label: "Graves",
              data: graves,
              backgroundColor: "rgba(255, 99, 132, 0.5)",
            },
            {
              label: "No graves",
              data: noGraves,
              backgroundColor: "rgba(53, 162, 235, 0.5)",
            },
          ],
        }

        setDatosCasosEsaviPorMes(data)
      } else {
        console.error(
          "Error en la solicitud casosEsaviPorMes: Respuesta inválida",
          respuesta
        )
        // Manejar el error como consideres adecuado (ej. mostrar un mensaje al usuario)
      }
    } catch (error) {
      console.error("Error en la solicitud casosEsaviPorMes:", error)
      // Manejar error de red u otros errores
      // Ej. mostrar un mensaje de error al usuario
    }
  }

  const consultar4 = async () => {
    try {
      const respuesta = await dashboardDataProvider.casosCruzadosMeddra()
      console.log("*** casosEsaviPorMes", respuesta)
      // Verificar si la respuesta es válida antes de parsearla como JSON
      if (respuesta && respuesta.msg === "OK" && respuesta.data) {
        const total_registros = respuesta.data.map(
          (d: any) => d.total_registros
        )
        const total_llt = respuesta.data.map((d: any) => d.total_llt)
        const total_pt = respuesta.data.map((d: any) => d.total_pt)
        const total_soc = respuesta.data.map((d: any) => d.total_soc)

        const data = {
          labels: ["T. Registros", "LLT", "PT", "SOC"],
          datasets: [
            {
              label: "",
              data: [
                parseInt(total_registros, 10) || 0,
                parseInt(total_llt, 10) || 0,
                parseInt(total_pt, 10) || 0,
                parseInt(total_soc, 10) || 0,
              ],
              backgroundColor: [
                "rgba(255, 99, 132, 0.5)",
                "rgba(53, 162, 235, 0.5)",
                "rgba(255, 159, 64, 0.5)",
                "rgba(75, 192, 192, 0.5)",
              ],
            },
          ],
        }

        setDatosCruceMeddra(data)
      } else {
        console.error(
          "Error en la solicitud casosEsaviPorMes: Respuesta inválida",
          respuesta
        )
        // Manejar el error como consideres adecuado (ej. mostrar un mensaje al usuario)
      }
    } catch (error) {
      console.error("Error en la solicitud casosEsaviPorMes:", error)
      // Manejar error de red u otros errores
      // Ej. mostrar un mensaje de error al usuario
    }
  }

  const consultar5 = async () => {
    try {
      const respuesta = await dashboardDataProvider.casosNoCruzadosMeddra()
      // Verificar si la respuesta es válida antes de parsearla como JSON
      if (respuesta && respuesta.msg === "OK" && respuesta.data) {
        const total_registros = respuesta.data.map(
          (d: any) => d.total_registros
        )
        const total_llt = respuesta.data.map((d: any) => d.total_llt)
        const total_pt = respuesta.data.map((d: any) => d.total_pt)
        const total_soc = respuesta.data.map((d: any) => d.total_soc)

        const data = {
          labels: ["T. Registros", "LLT", "PT", "SOC"],
          datasets: [
            {
              label: "",
              data: [
                parseInt(total_registros, 10) || 0,
                parseInt(total_llt, 10) || 0,
                parseInt(total_pt, 10) || 0,
                parseInt(total_soc, 10) || 0,
              ],
              backgroundColor: [
                "rgba(255, 99, 132, 0.5)",
                "rgba(53, 162, 235, 0.5)",
                "rgba(255, 159, 64, 0.5)",
                "rgba(75, 192, 192, 0.5)",
              ],
            },
          ],
        }

        setNoDatosCruceMeddra(data)
      } else {
        console.error(
          "Error en la solicitud casosEsaviPorMes: Respuesta inválida",
          respuesta
        )
        // Manejar el error como consideres adecuado (ej. mostrar un mensaje al usuario)
      }
    } catch (error) {
      console.error("Error en la solicitud casosEsaviPorMes:", error)
      // Manejar error de red u otros errores
      // Ej. mostrar un mensaje de error al usuario
    }
  }

  const consultar6 = async () => {
    try {
      const respuesta = await dashboardDataProvider.casosCruzadosWhodrug()
      // Verificar si la respuesta es válida antes de parsearla como JSON
      if (respuesta && respuesta.msg === "OK" && respuesta.data) {
        const total_registros = respuesta.data.map(
          (d: any) => d.total_registros
        )
        const total_whudrug = respuesta.data.map((d: any) => d.total_whudrug)
        const total_no_whudrug = respuesta.data.map(
          (d: any) => d.total_no_whudrug
        )

        const data = {
          labels: ["T. Registros", "Cruzados", "Sin Cruce"],
          datasets: [
            {
              label: "",
              data: [
                parseInt(total_registros, 10) || 0,
                parseInt(total_whudrug, 10) || 0,
                parseInt(total_no_whudrug, 10) || 0,
              ],
              backgroundColor: [
                "rgba(255, 99, 132, 0.5)",
                "rgba(53, 162, 235, 0.5)",
                "rgba(255, 159, 64, 0.5)",
              ],
            },
          ],
        }

        setDatosCruceWhoDrug(data)
      } else {
        console.error(
          "Error en la solicitud casosEsaviPorMes: Respuesta inválida",
          respuesta
        )
        // Manejar el error como consideres adecuado (ej. mostrar un mensaje al usuario)
      }
    } catch (error) {
      console.error("Error en la solicitud casosEsaviPorMes:", error)
      // Manejar error de red u otros errores
      // Ej. mostrar un mensaje de error al usuario
    }
  }

  useEffect(() => {
    consultar()
    consultar2()
    consultar3()
    consultar4()
    consultar5()
    consultar6()
  }, [])

  const handleImport = () => {
    console.log('Importar datos action clicked')
    // TODO: abrir diálogo de importación
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          {/* left: breadcrumbs */}
          <Breadcrumbs aria-label="breadcrumb">
            <Link color="inherit" href="#/">Inicio</Link>
            <Typography color="text.primary">Dashboard</Typography>
          </Breadcrumbs>
        </Box>

        <Box sx={{ flex: 2, textAlign: 'center' }}>
          <Typography variant="h5" component="div">Resumen Casos Esavi</Typography>
        </Box>      
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Pie
            data={dataCasosEsaviPorSexoNoGrave as any}
            options={optionsNoGrave}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Pie
            data={dataCasosEsaviPorSexoGrave as any}
            options={optionsGrave}
          />
        </Grid>
        <Grid item xs={12}>
          {/* <Bar data={datosCasosEsaviPorMes} options={optionsPorAnio} /> */}
        </Grid>
        <Grid item xs={12}>
          {/* <Bar data={datosCruceMeddra} options={} /> */}
          <Bar data={datosCruceMeddra} options={cruceMeddra} />
        </Grid>
        <Grid item xs={12}>
          {/* <Bar data={datosCruceMeddra} options={} /> */}
          <Bar data={datosNoCruceMeddra} options={crucenoMeddra} />
        </Grid>
        <Grid item xs={12}>
          {/* <Bar data={datosCruceMeddra} options={} /> */}
          <Bar data={datosCruceWhoDrug} options={cruceWhoDrug} />
        </Grid>
      </Grid>
    </Box>
  )
}

export default DashBoardList
