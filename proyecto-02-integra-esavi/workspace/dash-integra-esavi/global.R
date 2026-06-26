# ---------------------------------------------------------------------------- -
# Script: global.R ----
# Version: 1.0
# Pais: País
# Epidemiologo: Analía Cáceres | caceresanali@paho.org
# Científico de Datos: Carlos Falla | fallacar@paho.org
# Date: 2025-06-30
# Descripcion: Define variables globales de la app y carga la informacion
# ---------------------------------------------------------------------------- -


# ---------------------------------------------------------------------------- -
# 1. Configuración general ----
# ---------------------------------------------------------------------------- -

# 1.1 Codigo para garantizar el uso de español utf8 ----

# Configuración de idioma compatible con diferentes sistemas operativos
tryCatch(
  {
    if (Sys.info()["sysname"] == "Darwin") {
      # macOS
      Sys.setlocale("LC_CTYPE", "es_ES.UTF-8")
    } else if (Sys.info()["sysname"] == "Windows") {
      # Windows
      Sys.setlocale("LC_CTYPE", "Spanish_Spain.utf8")
    } else {
      # Linux/Unix
      Sys.setlocale("LC_CTYPE", "es_ES.UTF-8")
    }
  },
  warning = function(w) {
    # Si no se puede configurar el idioma, continuar con la configuración por defecto
    cat("Advertencia: No se pudo configurar el idioma español. Usando configuración por defecto.\n")
  }
)


# 1.2 Carga de librerías ----

# # Al inicio del script de la aplicación
# if (!requireNamespace("renv", quietly = TRUE)) {
#   install.packages("renv")
# }
#
# # Restaurar el entorno con renv
# renv::restore()

library(shiny) # Framework para crear aplicaciones web interactivas en R
library(dplyr) # Manipulación y transformación eficiente de datos
library(fresh) # Personalización de temas para aplicaciones Shiny
library(ggplot2) # Sistema para crear gráficos estadísticos declarativos
library(TTR) # Funciones para análisis técnico y trading
library(purrr) # Para programación funcional, especialmente útil para operaciones map/reduce
library(lubridate) # Manipulación y trabajo con fechas y horas
library(highcharter) # Wrapper de Highcharts para R, permite crear gráficos interactivos avanzados
library(shinyWidgets) # Widgets adicionales para aplicaciones Shiny
library(shinydashboard) # Creación de dashboards en Shiny
library(shinydashboardPlus) # Extensión de shinydashboard con componentes adicionales
library(sf) # Manejo de datos espaciales y geográficos
library(flextable) # Creación y formateo de tablas flexibles
library(htmltools) # Herramientas para generar y manipular contenido HTML
library(data.table) # Manipulación de datos de alta performance
library(waiter) # Añade pantallas de carga y spinners a aplicaciones Shiny
library(wordcloud) # Creación de nubes de palabras
library(stringr) # Manipulación y procesamiento de cadenas de texto
library(leaflet) # Creación de mapas interactivos
library(leaflet.extras) # Funcionalidades adicionales para leaflet
library(RColorBrewer) # Paletas de colores para visualización de datos
library(DT) # Tablas de datos interactivas
library(sf) # Manejo de datos espaciales y geográficos
library(ggthemes) # Temas adicionales para ggplot2
library(patchwork) # Composición de múltiples gráficos ggplot2
library(cowplot) # Creación de composiciones complejas de gráficos
library(paletteer) # Colección comprehensiva de paletas de colores para R
library(rstudioapi)
library(shinyjs)
library(tibble)
library(htmlwidgets)

# if (!requireNamespace("BiocManager", quietly = TRUE))
#   install.packages("BiocManager")
#   BiocManager::install(c("BiocVersion", "LBE"))

library(PhViD)

select <- dplyr::select
filter <- dplyr::filter




# 1.3 Variables globales ----

f_unidad_tasa <- function(var_unidad_tasa) {
  # Usar switch o un vector nombrado para mapear valores
  tasas <- c(
    "1K"   = 1000,
    "10K"  = 10000,
    "100K" = 100000,
    "1M"   = 1000000,
    "10M"  = 10000000
  )

  # Verificar si el valor existe en nuestro mapeo
  if (!var_unidad_tasa %in% names(tasas)) {
    stop("Unidad de tasa no válida. Valores permitidos: 1K, 10K, 100K, 1M, 10M")
  }

  # Retornar el valor correspondiente
  return(tasas[var_unidad_tasa])
}


# Variable para ordenar el gupo etario

orden_personalizado <- c("<18 años", "18-24 años", "25-49 años", "50-59 años", "60-69 años", "70-79 años", ">80 años", "Sin info")
orden_personalizado_menores <- c("[0-1) años", "[1-5) años", "[5-10) años", "[10-15) años", "[15-18) años", "Sin info", "No aplica")
orden_personalizado_días <- c(
  "0 días", "1 día", "2 días", "3 días", "4 días", "5 días", "6 días", "7 días", "8-15 días", "16-30 días",
  "31-60 días", "60 días a 1 año", "Sin Info", "Síntomas antes de vacuna", "Fechas Inconsistentes"
)

# Variable para presentar secciones colapsadas o extendidas

ver_collapsed <- FALSE


# 1.4 Variables de íconos ----

vDate <- format(Sys.Date(), "%d-%m-%Y")
# vIcon_test <- "fa-duotone fa-solid fa-house"
vIcon_home <- "fa-duotone fa-solid fa-house"
vIcon_intr <- "fa-duotone fa-solid fa-book"
vIcon_cont <- "fa-duotone fa-solid fa-sitemap"
# vIcon_list <- "fa-duotone fa-solid fa-list-ul"
vIcon_test <- "fa-duotone fa-solid fa-chart-simple"
vIcon_kpis <- "fa-duotone fa-solid fa-percent"
vIcon_desc <- "fa-duotone fa-solid fa-chart-simple"
vIcon_vacc <- "fa-duotone fa-solid fa-vial-virus"
vIcon_esav <- "fa-duotone fa-solid fa-head-side-cough"
vIcon_antc <- "fa-duotone fa-solid fa-notes-medical"
vIcon_abou <- "fa-duotone fa-solid fa-circle-info"
vIcon_line <- "fa-duotone fa-solid fa-chart-line"
vIcon_filt <- "fa-duotone fa-solid fa-filter-circle-xmark"
vIcon_hosp <- "fa-duotone fa-solid fa-hospital"
vIcon_bell <- "fa-duotone fa-solid fa-bell"
vIcon_arru <- "fa-duotone fa-solid fa-arrow-up"
vIcon_arrd <- "fa-duotone fa-solid fa-arrow-down"
vIcon_noti <- "fa-duotone fa-solid fa-file-signature"
vIcon_rate <- "fa-duotone fa-solid fa-square-xmark"
vIcon_rate <- "fa-duotone fa-solid fa-divide"
vIcon_dadm <- "fa-duotone fa-solid fa-syringe"
vIcon_time <- "fa-duotone fa-solid fa-stopwatch-20"
vIcon_numb <- "fa-duotone fa-solid fa-hashtag"
vIcon_date <- "fa-duotone fa-solid fa-calendar-days"
vIcon_ctrl <- "fa-duotone fa-solid fa-sliders"
vIcon_senl <- "fa-duotone fa-solid fa-magnifying-glass-plus"
vIcon_meth <- "fa-duotone fa-brands fa-readme"


# 1.5 Paleta de colores ----

vColor1 <- "#1f77b4"
vColor2 <- "#2ca02c"
vColor3 <- "#7f7f7f"
vColor4 <- "#d62728"
vColor5 <- "#9467bd"
vColor6 <- "#8c564b"
vColor7 <- "#e377c2"
vColor8 <- "#7f7f7f"
vColor9 <- "#bcbd22"
vColor10 <- "#17becf"
vColor11 <- "#aec7e8"
vColor12 <- "#F39C13"
vColor13 <- "#FFFFFF"
vColor14 <- "#91b0c9"
vColor15 <- "#006580"
vColor16 <- "#ffbb78"
vColor17 <- "#55e7ff"
vColor18 <- "#2011a2"
vColor19 <- "#201148"
vColor20 <- "#ff34b3"
vColor21 <- "#D8DEE9"
vColor22 <- "#81A1C1"
vColor23 <- "#2E3440"
vColor24 <- "#4BB0EB"
vColor25 <- "#E3EBEC"
vColor26 <- "#05A65A"
vColor27 <- "#DE4C39"

# colores_sexo <- c("#7CB5EC", "#F7A35C","#7f7f7f")
colores_sexo <- c("Masculino" = "#7CB5EC", "Femenino" = "#F7A35C", "No especificado" = "#7f7f7f", "Sin info" = "#D8DEE9")
color_hombres <- "#7CB5EC"
color_mujeres <- "#F7A35C"
color_grave <- "#DE4C39"
color_no_grave <- "#05A65A"

colores_ge <- c(
  "<18 años" = "#4BB0EB", "18-24 años" = "#FF6B6B", "25-49 años" = "#845EC2", "50-59 años" = "#FF9671",
  "60-69 años" = "#FFC75F", "70-79 años" = "#008F7A", ">80 años" = "#4B4453", "Sin info" = "#2ca02c"
)

colores_ge_menores <- c(
  "[0-1) años" = "#4BB0EB", "[1-5) años" = "#008F7A", "[5-10) años" = "#845EC2", "[10-15) años" = "#FF9671",
  "[15-18) años" = "#FFC75F", "Sin info" = "#4B4453", "No aplica" = "#2ca02c"
)

colores_gravedad_sexo <- c(
  "Grave - Femenino" = "#F39C13",
  "No grave - Femenino" = "#FFC75F",
  "Grave - Masculino" = "#1f77b4",
  "No grave - Masculino" = "#17becf",
  "Grave - No especificado" = "#2ca02c",
  "No grave - No especificado" = "#bcbd22"
)


colores_gravedad <- c("Grave" = "#DE4C39", "No grave" = "#05A65A") # , "#D8DEE9")

colores_vacunas <- c(
  "Pfizer" = "#F7A35C", "Sinovac" = "#50A265", "Astrazeneca" = "#45B7D1", "Janssen" = "#D4AF37", "Moderna" = "#9B6B9E",
  "Sinopharm" = "#6A4C93", "Covaxin" = "#3C7A89", "Sputnik" = "#C17817", "Gamaleya" = "#71548D", "No especificado" = "#D8DEE9"
)

colores_tipo_eve <- c(vColor12, vColor1)
vTamano_linea <- 2
vTamano_marker <- 1

# 1.6 Formato general de tablas	----

set_flextable_defaults(
  font.family = "calibri",
  font.size = 11,
  theme_fun = theme_vanilla, # theme_zebra
  padding = 1,
  background.color = "#FFFFFF",
  font.color = "#404040"
) # "#454545")
border_style <- officer::fp_border(color = "white", width = 1)


# 1.7 Funciones de formato de número ----

format_num <- function(x, y) {
  result <- format(round(x, y), big.mark = ".", decimal.mark = ",", scientific = FALSE)
  return(result)
}

format_percent <- function(x) {
  result <- format(round(x * 100, 1), big.mark = ".", decimal.mark = ",", scientific = FALSE)
  return(result)
}

format_porcent <- function(x) {
  result <- paste0(format(round(x * 100, 1), big.mark = ".", decimal.mark = ",", scientific = FALSE), "%")
  return(result)
}



# 1.8 Funciones de disproporcionalidad ----

alpha <- 0.05 # Nivel de significancia para un 95% CI
z <- qnorm(1 - alpha / 2) # valor crítico z para el nivel de confianza deseado

apply_PRR_C1 <- function(df) {
  var <- as.data.frame(df$data) %>% mutate(s1 = 1 / n11, s2 = 1 / (n1.), s3 = 1 / (n.1 - n11), s4 = 1 / (as.numeric(df$N) - n1.), chi_square = (n11 - ((n1. * n.1) / as.numeric(df$N)))^2 / ((n1. * n.1) / as.numeric(df$N)))
  var <- var %>% mutate(s = sqrt(s1 + s3 - s2 - s4))
  var <- rownames_to_column(var, var = "vac_meddra_term")
  var <- var %>%
    mutate(
      `drug code` = trimws(gsub(" .*", "", vac_meddra_term)),
      `event effect` = trimws(gsub(".* ", "", vac_meddra_term))
    ) %>%
    select(`drug code`, `event effect`, s, chi_square)

  res <- suppressWarnings(PRR(df, RR0 = 1, MIN.n11 = 3, DECISION = 3, RANKSTAT = 1, DECISION.THRES = 0.5))
  signals <- res$SIGNALS
  signals <- merge(signals, var, by = c("drug code", "event effect"), all.x = TRUE)
  signals <- cbind(signals[, c(1, 2, 3, 4, 6, 5)], "LI" = exp(log(signals[6]) - (z * signals$s)), "LS" = exp(log(signals[6]) + (z * signals$s))) # , signals[,c(11)])
  colnames(signals) <- c("cod_vac", "cod_meddra_term", "Observados", "Esperados", "PRR", "Valor p", "PRR LI(95%)", "PRR LS(95%)") # , "Chi-Cuadrado")

  signals$Observados <- format_num(signals$Observados, 0)
  signals$Esperados <- format_num(signals$Esperados, 0)
  signals$PRR <- format_num(signals$PRR, 1)
  signals$`Valor p` <- format_num(signals$`Valor p`, 3)
  signals$`PRR LI(95%)` <- format_num(signals$`PRR LI(95%)`, 1)
  signals$`PRR LS(95%)` <- format_num(signals$`PRR LS(95%)`, 1)
  # signals$`Chi-Cuadrado`<- format_num(signals$`Chi-Cuadrado`,1)

  return(signals)
}

apply_ROR_C1 <- function(df) {
  var <- as.data.frame(df$data) %>% mutate(s1 = 1 / n11, s2 = 1 / (n1.), s3 = 1 / (n.1 - n11), s4 = 1 / (as.numeric(df$N) - n1.), chi_square = (n11 - ((n1. * n.1) / as.numeric(df$N)))^2 / ((n1. * n.1) / as.numeric(df$N)))
  var <- var %>% mutate(s = sqrt(s1 + s3 - s2 - s4))
  var <- rownames_to_column(var, var = "vac_meddra_term")
  var <- var %>%
    mutate(
      `drug code` = trimws(gsub(" .*", "", vac_meddra_term)),
      `event effect` = trimws(gsub(".* ", "", vac_meddra_term))
    ) %>%
    select(`drug code`, `event effect`, s, chi_square)

  res <- suppressWarnings(ROR(df, OR0 = 1, MIN.n11 = 3, DECISION = 3, RANKSTAT = 1, DECISION.THRES = 0.5))
  signals <- res$SIGNALS
  signals <- merge(signals, var, by = c("drug code", "event effect"), all.x = TRUE)
  signals <- cbind(signals[, c(1, 2, 3, 4, 6, 5)], "LI" = exp(log(signals[6]) - (z * signals$s)), "LS" = exp(log(signals[6]) + (z * signals$s))) # , signals[,c(11)])
  colnames(signals) <- c("cod_vac", "cod_meddra_term", "Observados", "Esperados", "ROR", "Valor p", "ROR LI(95%)", "ROR LS(95%)") # , "Chi-Cuadrado")

  signals$Observados <- format_num(signals$Observados, 0)
  signals$Esperados <- format_num(signals$Esperados, 0)
  signals$ROR <- format_num(signals$ROR, 1)
  signals$`Valor p` <- format_num(signals$`Valor p`, 3)
  signals$`ROR LI(95%)` <- format_num(signals$`ROR LI(95%)`, 1)
  signals$`ROR LS(95%)` <- format_num(signals$`ROR LS(95%)`, 1)
  # signals$`Chi-Cuadrado`<- format_num(signals$`Chi-Cuadrado`,1)

  return(signals)
}

apply_BCPNN_E1_C1 <- function(df) {
  res <- suppressWarnings(BCPNN(df, RR0 = 1, MIN.n11 = 3, DECISION = 3, RANKSTAT = 1, DECISION.THRES = 0.5, MC = FALSE, NB.MC = 10000))
  signals <- as.data.frame(res$SIGNALS)
  signals <- signals[, c(1, 2, 3, 4, 6, 5)]
  colnames(signals) <- c("cod_vac", "cod_meddra_term", "Observados", "Esperados", "Razón de prob. Bayes", "Valor p Simulado")

  signals$Observados <- format_num(signals$Observados, 0)
  signals$Esperados <- format_num(signals$Esperados, 0)
  signals$`Razón de prob. Bayes` <- format_num(signals$`Razón de prob. Bayes`, 1)
  signals$`Valor p Simulado` <- format_num(signals$`Valor p Simulado`, 3)

  return(signals)
}

apply_BCPNN_E2_C1 <- function(df) {
  res <- suppressWarnings(BCPNN(df, RR0 = 1, MIN.n11 = 3, DECISION = 3, RANKSTAT = 1, DECISION.THRES = 0.5, MC = TRUE, NB.MC = 10000))
  signals <- as.data.frame(res$SIGNALS)
  signals <- signals[, c(1, 2, 3, 4, 6, 5)]
  colnames(signals) <- c("cod_vac", "cod_meddra_term", "Observados", "Esperados", "Razón de prob. Bayes", "Valor p Simulado")

  signals$Observados <- format_num(signals$Observados, 0)
  signals$Esperados <- format_num(signals$Esperados, 0)
  signals$`Razón de prob. Bayes` <- format_num(signals$`Razón de prob. Bayes`, 1)
  signals$`Valor p Simulado` <- format_num(signals$`Valor p Simulado`, 3)

  return(signals)
}


# 1.9 Dataframes aux disproporcionalidad ----

df_aux_PRR_C1 <- data.frame(
  cod_vac = character(),
  cod_meddra_term = character(),
  Observados = numeric(),
  `Esperados` = numeric(),
  PRR = numeric(),
  `Valor p` = numeric(),
  `PRR LI(95%)` = numeric(),
  `PRR LS(95%)` = numeric(),
  # `Chi-Cuadrado`= numeric(),
  stringsAsFactors = FALSE,
  check.names = FALSE
)

df_aux_ROR_C1 <- data.frame(
  cod_vac = character(),
  cod_meddra_term = character(),
  Observados = numeric(),
  `Esperados` = numeric(),
  ROR = numeric(),
  `Valor p` = numeric(),
  `ROR LI(95%)` = numeric(),
  `ROR LS(95%)` = numeric(),
  # `Chi-Cuadrado`= numeric(),
  stringsAsFactors = FALSE,
  check.names = FALSE
)

df_aux_BCPNN_C1 <- data.frame(
  cod_vac = character(),
  cod_meddra_term = character(),
  Observados = numeric(),
  `Esperados` = numeric(),
  `Razón de prob. Bayes` = numeric(),
  `Valor p Simulado` = numeric(),
  stringsAsFactors = FALSE,
  check.names = FALSE
)


# 1.10 Funciones de generación de kpis ----

f_periodo_box <- function(id_prefix) {
  # prefijo único para cada instancia
  ns <- NS(id_prefix)

  tagList(
    box(
      icon = icon(vIcon_date, class = "kpi-icon"),
      title = tags$div(
        class = "period-tittle",
        tags$span("Período de análisis desde ", inline = TRUE),
        tags$span(textOutput(ns("fecha_ini"), inline = TRUE)),
        tags$span("hasta ", inline = TRUE),
        tags$span(textOutput(ns("fecha_fin"), inline = TRUE))
      ),
      width = 12,
      # status = "info",
      collapsible = TRUE,
      collapsed = TRUE
    )
  )
}



f_dash_kpis_box <- function(id_prefix) {
  # prefijo único para cada instancia
  ns <- NS(id_prefix)

  tagList(
    box(
      tags$div(class = "d-flex align-items-center justify-content-center"),
      icon = icon(vIcon_dadm, class = "kpi-icon"),
      title = tags$span("Dosis administradas", class = "kpi-tittle kpi-header"),
      width = 2,
      background = "blue",
      tags$div(
        class = "kpi-text",
        textOutput(ns("total_dosis")),
      )
    ),
    box(
      tags$div(class = "d-flex align-items-center justify-content-center"),
      icon = icon(vIcon_noti, class = "kpi-icon"),
      title = tags$span("Notificaciones", class = "kpi-tittle"),
      width = 2,
      background = "blue",
      tags$div(
        class = "kpi-text",
        textOutput(ns("total_noti")),
      )
    ),
    box(
      tags$div(class = "d-flex align-items-center justify-content-center"),
      icon = icon(vIcon_rate, class = "kpi-icon"),
      title = tags$span("Tasa de Notificación", class = "kpi-tittle"),
      width = 2,
      background = "yellow",
      tags$div(
        class = "d-flex align-items-center justify-content-center kpi-text",
        tags$span(textOutput(ns("tasa_noti"), inline = TRUE)) # ,
        # tags$span(class = "d-flex h4", "x 1M de D.A.")
      )
    ),
    box(
      tags$div(class = "kpi-tittle"),
      icon = icon(vIcon_noti, class = "kpi-icon"),
      title = tags$span("Graves", class = "kpi-tittle"),
      width = 2,
      background = "red",
      tags$div(
        class = "d-flex align-items-center justify-content-center kpi-text",
        tags$span(textOutput(ns("total_noti_Graves"), inline = TRUE)),
        tags$span(class = "h4", textOutput(ns("porcent_noti_Graves"), inline = TRUE))
      )
    ),
    box(
      tags$div(class = "d-flex align-items-center justify-content-center kpi-tittle"),
      icon = icon(vIcon_noti, class = "kpi-icon"),
      title = tags$span("No graves", class = "kpi-tittle"),
      width = 2,
      background = "green",
      tags$div(
        class = "d-flex align-items-center justify-content-center kpi-text",
        # progressBar(value = textOutput("porcent_noti_Ngraves") ,striped = TRUE, animated = FALSE, status = "warning", size = "xs"),  # vertical = TRUE,label = "10%",
        tags$span(textOutput(ns("total_noti_Ngraves"), inline = TRUE)),
        tags$span(class = "h4", textOutput(ns("porcent_noti_Ngraves"), inline = TRUE))
      )
    ),
    box(
      tags$div(class = "d-flex align-items-center justify-content-center"),
      icon = icon(vIcon_rate, class = "kpi-icon"),
      title = tags$span("Tasa Graves/No graves", class = "kpi-tittle"),
      width = 2,
      background = "yellow",
      tags$div(
        class = "d-flex align-items-center justify-content-center kpi-text",
        tags$span(textOutput(ns("tasa_noti_Graves"), inline = TRUE)),
        tags$span("/", textOutput(ns("tasa_noti_Ngraves"), inline = TRUE))
      )
    )
  )
}


f_general_kpis_box <- function(id_prefix) {
  # prefijo único para cada instancia
  ns <- NS(id_prefix)

  tagList( # red, yellow, aqua, blue, light-blue, green, navy, teal, olive, lime, orange, fuchsia, purple, maroon, black.
    valueBox(
      icon = icon(vIcon_cont, class = "kpi-icon2"),
      value = tags$span(textOutput(ns("total_estados")), class = "kpi-text2"),
      subtitle = "Estados",
      width = 2,
      color = "aqua",
    ),
    valueBox(
      icon = icon(vIcon_dadm, class = "kpi-icon2"),
      value = tags$span(textOutput(ns("total_vacunas")), class = "kpi-text2"),
      subtitle = "D.A. con evento reportado",
      width = 2,
      color = "aqua"
    ),
    valueBox(
      icon = icon(vIcon_hosp, class = "kpi-icon2"),
      value = tags$span(textOutput(ns("total_eventos")), class = "kpi-text2"),
      subtitle = "Eventos",
      width = 2,
      color = "aqua"
    ),
    valueBox(
      icon = icon(vIcon_hosp, class = "kpi-icon2"),
      value = tags$span(textOutput(ns("total_muertes")), class = "kpi-text2"),
      subtitle = "Casos fatales",
      width = 2,
      color = "aqua"
    ),
    valueBox(
      icon = icon(vIcon_hosp, class = "kpi-icon2"),
      value = tags$span(textOutput(ns("total_embarazadas")), class = "kpi-text2"),
      subtitle = "Embarazadas",
      width = 2,
      color = "aqua"
    ),
    valueBox(
      icon = icon(vIcon_hosp, class = "kpi-icon2"),
      value = tags$span(textOutput(ns("total_menores")), class = "kpi-text2"),
      subtitle = "Menores de 18 años",
      width = 2,
      color = "aqua"
    )
  )
}


f_vacunas_kpis_box <- function(id_prefix) {
  # prefijo único para cada instancia
  ns <- NS(id_prefix)

  tagList( # red, yellow, aqua, blue, light-blue, green, navy, teal, aqua, lime, orange, fuchsia, purple, maroon, black.
    valueBox(
      icon = icon(vIcon_dadm, class = "kpi-icon2"),
      value = tags$span(textOutput(ns("total_vacunas")), class = "kpi-text2"),
      subtitle = "D.A. con evento reportado",
      width = 2,
      color = "aqua",
    ),
    valueBox(
      icon = icon(vIcon_dadm, class = "kpi-icon2"),
      value = tags$span(textOutput(ns("total_tipos_vacuna")), class = "kpi-text2"),
      subtitle = "Vacunas",
      width = 2,
      color = "aqua"
    ),
    valueBox(
      icon = icon(vIcon_dadm, class = "kpi-icon2"),
      value = tags$span(textOutput(ns("total_1_dosis")), class = "kpi-text2"),
      subtitle = "1° dosis",
      width = 2,
      color = "aqua"
    ),
    valueBox(
      icon = icon(vIcon_dadm, class = "kpi-icon2"),
      value = tags$span(textOutput(ns("total_2_dosis")), class = "kpi-text2"),
      subtitle = "2° dosis",
      width = 2,
      color = "aqua"
    ),
    valueBox(
      icon = icon(vIcon_dadm, class = "kpi-icon2"),
      value = tags$span(textOutput(ns("total_3_dosis")), class = "kpi-text2"),
      subtitle = "3° dosis",
      width = 2,
      color = "aqua"
    ),
    valueBox(
      icon = icon(vIcon_dadm, class = "kpi-icon2"),
      value = tags$span(textOutput(ns("total_otras_dosis")), class = "kpi-text2"),
      subtitle = "Otras dosis",
      width = 2,
      color = "aqua"
    )
  )
}


f_eventos_kpis_box <- function(id_prefix) {
  # prefijo único para cada instancia
  ns <- NS(id_prefix)

  tagList( # red, yellow, aqua, blue, light-blue, green, navy, teal, olive, lime, orange, fuchsia, purple, maroon, black.
    valueBox(
      icon = icon(vIcon_esav, class = "kpi-icon2"),
      value = tags$span(textOutput(ns("total_eventos")), class = "kpi-text2"),
      subtitle = "Eventos",
      width = 2,
      color = "light-blue",
    ),
    valueBox(
      icon = icon(vIcon_esav, class = "kpi-icon2"),
      value = tags$span(textOutput(ns("total_pts")), class = "kpi-text2"),
      subtitle = "MedDRA PT",
      width = 2,
      color = "light-blue"
    ),
    valueBox(
      icon = icon(vIcon_esav, class = "kpi-icon2"),
      value = tags$span(textOutput(ns("total_hlts")), class = "kpi-text2"),
      subtitle = "MedDRA HLT",
      width = 2,
      color = "light-blue"
    ),
    valueBox(
      icon = icon(vIcon_esav, class = "kpi-icon2"),
      value = tags$span(textOutput(ns("total_hlgts")), class = "kpi-text2"),
      subtitle = "MedDRA HLGT",
      width = 2,
      color = "light-blue"
    ),
    valueBox(
      icon = icon(vIcon_esav, class = "kpi-icon2"),
      value = tags$span(textOutput(ns("total_socs")), class = "kpi-text2"),
      subtitle = "MedDRA SOC",
      width = 2,
      color = "light-blue"
    ),
    valueBox(
      icon = icon(vIcon_esav, class = "kpi-icon2"),
      value = tags$span(textOutput(ns("total_smqs")), class = "kpi-text2"),
      subtitle = "MedDRA SMQ",
      width = 2,
      color = "light-blue"
    )
  )
}



# ---------------------------------------------------------------------------- -
# 2. Carga de datos ----
# ---------------------------------------------------------------------------- -

# 2.1 Path de datos ----

# Configurar directorio de trabajo de forma compatible
if (interactive() && requireNamespace("rstudioapi", quietly = TRUE)) {
  # Si estamos en RStudio
  tryCatch(
    {
      setwd(dirname(rstudioapi::getActiveDocumentContext()$path))
    },
    error = function(e) {
      # Si falla, usar directorio actual
      cat("Advertencia: No se pudo establecer directorio desde RStudio. Usando directorio actual.\n")
    }
  )
} else {
  # Si no estamos en RStudio, el directorio ya debería estar configurado
  # por el script de ejecución
  cat("Usando directorio de trabajo actual:", getwd(), "\n")
}

path_datos <- "datos/"


# 2.2 Función de carga de datos ----

load_data <- function() {
  cat("Cargando archivos de datos...\n")

  # Verificar archivos requeridos
  archivos_requeridos <- c(
    paste0(path_datos, "datos_procesados.rds"),
    paste0(path_datos, "dosis_admin.rds"),
    paste0(path_datos, "geo_datos.rds"),
    paste0(path_datos, "timeline.csv")
  )

  archivos_faltantes <- archivos_requeridos[!file.exists(archivos_requeridos)]

  if (length(archivos_faltantes) > 0) {
    cat("ERROR: Los siguientes archivos de datos no se encuentran:\n")
    for (archivo in archivos_faltantes) {
      cat("  -", archivo, "\n")
    }
    stop("No se pueden cargar los datos. Por favor, asegúrate de que todos los archivos de datos estén disponibles en la carpeta 'datos/'.")
  }

  # Cargar datos
  cat("Cargando datos principales...\n")
  datos <- readRDS(paste0(path_datos, "datos_procesados.rds"))

  cat("Cargando datos de dosis...\n")
  dosis <- readRDS(paste0(path_datos, "dosis_admin.rds"))

  cat("Cargando datos geográficos...\n")
  geodt <- readRDS(paste0(path_datos, "geo_datos.rds"))

  cat("Cargando timeline...\n")
  timeline_data <- fread(paste0(path_datos, "timeline.csv"), colClasses = list(
    character = c("titulo", "descripcion", "imagen"),
    Date = "fecha",
    integer = "anio"
  ))

  cat("Datos cargados exitosamente.\n")
  return(list(datos = datos, dosis = dosis, geodt = geodt, timeline_data = timeline_data))
}


# 2.3 Cargar datos globalmente ----

datos_cargados <- load_data()

# Carga datos de georreferencia

geodatos_global <- datos_cargados$geodt
geodatos_global <- geodatos_global[["geo_data_pais"]]

# Verificar si los datos geográficos tienen la estructura esperada
if (!is.null(geodatos_global) &&
  "ISO_3DIGIT" %in% names(geodatos_global) &&
  nrow(geodatos_global) > 0) {
  # Los datos actuales solo contienen información del país, no regiones
  # Si se necesitan datos geográficos detallados, se deben proporcionar
  cat("Datos geográficos cargados: país", geodatos_global$NAME[1], "\n")
} else {
  # Si no hay datos geográficos válidos, crear un placeholder
  geodatos_global <- NULL
  cat("Advertencia: No se encontraron datos geográficos válidos\n")
}


# Carga datos de ESAVI

datos_global <- datos_cargados$datos

# Carga datos de DA

dosis_global <- datos_cargados$dosis

# Carga datos de time line

timeline_data <- datos_cargados$timeline_data


rm(datos_cargados)
gc(reset = TRUE)




# ---------------------------------------------------------------------------- -
# 3. Filtros de la App ----
# ---------------------------------------------------------------------------- -

# 3.1 Definir la configuración de los filtros ----

filtros_config <- list(
  flt_anio        = list(id = "anio_filter", label = "Año de notificación", columna = "añoNoti"),
  flt_periodo     = list(id = "periodo_filter", label = "Periodo de notificación", columna = "periodoNoti"),
  # flt_semEpi      = list(id = "semEpi_filter",      label = "Semana epidemiolica", columna = "semEpiNoti"),
  # flt_ge          = list(id = "ge_filter",          label = "Grupo etario",        columna = "grupo_etario"),
  # flt_ge_menores  = list(id = "gem_filter",         label = "Grupo etario menores",columna = "grupo_etario_menores"),
  # flt_sexo        = list(id = "sexo_filter",        label = "Sexo",                columna = "sexo"),
  # flt_estado      = list(id = "estado_filter", label = "Estado", columna = "estadoNotificacao"), # Columna no disponible
  flt_grave       = list(id = "grave_filter", label = "Gravedad", columna = "marca_grave"),
  flt_desenlace   = list(id = "desenlace_filter", label = "Desenlace", columna = "desenesv"),
  flt_muerte      = list(id = "muerte_filter", label = "Muertes", columna = "marca_muerte"),
  flt_menores     = list(id = "menores_filter", label = "Menores de edad", columna = "marca_menores"),
  flt_embarazadas = list(id = "embarazadas_filter", label = "Mujeres embarazadas", columna = "marca_embarazo")

  # flt_municipio   = list(id = "numicipio_filter",   label = "Municipio",           columna = "municipioNotificacao"),

  # flt_vacuna      = list(id = "vacuna_filter",      label = "Vacuna",              columna = "nomcomv"),
  # flt_fabricante  = list(id = "fabricante_filter",  label = "Fabricante vacuna",   columna = "nomfabri"),
  # flt_dosisVac    = list(id = "dosisVac_filter",    label = "Dosis vacuna",        columna = "doseImunobiologico")

  # flt_soc         = list(id = "soc_filter",         label = "SOC MedDRA",          columna = "soc"),
  # flt_hlgt        = list(id = "hlgt_filter",        label = "HLGT MedDRA",         columna = "hlgt"),
  # flt_hlt         = list(id = "hlt_filter",         label = "HLT MedDRA",          columna = "hlt"),
  # flt_pt          = list(id = "pt_filter",          label = "PT MedDRA",           columna = "pt"),
  # flt_llt         = list(id = "llt_filter",         label = "LLT MedDRA",          columna = "MedDRA LLT"),
  # flt_smq         = list(id = "smq_filter",         label = "SMQ",                 columna = "smq"),
)
