# -------------------------------------------------------------------------------------------------------------- -
# Script: ui.R ----
# Version: 1.0
# Pais: País
# Epidemiologo: Analía Cáceres | caceresanali@paho.org
# Científico de Datos: Carlos Falla | fallacar@paho.org
# Date: 2025-06-30
# Descripcion: define la interface de usuario (ui) de la aplicacion
# -------------------------------------------------------------------------------------------------------------- -


# -------------------------------------------------------------------------------------------------------------- -
# 1. Carga de datos del global ----
# -------------------------------------------------------------------------------------------------------------- -

source("global.R") # Cargar datos y variables globales
library(TTR)


# -------------------------------------------------------------------------------------------------------------- -
# 2. UI ----
# -------------------------------------------------------------------------------------------------------------- -

ui <- dashboardPage(


  # 2.1 Definición del tema -------------------------------------------------------------------------------------
  preloader = list(html = tagList(spin_6(), "Cargando ..."), color = "#3c8dbc"),
  freshTheme = create_theme(
    adminlte_color(
      light_blue = vColor1,
      # define colores para libreria shinydashboardplus
      black = vColor25,
      purple = vColor24,
      navy = vColor11,
      fuchsia = vColor2,
      maroon = vColor12,
      lime = vColor16
    ),
    adminlte_sidebar(
      dark_bg = vColor21, # "#64A9BE",
      dark_hover_bg = vColor1,
      dark_color = vColor15 # "#2E3440"
    ),
    adminlte_global(
      content_bg = "#FFF",
      box_bg = "#FFF", # D8DEE9",
      info_box_bg = "#FFF" # "#D8DEE9"
    )
  ),

  # options = list(sidebarExpandOnHover = TRUE),


  # 2.2 Title App ------------------------------------------------------------------------------------------------

  title = "PAHO - Monitoreo de ESAVI en Ecuador",


  # 2.3 Header ---------------------------------------------------------------------------------------------------

  dashboardHeader(
    title = tags$div(
      id = "dynamic-header",
      tags$a(
        href = "https://www.salud.gob.ec/",
        target = "_blank",
        class = "navbar-brand",
        tags$img(src = "images/logoMSP.png", style = "width:25%;; margin-right: 15px;"),
        HTML("<h5>Ministerio de Salud Pública del Ecuador</h5>")
      )
    ),

    # title = tags$img(src = 'images/logoPAHO.png',style = "width:100%;"),

    leftUi = tagList(
      tags$head(
        tags$script(src = "js/leaflet-easyPrint.js"),
        if (kc_enabled) tagList(
          # 1. Configuración de Keycloak (leída desde variables de entorno en R)
          tags$script(HTML(sprintf(
            'window.KEYCLOAK_CONFIG={url:"%s",realm:"%s",clientId:"%s",requiredRole:"%s"};',
            kc_url, kc_realm, kc_client, kc_role
          ))),
          # 2. Adapter JS oficial de Keycloak (servido por el propio servidor Keycloak)
          tags$script(src = paste0(kc_url, "/js/keycloak.js")),
          # 3. Lógica de autenticación de la app
          tags$script(src = "js/keycloak-auth.js")
        )
      ),
      tags$a(
        class = "app_title",
        "Sistema de monitoreo de ESAVI en Ecuador"
      )
    )
  ),


  # 2.4 Sidebar -------------------------------------------------------------------------------------------------

  dashboardSidebar(
    minified = TRUE,
    collapsed = TRUE,
    sidebarMenu(
      menuItem("Ir a Integra App", icon = icon("external-link-alt", class = "menu-icon"), href = integra_app_url, newtab = TRUE),
      br(),
      menuItem("Inicio", tabName = "home", icon = icon(vIcon_home, class = "menu-icon")),
      menuItem("Introducción", tabName = "intro", icon = icon(vIcon_intr, class = "menu-icon")),
      # menuItem("Contenido", tabName = "content", icon = icon(vIcon_cont, class = "menu-icon")),
      # menuItem("Metodología", tabName = "metodology", icon = icon(vIcon_meth, class = "menu-icon")),
      # menuItem("Dashboard", tabName = "dashboard", icon = icon(vIcon_kpis, class = "menu-icon")),
      menuItem("Análisis descriptivo", tabName = "descriptive", icon = icon(vIcon_desc, class = "menu-icon")),
      menuItem("Análisis por vacunas", tabName = "vaccines", icon = icon(vIcon_vacc, class = "menu-icon")),
      menuItem("Análisis por eventos", tabName = "esavi", icon = icon(vIcon_esav, class = "menu-icon")), # ,
      #menuSubItem("Eventos parte 2", tabName = "esavi2", icon = icon(vIcon_line, class = "menu-icon"))
      # ),
      menuItem("Detección de señales", tabName = "senales", icon = icon(vIcon_senl, class = "menu-icon")),
      menuItem("Acerca de", tabName = "about", icon = icon(vIcon_abou, class = "menu-icon")) # ,
      # menuItem("Antecedentes", tabName = "antecedentes", icon = icon(vIcon_antc, class = "menu-icon"))#,
      # menuItem("Pruebas", tabName = "test", icon = icon(vIcon_test, class = "menu-icon"))
    )
  ),


  # 2.5 Body ----------------------------------------------------------------------------------------------------

  dashboardBody(
    useShinyjs(),

    # 2.5.0 Enlaza hoja de estilos ------------------------------------------------------------------------------

    # Enlazar archivo CSS externo desde la carpeta www y los js
    tags$head(
      tags$link(rel = "stylesheet", type = "text/css", href = "css/style.css"),
      tags$script(src = "js/tab-scroll.js")
    ),
    tabItems(

      # 2.5.1 Tab Home ------------------------------------------------------------------------------------------
      tabItem(
        tabName = "home",
        tags$div(
          class = "home-section",
          style = "position: relative; min-height: 500px;",
          # Contenedor superior con texto
          tags$div(
            style = "position: relative; z-index: 1; background-color: rgba(255, 255, 255, 0.85); padding: 20px; border-radius: 5px;",
            tags$h1("Tablero de análisis de los ESAVI posterior a la vacunación contra la COVID-19"),
            tags$h2("Equipo de vigilancia Seguridad de Vacunas - PAHO."),
            tags$br(),
            tags$br(),
            tags$br(),
            tags$div(
              class = "home-text-title",
              style = "color: black;",
              tags$h4(
                tags$ul(
                  tags$li(uiOutput("fecha_actualizacion_ui", inline = TRUE)),
                  HTML("<br>"),
                  tags$li(HTML("<strong>País:</strong> Ecuador")),
                  HTML("<br>"),
                  tags$li(HTML("<strong>Institución responsable de la información:</strong> Ministerio de Salud Pública de Ecuador")),
                  HTML("<br>")
                )
              )
            )
          ),
          # Imagen en el cuadrante inferior derecho - ahora en primer plano con mayor z-index
          tags$div(
            style = "position: absolute; bottom: 20px; right: 20px; width: 40%; height: 40%; display: flex; align-items: center; justify-content: center; z-index: 10;",
            tags$img(src = "images/escudo_ecuador.png", style = "max-width: 100%; max-height: 100%; opacity: 1;")
          )
        )
      ),


      # 2.5.2 Tab Intro -----------------------------------------------------------------------------------------

      tabItem(
        tabName = "intro",
        tags$div(
          class = "intro-section",
          h1("Introducción"),
        ),
        tags$div(
          class = "text-title",
          br(),
          h2("Objetivo"),
          br(),
          h4("Presentar los resultados del análisis exploratorio y el proceso de detección de señales de los datos suministrados por el país a través de la plataforma Integra-ESAVI, para el monitoreo de ESAVI en las regiones del país, desde la introducción de las vacunas contra la COVID-19."),
          br(),
          h2("Información"),
          br(),
          h4("La información presentada en esta aplicación es el resultado del procesamiento y análisis avanzado de datos, realizado por el equipo de Vacunación Segura de la OPS, a partir de los casos de ESAVI anonimizados proporcionados por el Ministerio de Salud Pública (MSP) de Ecuador."),
          br(),
          h2("Antecedentes"),
          br(),
          h4("En cumplimiento de su responsabilidad de liderar iniciativas que apoyen a los países de la región de las Américas en garantizar el impacto de las vacunas como intervenciones altamente efectivas y seguras para reducir los efectos de la pandemia de COVID-19, y en ejecución de la recomendación emitida el 16 de noviembre de 2020 por el Comité Técnico Asesor (TAG, por sus siglas en inglés) sobre Inmunizaciones, se estableció el Comité Regional de Seguridad de Vacunas, así como el Sistema Regional para el Monitoreo de la Seguridad de las Vacunas contra la COVID-19 como herramienta para la generación de información. En este contexto, el 17 de septiembre de 2021 se llevó a cabo la primera reunión del comité y el primer análisis de los datos disponibles en el repositorio regional."),
          br(),
          h2("Contexto"),
          br(),
          h4(HTML("La magnitud del esfuerzo de vacunación contra la COVID-19 en la región de las Américas ha requerido la implementación de <strong>sistemas de información sólidos y confiables</strong>, capaces de detectar oportunamente posibles riesgos para la salud pública asociados a las vacunas.
                                <br><br>
                                Aunque existe un cuerpo de evidencia sustancial que respalda la <strong>efectividad y seguridad</strong> de la mayoría de las vacunas contra la COVID-19, aún es necesario <strong>generar conocimiento adicional</strong> que permita responder preguntas clave, como:
                                <br><br>
                                <li> El impacto de las vacunas a mediano y largo plazo,
                                <li> El efecto de los cambios en los esquemas de vacunación adoptados por los países,
                                <li> La aparición de eventos adversos poco frecuentes pero potencialmente graves, fatales o con riesgo de discapacidad severa o permanente.
                                <br><br>
                                Asimismo, se requiere <strong>vigilar cómo la evolución del SARS-CoV-2</strong> puede influir en el perfil de seguridad de las vacunas.
                                <br><br>
                                En respuesta a estas necesidades, se desarrolló el <strong>Sistema Regional para el Monitoreo de Eventos Adversos Posterior a la Vacunación (EAPV)</strong>, concebido como una fuente de información regional que facilite la <strong>detección temprana de riesgos no previamente identificados</strong>, mediante la integración de datos provenientes de distintos países.
                                <br><br>
                                Los análisis, hipótesis y conclusiones que puedan derivarse de esta información dependerán en gran medida de la <strong>calidad y representatividad de los datos aportados por cada país</strong>. En este contexto, <strong>Ecuador</strong> desempeña un papel clave, ya que su contribución representa una parte sustancial de la información consolidada a nivel regional.
                                <br><br>
                                Por ello, resulta fundamental <strong>establecer un plan nacional para el análisis de la información sobre ESAVI</strong>, que permita preparar, depurar y validar los datos disponibles, garantizando su <strong>utilidad y confiabilidad</strong> tanto para el país como para el monitoreo regional.")),
          br(),
          h2("Acuerdos"),
          br(),
          h4(HTML("Gracias a un <strong>convenio de interoperabilidad</strong> establecido con la <strong>Organización Panamericana de la Salud (OPS)</strong>, es posible acceder a la información sobre los casos de <strong>ESAVI</strong> reportados en la plataforma <strong>Integra-ESAVI</strong>, especialmente aquellos relacionados con la <strong>vacunación contra la COVID-19 a partir del 1 de enero de 2021</strong>.
                                <br><br>
                                Esta fuente proporciona <strong>datos individuales anonimizados</strong>, que incluyen información detallada sobre las <strong>características del caso</strong>, la <strong>persona vacunada</strong>, la <strong>vacuna administrada</strong>, el <strong>evento adverso reportado</strong>, así como los <strong>diagnósticos y hallazgos del proceso de investigación</strong> asociado al ESAVI.")),
        )
      ),

      # 2.5.3 Tab Content ---------------------------------------------------------------------------------------

      tabItem(
        tabName = "content",
        div(
          class = "intro-section",
          h1("Contenido"),
        ),
        div(
          class = "text-title",
          h2("Contenido"),
          br(),
          h4("La presente aplicación tiene como objetivo central facilitar el análisis exploratorio de los Eventos Supuestamente Atribuibles a la Vacunación
                       o Inmunización (ESAVI) notificados en Ecuador, posterior a la vacunación contra la COVID-19. A continuación, se describe el contenido de cada una
                       de las secciones del tablero:"),
          br(),
          h4(
            tagList(icon(vIcon_home), tags$strong("Inicio:")),
            HTML("<br><br>
                            Sección de bienvenida que presenta el propósito general del tablero, el país analizado (Ecuador), los responsables del análisis y la fecha más reciente de actualización. También se identifican las instituciones proveedoras de datos y los consultores técnicos involucrados.
                          ")
          ),
          br(),
          h4(
            tagList(icon(vIcon_intr), tags$strong("Introducción:")),
            HTML("<br><br>
                            Brinda el contexto técnico y epidemiológico del análisis, incluyendo los antecedentes regionales e institucionales que dieron origen al monitoreo de ESAVI, el objetivo del tablero y el marco de cooperación entre Ecuador y la Organización Panamericana de la Salud (OPS).
                          ")
          ),
          br(),
          h4(
            tagList(icon(vIcon_meth), tags$strong("Metodología:")),
            HTML("<br><br>
                            Describe la metodología general del análisis, incluyendo las variables consideradas (edad, sexo, localización geográfica), los criterios de limpieza y categorización de datos, y el cálculo de tasas de notificación por dosis administradas. Se mencionan los métodos de detección de señales.
                          ")
          ),
          br(),
          h4(
            tagList(icon(vIcon_kpis), tags$strong("Dashboard:")),
            HTML("<br><br>
                            Proporciona una visión integral del comportamiento de los ESAVI en el tiempo, con indicadores clave (KPIs), líneas de tiempo con hitos del proceso de vacunación en Ecuador, y gráficos que permiten explorar la distribución de eventos según sexo, semana epidemiológica, región, gravedad y términos clínicos.
                          ")
          ),
          br(),
          h4(
            tagList(icon(vIcon_desc), tags$strong("Análisis descriptivo:")),
            HTML("<br><br>
                            Presenta un análisis detallado de los eventos notificados, segmentados por características demográficas y temporales. Permite observar patrones de notificación por sexo, grupo etario, gravedad del evento, así como su distribución geográfica y evolución en el tiempo.
                          ")
          ),
          br(),
          h4(
            tagList(icon(vIcon_vacc), tags$strong("Análisis por vacuna:")),
            HTML("<br><br>
                            Examina la distribución de ESAVI según el tipo de vacuna administrada, con desagregaciones por sexo, edad, dosis aplicada, gravedad del evento y lote vacunal. Se utilizan visualizaciones como gráficos de Pareto, mapas y series temporales para facilitar la interpretación comparativa entre biológicos.
                          ")
          ),
          br(),
          h4(
            tagList(icon(vIcon_esav), tags$strong("Análisis por evento:")),
            HTML("<br><br>
                            Explora los ESAVI reportados usando la terminología MedDRA, permitiendo su análisis por términos preferentes (PT), grupos de nivel alto (HLGT) y sistemas de órganos (SOC). Incluye análisis cruzados con variables como sexo, edad, tipo de vacuna y gravedad, presentados mediante treemaps, diagramas de Sankey y mapas de calor.
                          ")
          ),
          br(),
          h4(
            tagList(icon(vIcon_senl), tags$strong("Análisis de detección de señales:")),
            HTML("<br><br>
                            Ofrece herramientas estadísticas para la identificación de posibles señales de seguridad, mediante técnicas de análisis de desproporcionalidad (PRR, ROR, BCPNN). El usuario puede aplicar filtros por vacuna y nivel de análisis (PT, SMQ, CMQ) para detectar posibles asociaciones inusuales entre vacunas y eventos.
                          ")
          ),
          br(),
          h4(
            tagList(icon(vIcon_abou), tags$strong("Acerca de:")),
            HTML("<br><br>
                            Sección informativa sobre la aplicación, donde se detallan los lenguajes, tecnologías y enfoques metodológicos empleados en su desarrollo. También se describe el origen de los datos y se presenta al equipo técnico responsable.
                          ")
          ),
        )
      ),


      # 2.5.4 Tab Metodología ---------------------------------------------------------------------------------------

      tabItem(
        tabName = "metodology",
        div(
          class = "intro-section",
          h1("Metodología"),
        ),
        div(
          class = "text-title",
          h2("Metodología"),
          br(),
          h4(HTML(
            "El presente tablero integra datos anonimizados de Eventos Supuestamente Atribuibles a la Vacunación o Inmunización (ESAVI) reportados en Ecuador, provenientes de la plataforma Integra-ESAVI. La información comprende notificaciones realizadas desde el inicio de la campaña de vacunación contra COVID-19, incluyendo datos demográficos, clínicos, características de la vacunación y clasificación de los eventos.
                      <br><br><br>
                      Los datos fueron sometidos a un proceso de normalización, limpieza y estructuración para garantizar la consistencia en el análisis. Se realizó una validación de fechas, eliminación de duplicados e implementación de un sistema de categorización uniforme para variables clave como grupo etario, gravedad de los eventos y clasificación de los términos médicos según el estándar MedDRA (Medical Dictionary for Regulatory Activities)."
          )),
          br(),
          h2("Análisis descriptivo multidimensional"),
          br(),
          h4(
            tags$strong("1. Caracterización demográfica:"),
            HTML("<br><br>
                            Distribución por sexo y grupo etario, con visualizaciones específicas como pirámides poblacionales y gráficos de densidad que permiten identificar patrones diferenciales en la incidencia de ESAVI.
                          "),
            br(),
            br(),
            br(),
            tags$strong("2. Distribución geográfica:"),
            HTML("<br><br>
                            Análisis de la distribución espacial de casos mediante mapas interactivos con sistemas de georreferenciación, empleando técnicas de categorización por cuantiles para una visualización efectiva de las variaciones regionales.
                          "),
            br(),
            br(),
            br(),
            tags$strong("3. Caracterización clínica:"),
            HTML("<br><br>
                            Clasificación de eventos según su gravedad (graves/no graves) y análisis de términos MedDRA en diferentes niveles jerárquicos (SOC, HLGT, HLT, PT), permitiendo una aproximación tanto general como específica a los fenómenos clínicos.
                          "),
            br(),
            br(),
            br(),
            tags$strong("4. Caracterización vacunal:"),
            HTML("<br><br>
                            Distribución de eventos por tipo de vacuna, número de dosis y tiempo transcurrido entre la administración y el inicio de síntomas.
                          ")
          ),
          br(),
          h2("Análisis temporales y de tendencias"),
          br(),
          h4(
            tags$strong("1. Series temporales estratificadas:"),
            HTML("<br><br>
                            Visualización de tendencias mediante gráficos de línea para seguir la evolución de casos por semana epidemiológica, con estratificación por variables clave (sexo, gravedad, tipo de vacuna).
                          "),
            br(),
            br(),
            br(),
            tags$strong("2. Análisis de variación:"),
            HTML("<br><br>
                            Cálculo de tasas de cambio porcentuales entre períodos consecutivos para identificar incrementos o decrementos significativos en la notificación de eventos.
                          "),
            br(),
            br(),
            br(),
            tags$strong("3. Contextualización temporal:"),
            HTML("<br><br>
                            Integración de una línea de tiempo con hitos relevantes de la campaña de vacunación para facilitar la interpretación de los hallazgos en su contexto histórico.
                          ")
          ),
          br(),
          h2("Cálculo e interpretación de tasas de notificación"),
          br(),
          h4(
            HTML(
              "Las tasas de notificación se calculan como la relación entre el número de ESAVI reportados y el número de dosis administradas, multiplicado por un factor constante (generalmente por 1.000.000) para facilitar su interpretación. Este método permite:"
            ),
            br(),
            br(),
            br(),
            tags$strong("1. Normalización por exposición:"),
            HTML("<br><br>
                            Ajuste de la frecuencia de eventos por el volumen de vacunación, permitiendo comparaciones más equitativas entre diferentes períodos o grupos.
                          "),
            br(),
            br(),
            br(),
            tags$strong("2. Seguimiento temporal:"),
            HTML("<br><br>
                            Monitoreo de los cambios en las tasas a lo largo del tiempo como indicador de la seguridad vacunal y la eficiencia del sistema de farmacovigilancia.
                          ")
          ),
          br(),
          h2("Análisis de desproporcionalidad para detección de señales"),
          br(),
          h4(
            HTML(
              "El tablero implementa métodos estadísticos de análisis de desproporcionalidad para la detección de posibles señales de seguridad, incluyendo:"
            ),
            br(),
            br(),
            br(),
            tags$strong("1. Razón de Notificación Proporcional (PRR):"),
            HTML("<br><br>
                            Compara la proporción de un evento específico entre las notificaciones asociadas a una vacuna determinada versus la proporción del mismo evento entre todas las demás vacunas.
                          "),
            br(),
            br(),
            br(),
            tags$strong("2. Razón de Probabilidades de Notificación (ROR):"),
            HTML("<br><br>
                            Estima la razón de probabilidades de que un evento específico sea reportado con una determinada vacuna en comparación con otras vacunas.
                          "),
            br(),
            br(),
            br(),
            tags$strong("3. Red Neuronal de Propagación de Confianza Bayesiana (BCPNN):"),
            HTML("<br><br>
                            Implementa un enfoque bayesiano para calcular componentes de información que reflejan la fuerza de las asociaciones entre vacunas y eventos, con dos aproximaciones:
                            <br><br>
                            <li> Aproximación Normal: Utiliza la distribución normal para estimar intervalos de confianza.
                            <li> Aproximación Monte Carlo: Emplea simulaciones para obtener distribuciones empíricas y estimaciones más robustas en casos de datos limitados.
                          "),
            br(),
            br(),
            br(),
            tags$strong("4. Criterios de señalización:"),
            HTML("<br><br>
                            Se establecen umbrales estadísticos para identificar posibles señales, generalmente definidos por valores de PRR/ROR > 1 con intervalo inferior de confianza > 1, y número mínimo de casos ≥ 3.
                          ")
          ),
          br(),
          h2("Técnicas de visualización avanzada"),
          br(),
          h4(
            HTML(
              "El tablero emplea técnicas de visualización avanzada para facilitar la interpretación de patrones complejos:"
            ),
            br(),
            br(),
            br(),
            tags$strong("1. Gráficos de calor (heatmaps):"),
            HTML("<br><br>
                            Utilizados para representar la intensidad de asociación entre variables categóricas, como eventos por grupo etario o vacunas por dosis.
                          "),
            br(),
            br(),
            br(),
            tags$strong("2. Diagramas Sankey:"),
            HTML("<br><br>
                            Visualización de flujos para representar relaciones complejas entre múltiples variables (vacuna → evento → desenlace).
                          "),
            br(),
            br(),
            br(),
            tags$strong("3. Treemaps:"),
            HTML("<br><br>
                            Representación jerárquica de datos anidados, especialmente útil para visualizar la estructura de términos MedDRA.
                          "),
            br(),
            br(),
            br(),
            tags$strong("4. Gráficos de burbujas:"),
            HTML("<br><br>
                            Representación multidimensional que permite visualizar simultáneamente la frecuencia y la distribución de eventos por diferentes categorías.
                          "),
            br(),
            br(),
            br(),
            tags$strong("5. Métodos de agrupamiento dinámicos:"),
            HTML("<br><br>
                             Implementación de técnicas de binning adaptativo y categorización por cuantiles para optimizar la visualización de datos con distribuciones heterogéneas.
                          ")
          ),
          br(),
          h2("Filtrado interactivo y análisis dinámico"),
          br(),
          h4(
            HTML(
              "El diseño del tablero permite un análisis dinámico mediante sistemas de filtrado interactivo que facilitan:"
            ),
            br(),
            br(),
            br(),
            tags$strong("1. Segmentación flexible:"),
            HTML("<br><br>
                            Posibilidad de analizar subconjuntos específicos de datos según criterios temporales, demográficos, clínicos o vacunales.
                          "),
            br(),
            br(),
            br(),
            tags$strong("2. Análisis condicional:"),
            HTML("<br><br>
                            Examinar la distribución de variables en el contexto de determinadas condiciones o filtros.
                          "),
            br(),
            br(),
            br(),
            tags$strong("3. Detección de patrones emergentes:"),
            HTML("<br><br>
                            Capacidad para identificar tendencias o asociaciones que pueden manifestarse únicamente en determinados subgrupos o bajo condiciones específicas.
                          ")
          ),
          br(),
          h2("Conclusión"),
          br(),
          h4(HTML(
            "Esta metodología integral permite un análisis exhaustivo y multidimensional de los datos de ESAVI, facilitando tanto la vigilancia rutinaria como la investigación de fenómenos específicos relacionados con la seguridad de las vacunas contra COVID-19 en Ecuador."
          )),
        )
      ),



      # 2.5.5 Tab Dashboard -------------------------------------------------------------------------------------- ----

      tabItem(
        tabName = "dashboar",

        # .. 4.a Encabezado ----

        fluidRow(
          f_periodo_box("tab_dash")
        ),

        # .. 4.b KPIs ----

        fluidRow(
          f_dash_kpis_box("tab_dash")
        ),

        # .. 4.c Sub KPIs ----

        fluidRow(
          f_general_kpis_box("tab_dash_gen")
        ),

        # .. 4.d Timeline ----

        column(
          width = 3,
          box(
            title = tags$div(
              class = "period-tittle",
              tags$span("Timeline vacunación por COVID-19"), inline = TRUE
            ),
            # title = "Timeline vacunación por COVID-19",
            # status = "info",
            width = 12,
            closable = FALSE,
            # status = "info",
            headerBorder = TRUE,
            solidHeader = FALSE,
            collapsible = TRUE,
            # collapsed = FALSE,
            # background = "gray",
            # headerBorder = FALSE,

            uiOutput("timeline_ui")
          ),
        ),

        # .. 4.e Gráficos ----

        column(
          width = 9,

          # .. 4.d.0 KPIs Generales ----

          fluidRow(
            box(
              title = tags$div(
                class = "period-tittle",
                tags$span("Distribución de Dosis administradas y Notificaciones de ESAVI (totales/graves/no graves) por sexo"), inline = TRUE
              ),
              width = 12,
              closable = FALSE,
              # status = "info",
              headerBorder = FALSE,
              solidHeader = FALSE,
              collapsible = TRUE,
              collapsed = FALSE,

              # .. 4.d.1 Pie x sexo Dosis ----

              box( # class = "transparent-box",#"custom-border",
                # title = tags$p("Dosis por sexo", class = "kpi-tittle"),
                width = 3,
                closable = FALSE,
                # status = "info",
                headerBorder = FALSE,
                solidHeader = FALSE,
                collapsible = FALSE,
                # collapsed = FALSE,
                # background = "gray",
                # headerBorder = FALSE,
                highchartOutput("dosis_x_genero", height = "170px")
              ),

              # .. 4.d.2 Pie x sexo Notif ----

              box( # class = "transparent-box",#"custom-border",
                # title = tags$p("Dosis por sexo", class = "kpi-tittle"),
                width = 3,
                closable = FALSE,
                # status = "info",
                headerBorder = FALSE,
                solidHeader = FALSE,
                collapsible = FALSE,
                # collapsed = FALSE,
                # background = "gray",
                # headerBorder = FALSE,
                highchartOutput("notif_x_genero", height = "170px")
              ),

              # .. 4.d.3 Pie x sexo Notif G ----

              box( # class = "transparent-box",#"custom-border",
                # title = tags$p("Dosis por sexo", class = "kpi-tittle"),
                width = 3,
                closable = FALSE,
                # status = "info",
                headerBorder = FALSE,
                solidHeader = FALSE,
                collapsible = FALSE,
                # collapsed = FALSE,
                # background = "gray",
                # headerBorder = FALSE,
                highchartOutput("notif_x_genero_g", height = "170px")
              ),

              # .. 4.d.4 Pie x sexo Notif NG ----

              box( # class = "transparent-box",#"custom-border",
                # title = tags$p("Dosis por sexo", class = "kpi-tittle"),
                width = 3,
                closable = FALSE,
                # status = "info",
                headerBorder = FALSE,
                solidHeader = FALSE,
                collapsible = FALSE,
                # collapsed = FALSE,
                # background = "gray",
                # headerBorder = FALSE,
                highchartOutput("notif_x_genero_ng", height = "170px")
              )
            ),
          ),
          fluidRow(
            box(
              title = tags$div(
                class = "period-tittle",
                tags$span("Análisis de tendencias por semana epidemiológica"), inline = TRUE
              ),
              width = 12,
              closable = FALSE,
              # status = "info",
              headerBorder = FALSE,
              solidHeader = FALSE,
              collapsible = TRUE,
              collapsed = FALSE,
              tags$div(
                style = "position: absolute; top: 5px; right: 25px;",
                actionButton("open_controlbar", "",
                  icon = icon("cogs"),
                  style = "background: transparent; border: none; color: gray;"
                )
              ),

              # .. 4.d.5 Multiple tendencia Tasa ----

              box(
                title = tags$p("Notificaciones de ESAVI por año", class = "kpi-tittle"),
                width = 12,
                closable = FALSE,
                # status = "info",
                headerBorder = FALSE,
                solidHeader = FALSE,
                collapsible = FALSE,
                collapsed = FALSE,
                sidebar = boxSidebar(
                  id = "boxsidebar_semepi",
                  width = 25,
                  startOpen = FALSE,
                  sliderInput("slider_semepi", "Filtrar por semana epidemiológica",
                    min = 1, max = 53, value = c(1, 53)
                  ),
                  step = 1,
                  animate = TRUE
                ),
                highchartOutput("tendencias_multiples") # , height = "170px")
              ),

              # .. 4.d.6 Lineas Variación Tasa ----

              box(
                title = tags$p("Variación de la tasa de notificación de ESAVI", class = "kpi-tittle"),
                width = 12,
                closable = FALSE,
                # status = "info",
                headerBorder = FALSE,
                solidHeader = FALSE,
                collapsible = FALSE,
                collapsed = FALSE,
                sidebar = boxSidebar(
                  id = "boxsidebar_periodonoti",
                  width = 25,
                  startOpen = FALSE,
                  uiOutput("slider_periodonoti_ui")
                ),
                highchartOutput("grafico_variacion")
              )
            )
          ),

          # 4to Fluid

          fluidRow(
            box(
              title = tags$div(
                class = "period-tittle",
                tags$span("Distribución de notificaciones de ESAVI por Estado"), inline = TRUE
              ),
              width = 12,
              closable = FALSE,
              # status = "info",
              headerBorder = FALSE,
              solidHeader = FALSE,
              collapsible = TRUE,
              collapsed = FALSE,
              tags$div(
                style = "position: absolute; top: 5px; right: 25px;",
                actionButton("open_controlbar", "",
                  icon = icon("cogs"),
                  style = "background: transparent; border: none; color: gray;"
                )
              ),

              # .. 4.d.1 Pareto estados ----

              box( # class = "transparent-box",#"custom-border",
                # title = tags$p("Pareto", class = "kpi-tittle"),
                width = 6,
                closable = FALSE,
                # status = "info",
                headerBorder = TRUE,
                solidHeader = FALSE,
                collapsible = FALSE,
                # collapsed = FALSE,
                # background = "gray",
                # headerBorder = FALSE,
                highchartOutput("pareto_estado", height = "600px")
              ),

              # .. 4.d.2 Mapa ----

              box(
                title = tags$p("", class = "kpi-tittle"),
                width = 6,
                closable = FALSE,
                # status = "info",
                headerBorder = TRUE,
                solidHeader = FALSE,
                collapsible = FALSE,
                sidebar = boxSidebar(
                  id = "boxsidebar_mapa",
                  width = 35,
                  startOpen = FALSE,
                  # ~ a. Tipo mapa ----
                  selectInput("basemap", "Tipo de mapa base:",
                    choices = c(
                      "OpenStreetMap" = "OpenStreetMap",
                      "Satélite" = "Esri.WorldImagery"
                    ),
                    selected = "OpenStreetMap"
                  ),
                  # ~ b. Transparencia ----
                  sliderInput("transparencia", "Transparencia:",
                    min = 0, max = 1, value = 0.7, step = 0.1
                  ),
                  # ~ c. Etiquetas ----
                  checkboxInput("mostrar_etiquetas", "Mostrar etiquetas en el mapa", value = TRUE)
                ),
                leafletOutput("mapa", height = "600px"),
                style = "padding: 0;"
              )
            )
          ),
        )
      ),

      # 2.5.6 Tab Descriptivo -------------------------------------------------------------------------------------- ----

      tabItem(
        tabName = "descriptive",
        # tags$div(class = "general-section",
        #          "Descriptivo",
        # ),

        # ._ a. Encabezado ----

        fluidRow(
          f_periodo_box("tab_desc")
        ),

        # ._ b. KPIs ----

        fluidRow(
          f_dash_kpis_box("tab_desc")
        ),

        # ._ c. Gráficos ----

        fluidRow(
          box(
            title = tags$div(
              class = "period-tittle",
              tags$span("Análisis temporal de Dosis administradas, Notificaiones de ESAVI y Tasa notificación de ESAVI por fecha de notificación"), inline = TRUE
            ),
            width = 12,
            closable = FALSE,
            headerBorder = TRUE,
            solidHeader = FALSE,
            collapsible = TRUE,
            highchartOutput("grafico_tendencia")
          )
        ),
        fluidRow(
          box(
            class = "custom-border",
            title = tags$div(
              class = "period-tittle",
              tags$span("Análisis descriptivo de notificaciones de ESAVI por sexo y grupo etario"), inline = TRUE
            ),
            width = 12,
            closable = FALSE,
            headerBorder = TRUE,
            solidHeader = FALSE,
            collapsible = TRUE,
            collapsed = FALSE,
            tags$div(
              style = "position: absolute; top: 5px; right: 25px;",
              actionButton("open_controlbar", "",
                icon = icon("cogs"),
                style = "background: transparent; border: none; color: gray;"
              )
            ),
            fluidRow(
              box(
                class = "custom-border",
                title = tags$p("Densidad de la edad por sexo", class = "kpi-tittle"),
                width = 6,
                closable = FALSE,
                headerBorder = TRUE,
                solidHeader = FALSE,
                collapsible = FALSE,
                sidebar = boxSidebar(
                  id = "boxsidebar_distrib_edad",
                  width = 35,
                  startOpen = FALSE,
                  selectInput("select_metrica_sexo", "Visualizar por:",
                    choices = c("Frecuencia", "Proporción")
                  )
                ),
                highchartOutput("densidad_edad_sexo")
              ),
              box(
                class = "custom-border",
                title = tags$p("Distribución por grupo etario y sexo", class = "kpi-tittle"),
                width = 6,
                closable = FALSE,
                headerBorder = TRUE,
                solidHeader = FALSE,
                collapsible = FALSE,
                highchartOutput("piramide_poblacional")
              )
            ),
            fluidRow(
              box(
                class = "custom-border",
                title = tags$p("Tendencia por semana epidemiológica", class = "kpi-tittle"),
                width = 12,
                closable = FALSE,
                headerBorder = TRUE,
                solidHeader = FALSE,
                collapsible = FALSE,
                sidebar = boxSidebar(
                  id = "boxsidebar_periodonoti_sexo",
                  width = 25,
                  startOpen = FALSE,
                  uiOutput("slider_periodonoti_sexo_ui")
                ),
                highchartOutput("tendencias_sexo")
              )
            )
          ),
        ),
        fluidRow(
          box(
            class = "custom-border",
            title = tags$div(
              class = "period-tittle",
              tags$span("Análisis descriptivo de notificaciones de ESAVI por gravedad"), inline = TRUE
            ),
            width = 12,
            closable = FALSE,
            headerBorder = TRUE,
            solidHeader = FALSE,
            collapsible = TRUE,
            collapsed = FALSE,
            tags$div(
              style = "position: absolute; top: 5px; right: 25px;",
              actionButton("open_controlbar", "",
                icon = icon("cogs"),
                style = "background: transparent; border: none; color: gray;"
              )
            ),
            fluidRow(
              box(
                class = "custom-border",
                title = tags$p("Distribución por gravedad", class = "kpi-tittle"),
                width = 2,
                closable = FALSE,
                headerBorder = TRUE,
                solidHeader = FALSE,
                collapsible = FALSE,
                highchartOutput("pie_notif_gravedad")
              ),
              box(
                class = "custom-border",
                title = tags$p("Distribución por sexo", class = "kpi-tittle"),
                width = 4,
                closable = FALSE,
                headerBorder = TRUE,
                solidHeader = FALSE,
                collapsible = FALSE,
                highchartOutput("bar_notif_sexo_gravedad")
              ),
              box(
                class = "custom-border",
                title = tags$p("Distribución por grupo etario", class = "kpi-tittle"),
                width = 6,
                closable = FALSE,
                headerBorder = TRUE,
                solidHeader = FALSE,
                collapsible = FALSE,
                highchartOutput("piramide_gravedad")
              )
            ),
            fluidRow(
              box(
                class = "custom-border",
                title = tags$p("Tendencia por semana epidemiológica", class = "kpi-tittle"),
                width = 12,
                closable = FALSE,
                headerBorder = TRUE,
                solidHeader = FALSE,
                collapsible = FALSE,
                sidebar = boxSidebar(
                  id = "boxsidebar_periodonoti_gravedad",
                  width = 25,
                  startOpen = FALSE,
                  uiOutput("slider_periodonoti_gravedad_ui")
                ),
                highchartOutput("tendencias_gravedad")
              )
            )
          ),
        )
      ),

      # 2.5.7 Tab Vacunas -------------------------------------------------------------------------------------- ----

      tabItem(
        tabName = "vaccines",
        tags$div(
          class = "general-section",
          "Vacunas",
        ),
        # ._ a. Encabezado ----

        fluidRow(
          f_periodo_box("tab_vacc")
        ),

        # ._ b. KPIs ----

        fluidRow(
          f_dash_kpis_box("tab_vacc")
        ),

        # ._ c. KPIs Vacunas ----

        fluidRow(
          f_vacunas_kpis_box("tab_vaccs")
        ),

        # ._ d. Gráficos distribución general ----

        fluidRow(
          column(
            width = 10,
            uiOutput("select_imput_vac_vacuna_ui") # Selector dinámico
          ),
          column(
            width = 2,
            actionButton("limpiar_filtro_vac_vacuna", "Limpiar filtro", icon = icon("broom"), style = "margin-top: 25px;")
          )
        ),
        fluidRow(
          box(
            # icon = icon(vIcon_date, class = "kpi-icon"),
            id = "id_box_vac_gen",
            title = tags$div(
              class = "period-tittle",
              tags$span("Distribución general de notificaciones por vacuna administrada"), inline = TRUE
            ),
            width = 12,
            # status = "info",
            collapsible = TRUE,
            collapsed = FALSE,
            solidHeader = FALSE,
            style = "padding: 0; border: none; margin: 0;",
            tags$div(
              style = "position: absolute; top: 5px; right: 25px;",
              actionButton("open_controlbar", "",
                icon = icon("cogs"),
                style = "background: transparent; border: none; color: gray;"
              )
            ),
            fluidRow(
              box( # class = "transparent-box",#"custom-border",
                title = tags$p("Notificaciones por vacuna administrada", class = "kpi-tittle"),
                width = 4,
                closable = FALSE,
                # status = "info",
                headerBorder = FALSE,
                solidHeader = FALSE,
                collapsible = FALSE,
                # collapsed = FALSE,
                # background = "gray",
                highchartOutput("bar_noti_vac")
              ),
              box( # class = "transparent-box",#"custom-border",
                title = tags$p("Tendencia de las notificaciones por semana epidemiológica y vacuna administrada", class = "kpi-tittle"),
                width = 8,
                closable = FALSE,
                # status = "info",
                headerBorder = FALSE,
                solidHeader = FALSE,
                collapsible = FALSE,
                # collapsed = FALSE,
                # background = "gray",
                highchartOutput("tendencias_multiples_vac") # , height = "170px")
              ),
            )
          )
        ),

        # ._ e. Gráficos Análisis por geografía ----

        fluidRow(
          box(
            # icon = icon(vIcon_date, class = "kpi-icon"),
            id = "id_box_vac_geo",
            title = tags$div(
              class = "period-tittle",
              tags$span("Análisis por geografía"), inline = TRUE
            ),
            width = 12,
            # status = "info",
            collapsible = TRUE,
            collapsed = ver_collapsed,
            solidHeader = FALSE,
            style = "padding: 0; border: none; margin: 0;",
            tags$div(
              style = "position: absolute; top: 5px; right: 25px;",
              actionButton("open_controlbar", "",
                icon = icon("cogs"),
                style = "background: transparent; border: none; color: gray;"
              )
            ),
            fluidRow(
              #box( # class = "transparent-box",#"custom-border",
              #  id = "id_pareto_estado_vacuna",
              #  title = tags$p("% Notificaciones por Estado notificador y vacuna administrada. ", class = "kpi-tittle"),
              #  width = 4,
              #  closable = FALSE,
              #  # status = "info",
              #  headerBorder = FALSE,
              #  solidHeader = FALSE,
              #  collapsible = FALSE,
              #  # collapsed = FALSE,
              #  # background = "gray",
              #  highchartOutput("pareto_estado_vacuna", height = "500px")
              #),
              #box(
              #  style = "padding: 0; border: none; margin: 0;",
              #  id = "id_multiMap_vac",
              #  title = tags$p("Distribución coroplética de notificaciones por Estado notificador y vacuna #administrada", class = "kpi-tittle"),
              #  width = 8,
              #  closable = FALSE,
              #  # status = "info",
              #  headerBorder = FALSE,
              #  solidHeader = FALSE,
              #  collapsible = FALSE,
              #  # collapsed = FALSE,
              #  # background = "gray",
              #  # plotOutput("multiMap_vac", height = "500px")
              #  tabBox(
              #    id = "tab_multiMap_vac",
              #    width = 12,
              #    tabPanel("Distribución general", plotOutput("multiMap_vac_gen", height = "400px")),
              #    tabPanel("Distribución por vacuna", plotOutput("multiMap_vac", height = "400px"))
              #  )
              #),
            )
          )
        ),

        # ._ f. Gráficos Análisis sociodemográfico ----
        fluidRow(
          box(
            # icon = icon(vIcon_date, class = "kpi-icon"),
            id = "id_box_vac_sdemo",
            title = tags$div(
              class = "period-tittle",
              tags$span("Distribución de notificaciones por sexo, grupo etario y vacuna administrada"), inline = TRUE
            ),
            width = 12,
            # status = "info",
            collapsible = TRUE,
            collapsed = ver_collapsed,
            solidHeader = FALSE,
            style = "padding: 0; border: none; margin: 0;",
            tags$div(
              style = "position: absolute; top: 5px; right: 25px;",
              actionButton("open_controlbar", "",
                icon = icon("cogs"),
                style = "background: transparent; border: none; color: gray;"
              )
            ),
            fluidRow(
              box( # class = "transparent-box",#"custom-border",
                title = tags$p("Distribución de notificaciones por sexo", class = "kpi-tittle"),
                width = 4,
                closable = FALSE,
                # status = "info",
                headerBorder = FALSE,
                solidHeader = FALSE,
                collapsible = FALSE,
                # collapsed = FALSE,
                # background = "gray",
                highchartOutput("bar_noti_vac_sexo")
              ),
              box( # class = "transparent-box",#"custom-border",
                title = tags$p("Distribución de notificaciones por grupo etario", class = "kpi-tittle"),
                width = 8,
                closable = FALSE,
                # status = "info",
                headerBorder = FALSE,
                solidHeader = FALSE,
                collapsible = FALSE,
                # collapsed = FALSE,
                # background = "gray",
                # highchartOutput("bar_noti_vac_ge")
                tabBox(
                  id = "tab_vac_ge",
                  width = 12,
                  tabPanel("General", highchartOutput("bar_noti_vac_ge")),
                  tabPanel("< 18 años", highchartOutput("bar_noti_vac_ge_menores"))
                )
              ),
            )
          )
        ),


        # ._ g. Gráficos Análisis por Gravedad ----

        fluidRow(
          box(
            # icon = icon(vIcon_date, class = "kpi-icon"),
            id = "id_box_vac_gravedad",
            title = tags$div(
              class = "period-tittle",
              tags$span("Distribución de notificaciones por gravedad y vacunas administradas"), inline = TRUE
            ),
            width = 12,
            # status = "info",
            collapsible = TRUE,
            collapsed = ver_collapsed,
            solidHeader = FALSE,
            style = "padding: 0; border: none; margin: 0;",
            tags$div(
              style = "position: absolute; top: 5px; right: 25px;",
              actionButton("open_controlbar", "",
                icon = icon("cogs"),
                style = "background: transparent; border: none; color: gray;"
              )
            ),
            fluidRow(
              box( # class = "transparent-box",#"custom-border",
                title = tags$p("Distribución de notificaciones por gravedad", class = "kpi-tittle"),
                width = 4,
                closable = FALSE,
                # status = "info",
                headerBorder = FALSE,
                solidHeader = FALSE,
                collapsible = FALSE,
                # collapsed = FALSE,
                # background = "gray",
                highchartOutput("bar_noti_vac_gravedad")
              ),
              box( # class = "transparent-box",#"custom-border",
                title = tags$p("Por gravedad - Hombres", class = "kpi-tittle"),
                width = 4,
                closable = FALSE,
                # status = "info",
                headerBorder = FALSE,
                solidHeader = FALSE,
                collapsible = FALSE,
                # collapsed = FALSE,
                # background = "gray",
                highchartOutput("bar_noti_vac_gravedad_masculino")
              ),
              box( # class = "transparent-box",#"custom-border",
                title = tags$p("Por gravedad - Mujeres", class = "kpi-tittle"),
                width = 4,
                closable = FALSE,
                # status = "info",
                headerBorder = FALSE,
                solidHeader = FALSE,
                collapsible = FALSE,
                # collapsed = FALSE,
                # background = "gray",
                highchartOutput("bar_noti_vac_gravedad_femenino")
              ),
            ),
            fluidRow(
              box( # class = "transparent-box",#"custom-border",
                title = tags$p("Graves por grupo etario", class = "kpi-tittle"),
                width = 6,
                closable = FALSE,
                # status = "info",
                headerBorder = FALSE,
                solidHeader = FALSE,
                collapsible = FALSE,
                # collapsed = FALSE,
                # background = "gray",
                highchartOutput("bar_noti_vac_ge_grave", height = "500px")
              ),
              box( # class = "transparent-box",#"custom-border",
                title = tags$p("No graves por grupo etario", class = "kpi-tittle"),
                width = 6,
                closable = FALSE,
                # status = "info",
                headerBorder = FALSE,
                solidHeader = FALSE,
                collapsible = FALSE,
                # collapsed = FALSE,
                # background = "gray",
                highchartOutput("bar_noti_vac_ge_no_grave", height = "500px")
              )
            )
          )
        ),




        # ._ i. Gráficos Análisis número de dosis ----

        fluidRow(
          box(
            # icon = icon(vIcon_date, class = "kpi-icon"),
            id = "id_box_vac_dosis",
            title = tags$div(
              class = "period-tittle",
              tags$span("Distribución de notificaciones por vacuna administrada y número de dosis del esquema"), inline = TRUE
            ),
            width = 12,
            # status = "info",
            collapsible = TRUE,
            collapsed = ver_collapsed,
            solidHeader = FALSE,
            style = "padding: 0; border: none;",
            tags$div(
              style = "position: absolute; top: 5px; right: 25px;",
              actionButton("open_controlbar", "",
                icon = icon("cogs"),
                style = "background: transparent; border: none; color: gray;"
              )
            ),
            fluidRow(
              box( # class = "transparent-box",#"custom-border",
                title = tags$p("Notificaciones por vacuna y número de dosis", class = "kpi-tittle"),
                width = 4,
                closable = FALSE,
                # status = "info",
                headerBorder = FALSE,
                solidHeader = FALSE,
                collapsible = FALSE,
                # collapsed = FALSE,
                # background = "gray",
                highchartOutput("pareto_vacuna_dosis") # , height = "170px")
              ),
              box( # class = "transparent-box",#"custom-border",
                title = tags$p("Heatmap de notificaciones por vacuna administrada y número de dosis del esquema", class = "kpi-tittle"),
                width = 8,
                closable = FALSE,
                # status = "info",
                headerBorder = FALSE,
                solidHeader = FALSE,
                collapsible = FALSE,
                # collapsed = FALSE,
                # background = "gray",
                highchartOutput("heatmap_vac_dosis") # , height = "170px")
              ),
            ) # ,
            # fluidRow(
            #   box(#class = "transparent-box",#"custom-border",
            #     title = tags$p("Pareto de notificaciones por lote de vacuna", class = "kpi-tittle"),
            #     width = 12,
            #     closable = FALSE,
            #     #status = "info",
            #     headerBorder = FALSE,
            #     solidHeader = FALSE,
            #     collapsible = FALSE,
            #     #collapsed = FALSE,
            #     #background = "gray",
            #     highchartOutput("pareto_vacuna_lote")#, height = "170px")
            #   )
            # )
          ),
        )
      ),


      # 2.5.8 Tab Eventos -------------------------------------------------------------------------------------- ----

      tabItem(
        tabName = "esavi",
        # tags$div(class = "general-section",
        #          "ESAVI",
        # ),

        # ._ a. Encabezado ----

        fluidRow(
          f_periodo_box("tab_even")
        ),

        # ._ b. KPIs ----

        fluidRow(
          f_dash_kpis_box("tab_even")
        ),

        # ._ c. KPIs eventos ----

        fluidRow(
          f_eventos_kpis_box("tab_events")
        ),

        # ._ d. Gráficos distribución general ----

        fluidRow(
          box(
            # icon = icon(vIcon_date, class = "kpi-icon"),
            title = tags$div(
              class = "period-tittle",
              tags$span("Distribución general de eventos por términos MedDRA"), inline = TRUE
            ),
            width = 12,
            # status = "info",
            collapsible = TRUE,
            collapsed = FALSE,
            solidHeader = FALSE,
            style = "padding: 0; border: none; margin: 0;",
            tags$div(
              style = "position: absolute; top: 5px; right: 25px;",
              actionButton("open_controlbar", "",
                icon = icon("cogs"),
                style = "background: transparent; border: none; color: gray;"
              )
            ),
            fluidRow(
              box(
                width = 12,
                closable = FALSE,
                # status = "info",
                headerBorder = FALSE,
                solidHeader = FALSE,
                collapsible = FALSE,
                numericInput(
                  "n_term_meddra",
                  "Seleccione los primeros n términos a mostrar",
                  value = 20, # valor por defecto
                  min = 1,
                  max = 100,
                  step = 5
                ),
                box( # class = "transparent-box",#"custom-border",
                  title = tags$p("Distribución por término Preferente (PT)", class = "kpi-tittle"),
                  width = 4,
                  closable = FALSE,
                  # status = "info",
                  headerBorder = FALSE,
                  solidHeader = FALSE,
                  collapsible = FALSE,
                  # collapsed = FALSE,
                  # background = "gray
                  highchartOutput("pareto_pt", height = "600px")
                ),
                box( # class = "transparent-box",#"custom-border",
                  title = tags$p("Distribución por término HLGT", class = "kpi-tittle"),
                  width = 4,
                  closable = FALSE,
                  # status = "info",
                  headerBorder = FALSE,
                  solidHeader = FALSE,
                  collapsible = FALSE,
                  # collapsed = FALSE,
                  # background = "gray
                  highchartOutput("pareto_hlgt", height = "600px")
                ),
                box( # class = "transparent-box",#"custom-border",
                  title = tags$p("Distribución por término SOC", class = "kpi-tittle"),
                  width = 4,
                  closable = FALSE,
                  # status = "info",
                  headerBorder = FALSE,
                  solidHeader = FALSE,
                  collapsible = FALSE,
                  # collapsed = FALSE,
                  # background = "gray",
                  highchartOutput("pareto_soc", height = "600px")
                )
              )
            ),
            fluidRow(
              # box(
              #   width = 12,
              #   closable = FALSE,
              #   #status = "info",
              #   headerBorder = FALSE,
              #   solidHeader = FALSE,
              #   collapsible = FALSE,
              box( # class = "transparent-box",#"custom-border",
                title = tags$p("Nube de términos PT de menor frecuencia (100-1.000)", class = "kpi-tittle"),
                width = 4,
                closable = FALSE,
                # status = "info",
                headerBorder = FALSE,
                solidHeader = FALSE,
                collapsible = FALSE,
                # collapsed = FALSE,
                # background = "gray
                highchartOutput("wordcloud_pt", height = "300px")
              ),
              box( # class = "transparent-box",#"custom-border",
                title = tags$p("Nube de términos HLGT de menor frecuencia (100-1.000)", class = "kpi-tittle"),
                width = 4,
                closable = FALSE,
                # status = "info",
                headerBorder = FALSE,
                solidHeader = FALSE,
                collapsible = FALSE,
                # collapsed = FALSE,
                # background = "gray
                highchartOutput("wordcloud_hlgt", height = "300px")
              ),
              box( # class = "transparent-box",#"custom-border",
                title = tags$p("Nube de términos SOC de menor frecuencia (100-1.000)", class = "kpi-tittle"),
                width = 4,
                closable = FALSE,
                # status = "info",
                headerBorder = FALSE,
                solidHeader = FALSE,
                collapsible = FALSE,
                # collapsed = FALSE,
                # background = "gray",
                highchartOutput("wordcloud_soc", height = "300px")
              )
              # )
            )
          )
        ),

        # ._ e. Gráficos distribución demografica ----

        fluidRow(
          box(
            # icon = icon(vIcon_date, class = "kpi-icon"),
            title = tags$div(
              class = "period-tittle",
              tags$span("Distribución de eventos (PT) por sexo y grupo etario"), inline = TRUE
            ),
            width = 12,
            # status = "info",
            collapsible = TRUE,
            collapsed = FALSE,
            solidHeader = FALSE,
            style = "padding: 0; border: none; margin: 0;",
            tags$div(
              style = "position: absolute; top: 5px; right: 25px;",
              actionButton("open_controlbar", "",
                icon = icon("cogs"),
                style = "background: transparent; border: none; color: gray;"
              )
            ),
            fluidRow(
              box(
                width = 12,
                closable = FALSE,
                # status = "info",
                headerBorder = FALSE,
                solidHeader = FALSE,
                collapsible = FALSE,
                column(
                  width = 6,
                  numericInput(
                    "n_pt_sexo_ge",
                    "Seleccione los primeros n términos a mostrar",
                    value = 20, # valor por defecto
                    min = 1,
                    max = 100,
                    step = 5
                  ),
                ),
                column(
                  width = 6,
                  uiOutput("select_imput_gravedad_sexo_ui"), # Selector dinámico
                ),
                box( # class = "transparent-box",#"custom-border",
                  title = tags$p("Eventos notificados en hombres", class = "kpi-tittle-r"),
                  width = 3,
                  closable = FALSE,
                  # status = "info",
                  headerBorder = FALSE,
                  solidHeader = FALSE,
                  collapsible = FALSE,
                  highchartOutput("bar_event_pt_hombres", height = "600px")
                ),
                box( # class = "transparent-box",#"custom-border",
                  title = tags$p("Eventos notificados en mujeres", class = "kpi-tittle"),
                  width = 3,
                  closable = FALSE,
                  # status = "info",
                  headerBorder = FALSE,
                  solidHeader = FALSE,
                  collapsible = FALSE,
                  highchartOutput("bar_event_pt_mujeres", height = "600px")
                ),
                box( # class = "transparent-box",#"custom-border",
                  title = tags$p("Eventos notificados según grupo etario", class = "kpi-tittle"),
                  width = 6,
                  closable = FALSE,
                  # status = "info",
                  headerBorder = FALSE,
                  solidHeader = FALSE,
                  collapsible = FALSE,
                  # collapsed = FALSE,
                  highchartOutput("heatmap_event_pt_ge", height = "600px")
                )
              ),
            )
          )
        ),

        # ._ f. Gráficos Análisis por gravedad ----

        fluidRow(
          box(
            # icon = icon(vIcon_date, class = "kpi-icon"),
            title = tags$div(
              class = "period-tittle",
              tags$span("Distribución general de eventos (PT) por Gravedad"), inline = TRUE
            ),
            width = 12,
            # status = "info",
            collapsible = TRUE,
            collapsed = ver_collapsed,
            solidHeader = FALSE,
            style = "padding: 0; border: none; margin: 0;",
            tags$div(
              style = "position: absolute; top: 5px; right: 25px;",
              actionButton("open_controlbar", "",
                icon = icon("cogs"),
                style = "background: transparent; border: none; color: gray;"
              )
            ),
            fluidRow(
              box(
                width = 12,
                closable = FALSE,
                # status = "info",
                headerBorder = FALSE,
                solidHeader = FALSE,
                collapsible = FALSE,
                column(
                  width = 6,
                  numericInput(
                    "n_pt_gravedad",
                    "Seleccione los primeros n términos a mostrar",
                    value = 20, # valor por defecto
                    min = 1,
                    max = 100,
                    step = 5
                  ),
                ),
                column(
                  width = 6,
                  uiOutput("select_imput_vacuna_ui"), # Selector dinámico
                ),
                box( # class = "transparent-box",#"custom-border",
                  title = tags$p("Eventos notificados graves", class = "kpi-tittle-r"),
                  width = 6,
                  closable = FALSE,
                  # status = "info",
                  headerBorder = FALSE,
                  solidHeader = FALSE,
                  collapsible = FALSE,
                  collapsed = FALSE,
                  # background = "gray",
                  highchartOutput("bar_event_pt_graves", height = "600px")
                ),
                box( # class = "transparent-box",#"custom-border",
                  title = tags$p("Eventos notificados no graves", class = "kpi-tittle"),
                  width = 6,
                  closable = FALSE,
                  # status = "info",
                  headerBorder = FALSE,
                  solidHeader = FALSE,
                  collapsible = FALSE,
                  highchartOutput("bar_event_pt_no_graves", height = "600px")
                )
              ),
            )
          )
        ),

        # ._ g. Gráficos distribución por vacunas ----

        fluidRow(
          box(
            # icon = icon(vIcon_date, class = "kpi-icon"),
            title = tags$div(
              class = "period-tittle",
              tags$span("Distribución de eventos según Sistema Organo Clase (SOC) y tipo de vacuna contra COVID-19 administrada"), inline = TRUE
            ),
            width = 12,
            # status = "info",
            collapsible = TRUE,
            collapsed = FALSE,
            solidHeader = FALSE,
            style = "padding: 0; border: none; margin: 0;",
            tags$div(
              style = "position: absolute; top: 5px; right: 25px;",
              actionButton("open_controlbar", "",
                icon = icon("cogs"),
                style = "background: transparent; border: none; color: gray;"
              )
            ),
            fluidRow(
              box( # class = "transparent-box",#"custom-border",
                title = tags$p("Vacuna - SOC", class = "kpi-tittle-r"),
                width = 12,
                closable = FALSE,
                # status = "info",
                headerBorder = FALSE,
                solidHeader = FALSE,
                collapsible = FALSE,
                highchartOutput("bubble_soc_vac", height = "600px")
              )
            ),
            fluidRow(
              box( # class = "transparent-box",#"custom-border",
                title = tags$p("Navegación jerárquica de eventos (SOC -> PT) a partir del tipo de vacuna contra COVID-19 administrada", class = "kpi-tittle"),
                width = 12,
                closable = FALSE,
                # status = "info",
                headerBorder = FALSE,
                solidHeader = FALSE,
                collapsible = FALSE,
                highchartOutput("treemap_event_soc_pt_vacuna", height = "600px")
              )
            ),
            fluidRow(
              box(
                width = 12,
                closable = FALSE,
                # status = "info",
                headerBorder = FALSE,
                solidHeader = FALSE,
                collapsible = FALSE,
                column(
                  width = 4,
                  uiOutput("slider_sankey_ui"),
                ),
                column(
                  width = 4,
                  numericInput(
                    "n_sankey",
                    "Seleccione los primeros n términos PT a mostrar",
                    value = 5, # valor por defecto
                    min = 1,
                    max = 30,
                    step = 5
                  ),
                ),
                column(
                  width = 4,
                  uiOutput("select_imput_gravedad_sankey_ui"), # Selector dinámico
                ),
                box( # class = "transparent-box",#"custom-border",
                  title = tags$p("Transición de datos entre vacuna, termino preferente y desenlace (Diagrama de Sankey)", class = "kpi-tittle-r"),
                  width = 12,
                  closable = FALSE,
                  headerBorder = FALSE,
                  solidHeader = FALSE,
                  collapsible = FALSE,
                  # sidebar = boxSidebar(
                  #   id = "boxsidebar_sankey",
                  #   width = 25,
                  #   startOpen = FALSE,
                  #   # uiOutput("slider_sankey_ui"),
                  # ),
                  highchartOutput("sankey_vac_soc_desc", height = "600px")
                )
              )
            )
          )
        ),

        # ._ h. Gráficos Análisis tiempo vac - ini ----

        fluidRow(
          box(
            # icon = icon(vIcon_date, class = "kpi-icon"),
            id = "id_box_vac_latencia",
            title = tags$div(
              class = "period-tittle",
              tags$span("Análisis del tiempo hasta el inicio de síntomas (time to onset)"), inline = TRUE
            ),
            width = 12,
            # status = "info",
            collapsible = TRUE,
            collapsed = ver_collapsed,
            solidHeader = FALSE,
            style = "padding: 0; border: none; margin: 0;",
            tags$div(
              style = "position: absolute; top: 5px; right: 25px;",
              actionButton("open_controlbar", "",
                icon = icon("cogs"),
                style = "background: transparent; border: none; color: gray;"
              )
            ),
            fluidRow(
              box( # class = "transparent-box",#"custom-border",
                title = tags$p("Distribución según tiempo hasta el inicio de síntomas (en días)", class = "kpi-tittle"),
                width = 4,
                closable = FALSE,
                # status = "info",
                headerBorder = FALSE,
                solidHeader = FALSE,
                collapsible = FALSE,
                # collapsed = FALSE,
                # background = "gray",
                highchartOutput("bar_dias_vac")
              ),
              box( # class = "transparent-box",#"custom-border",
                title = tags$p("Tiempo hasta el inicio de síntomas según tipo de vacuna administrada", class = "kpi-tittle"),
                width = 4,
                closable = FALSE,
                # status = "info",
                headerBorder = FALSE,
                solidHeader = FALSE,
                collapsible = FALSE,
                # collapsed = FALSE,
                # background = "gray",
                highchartOutput("boxplot_dias_vac_ini")
              ),
              box(
                title = tags$p("Tiempo hasta el inicio de síntomas según gravedad y tipo de vacuna administrada", class = "kpi-tittle"),
                width = 4,
                closable = FALSE,
                # status = "info",
                headerBorder = TRUE,
                solidHeader = FALSE,
                collapsible = FALSE,
                # collapsed = FALSE,
                # background = "gray",
                highchartOutput("boxplot_dias_vac_ini_gravedad")
              )
            )
          )
        ),
      ),





      # 2.5.9 Tab Antecedentes ---------------------------------------------------------------------------------- ----

      tabItem(
        tabName = "antecedentes",
        # tags$div(class = "general-section",
        #          "Antecedentes",
        # ),
        # ._ a. Encabezado ----

        fluidRow(
          f_periodo_box("tab_antc")
        ),

        # ._ b. KPIs ----

        fluidRow(
          f_dash_kpis_box("tab_antc")
        ),

        # ._ c. Gráficos ----

        fluidRow(
          box(
            title = tags$p("Tabla", class = "kpi-tittle"),
            width = 6,
            closable = FALSE,
            # status = "info",
            headerBorder = TRUE,
            solidHeader = FALSE,
            collapsible = TRUE,
            # collapsed = FALSE,
            # background = "gray",
            # headerBorder = FALSE,

            # DTOutput("distrb_sexo")
            wellPanel(
              h4("Datos de Distribución"),
              tableOutput("distribucion_tabla")
            )
          ),
          box(
            title = tags$p("Grafico", class = "kpi-tittle"),
            width = 6,
            closable = FALSE,
            # status = "info",
            headerBorder = TRUE,
            solidHeader = FALSE,
            collapsible = TRUE
            # DTOutput("analisis_disprop1", height = "400px")
            # collapsed = FALSE,
            # background = "gray",
            # headerBorder = FALSE
            # ,highchartOutput("bar_noti_vac_gravedad_sexo2")
            # ,highchartOutput("bar_noti_vac_ge")
            # plotOutput("multiMap_vac")
          )
        ),
      ),


      # 2.5.10 Tab Seniales ---------------------------------------------------------------------------------- ----

      tabItem(
        tabName = "senales",
        # tags$div(class = "general-section",
        #          "Señales",
        # ),

        # ._a. Encabezado ----

        fluidRow(
          f_periodo_box("tab_sena")
        ),

        # ._b. KPIs ----

        fluidRow(
          f_dash_kpis_box("tab_sena")
        ),

        # ._ c. Tablas de disproporcionalidad ----

        fluidRow(
          box(
            id = "id_box_disprop",
            title = tags$div(
              class = "period-tittle",
              tags$span("Análisis de detección de Señales: Análisis por PT, SMQ o CMQ personalizado"),
              inline = TRUE
            ),
            width = 12,
            collapsible = TRUE,
            collapsed = FALSE,
            solidHeader = FALSE,
            tags$div(
              style = "position: absolute; top: 5px; right: 25px;",
              actionButton("open_controlbar", "",
                icon = icon("cogs"),
                style = "background: transparent; border: none; color: gray;"
              )
            ),
            fluidRow(
              column(
                width = 2,
                selectizeInput(
                  "filtro_vacuna",
                  tags$span(style = "font-size: 13px; color: black;", "Filtro de vacuna"),
                  choices = NULL,
                  multiple = TRUE,
                  options = list(placeholder = "Seleccionar vacuna")
                )
              ),
              column(
                width = 3,
                selectInput(
                  "tipo_analisis", "Tipo de análisis:",
                  choices = c(
                    "PRR - Razón de Notificación Proporcional" = "analisis_prr",
                    "ROR - Razón de Probabilidades de Notificación" = "analisis_ror",
                    "BCPNN Norm - Red Neuronal de Propagación de Confianza Bayesiana (aprox. Normal)" = "analisis_bcpnn_norm",
                    "BCPNN MC - Red Neuronal de Propagación de Confianza Bayesiana (aprox. Monte Carlo)" = "analisis_bcpnn_mc"
                  ),
                  selected = "analisis_prr"
                )
              ),
              column(
                width = 2,
                selectInput(
                  "nivel_analisis", "Nivel de análisis:",
                  choices = c(
                    "(PT) Término preferente" = "analisis_pt",
                    "(SMQ) Consulta estandarizada" = "analisis_smq",
                    "(CMQ) Consulta personalizada" = "analisis_cmq"
                  ),
                  selected = "analisis_pt"
                )
              ),
              conditionalPanel(
                condition = "input.nivel_analisis == 'analisis_cmq'",
                column(
                  width = 4,
                  selectizeInput(
                    "filtro_cmq",
                    tags$span(style = "font-size: 13px; color: black;", "Generar CMQ:"),
                    choices = NULL,
                    multiple = TRUE,
                    options = list(placeholder = "Seleccione PTs para consulta personalizada...")
                  )
                ) # ,
                # column(
                #   width = 1,
                #   actionButton("btn_limpiar_filtro_cmq", "Limpiar Filtros", class = "btn-secondary", style = "margin-top: 25px;")
                # )
              ),
              column(
                width = 1,
                actionButton("btn_limpiar_filtro_cmq", "Limpiar Filtros", class = "btn-secondary", style = "margin-top: 25px;")
              )
            ),
            fluidRow(
              uiOutput("titulo_disprop")
            ),
            box(
              width = 12,
              closable = FALSE,
              headerBorder = FALSE,
              solidHeader = FALSE,
              collapsible = FALSE,
              DTOutput("analisis_disprop", height = "400px")
            )
          )
        )
      ),



      # 2.5.11 Tab Aboout ------------------------------------------------------------------------------------ ----

      tabItem(
        tabName = "about",
        div(
          class = "intro-section",
          h1("Acerca de"),
        ),
        div(
          class = "text-title",
          h2("Esta aplicación"),
          h4("Esta aplicación web está desarrollada utilizando R Shiny. El desarrollado se hizo teniendo en cuenta las mejores prácticas de Shiny, como el uso de módulos Shiny."),
          h2("Datos"),
          h4("Los datos para esta aplicación corresponden al resultado del procesamiento y análisis de avanzado de datos, realizado por el equipo de vacunación segura de la OPS, a los datos de eventos adversos anonimizados proporcionados por la unidad de inmunización del ministerio de salud del país.")
        )
      ),


      # 2.5.12 Tab Test ------------------------------------------------------------------------------------- ----

      tabItem(
        tabName = "test",
        valueBox(
          value = "150",
          subtitle = "Nuevos Usuarios",
          icon = icon(vIcon_home),
          color = "blue",
          width = 3
        ),
        infoBox(
          title = "Progreso",
          value = "60%",
          icon = icon(vIcon_home),
          color = "green",
          width = 3,
          fill = TRUE
        ),
        box(
          title = "New Orders",
          value = 10 * 2,
          icon = icon("credit-card"),
          width = 3,
          background = "yellow"
        ),
        # Widget personalizado con métricas
        box(
          title = "Métricas Personalizadas",
          icon = icon(vIcon_home),
          width = 3,
          background = "yellow",
          tags$div(
            # class = "metric-widget",
            h3("Métrica Principal"),
            h4("Valor Secundario"),
            tags$p("Descripción adicional")
          )
        ),
        # Widget tipo Box con gráfico
        box(
          title = "Estadísticas",
          status = "primary",
          solidHeader = TRUE,
          width = 3,
          plotOutput("grafico")
        ),
        box(
          title = "Título",
          status = "primary",
          solidHeader = TRUE,
          "Contenido"
        ),

        # Widget con controles interactivos
        box(
          title = "Controles",
          width = 4,
          sliderInput("slider", "Selecciona rango:",
            min = 0, max = 100, value = c(20, 80)
          ),
          selectInput("select", "Elige una opción:",
            choices = c("Opción 1", "Opción 2", "Opción 3")
          ),
          checkboxInput("checkbox", "Activar función", value = FALSE)
        ),
        # Fila con widgets de tabla y gráfico
        fluidRow(
          # Widget de tabla
          box(
            title = "Tabla de Datos",
            width = 6,
            status = "info",
            collapsible = TRUE
            # DT::dataTableOutput("tabla")
          ),

          # Widget de gráfico interactivo
          box(
            title = "Gráfico Interactivo",
            width = 6,
            status = "warning",
            collapsible = TRUE
            # plotlyOutput("grafico_interactivo")
          )
        ),
        box(background = "red"),
        box(background = "blue"),
        box(background = "navy"),
        # tableOutput("tabla_datos")
        box(
          title = "Box completo",
          background = NULL,
          width = 6, # Ancho del box (1-12)
          height = 400, # Altura en píxeles
          solidHeader = FALSE, # Header sólido
          collapsible = TRUE, # Permite colapsar
          collapsed = FALSE, # Estado inicial
          maximizable = TRUE,
          closable = FALSE, # Permite cerrar
          status = NULL, # Estado visual
          footer = "Pie de box" # Texto del footer
        ),
        # colores: red, blue, green, yellow, black, purple, navy, teal, fuchsia, aqua, maroon, olive, lime



        sidebarPanel(
          selectInput("analysis_type", "Seleccione el análisis:",
            choices = c("Gráfico 1", "Gráfico 2")
          ),
          uiOutput("filter_ui"), # Filtros dinámicos
        ),
        mainPanel(
          highchartOutput("highchart")
        ),
        sidebarLayout(
          sidebarPanel(
            selectInput("analysis_type", "Seleccione el análisis:",
              choices = c("Gráfico 1", "Gráfico 2")
            ),
            uiOutput("filter_ui") # Filtros dinámicos
          ),
          mainPanel(
            # A static infoBox
            infoBox("New Orders", 10 * 2, icon = icon("credit-card"), color = "aqua"),
            highchartOutput("highchart")
          )
        )
      )

      # black, purple, navy, fuchsia, maroon, lime,
      # red, blue, green, yellow, teal, aqua, olive
    ),
  ),


  # 2.6 Control Bar ----------------------------------------------------------------------------------------------

  dashboardControlbar(
    id = "controlbar",
    width = 230,
    overlay = FALSE,
    skin = "light",
    # vertical = FALSE,
    # side = "left",
    # .list = NULL,

    # Título del control

    div(
      style = "margin-top: 15px; text-align: center; font-weight: bold; font-size: 16px; padding: 10px;",
      "Filtros generales"
    ),

    # Menú del controlbar

    controlbarMenu(
      id = "menuOpciones",
      controlbarItem(
        actionButton("reset_general", "Limpiar filtros",
          class = "btn-sm bg-blue",
          style = "margin: 10px 0;"
        ),
        lapply(names(filtros_config), function(nombre_filtro) {
          filtro <- filtros_config[[nombre_filtro]]
          div(
            style = "display: flex; align-items: center; margin-bottom: 0px; width: 95%;",
            div(
              # class = "filtro-select",
              style = "display: flex; align-items: center; margin-bottom: 0px; width: 98%;",
              selectizeInput(
                filtro$id,
                filtro$label,
                choices = NULL,
                multiple = TRUE # ,
                # options = list(width = "20%")
              )
            ),
            div(
              # class = "filtro-button",
              style = "display: flex; align-items: center; margin-left: 5px; margin-right: 5px; width: 98%;",
              actionButton(
                paste0("reset_", filtro$id),
                label = NULL,
                icon = icon(vIcon_filt),
                class = "btn-sm btn-link",
                style = "padding: 0; color: #2E3440; margin-right: 0px;"
              )
            )
          )
        })
      ),

      # # Acordión

      # accordion(
      #   #style = "width: 100%; padding: 0; margin: 0;",
      #   id = "accordion1",
      #   #width = 230,
      #
      #
      #   # 2.6.1 Acordion Filtros ----
      #
      #   accordionItem(
      #     title = "Filtros",
      #     status = "primary",
      #     solidHeader = FALSE,
      #     collapsible = TRUE,
      #     collapsed = FALSE,
      #     actionButton("reset_general", "Limpiar filtros",
      #                   class = "btn-sm bg-blue",
      #                   style = "margin: 10px 0;"),
      #     lapply(names(filtros_config), function(nombre_filtro) {
      #       filtro <- filtros_config[[nombre_filtro]]
      #       div(
      #         style = "display: flex; align-items: center; margin-bottom: 0px; width: 100%;",
      #         div(
      #           #class = "filtro-select",
      #           style = "display: flex; align-items: center; margin-bottom: 0px; width: 100%;",
      #           selectizeInput(
      #             filtro$id,
      #             filtro$label,
      #             choices = NULL,
      #             multiple = TRUE#,
      #             # options = list(width = "20%")
      #           )
      #         ),
      #         div(
      #           #class = "filtro-button",
      #           style = "display: flex; align-items: center; margin-left: 10px; width: 100%;",
      #           actionButton(
      #             paste0("reset_", filtro$id),
      #             label = NULL,
      #             icon = icon(vIcon_filt),
      #             class = "btn-sm btn-link",
      #             style = "padding: 0; color: #2E3440; margin-right: 0px;"
      #           )
      #         )
      #       )
      #     })
      #   ),

      # # 2.6.2 Acordion Controles ----
      #
      # accordionItem(
      #   title = "Generales",
      #   status = "primary",
      #   solidHeader = FALSE,
      #   collapsible = TRUE,
      #   collapsed = TRUE,
      #   #background = "black",
      #   tags$p(),
      #
      #   # Línea divisoria
      #   #tags$hr(class = "linea-divisoria"),
      #
      #   #~ a. Selector unidad tasa ----
      #   selectInput("utasa_filter", "Elegir unidad para la tasa:",
      #                choices = c("x mil D.A." = "1K",
      #                            "x 10 mil D.A." = "10K",
      #                            "x 100 mil D.A." = "100K",
      #                            "x 1 millón D.A." = "1M",
      #                            "x 10 millones D.A." = "10M"),
      #                selected = "x 1 millón D.A."),
      #
      #   #~ b. Selector tipo de cálculo ----
      #   selectInput("metric_filter", "Elegir cálculo a mostrar:",
      #                choices = c("Tasa", "Total", "Porcentaje"),
      #                selected = "Total"),
      #
      #   #~ c. Selector de transformación ----
      #   selectInput("suaviza_filter", "Elegir transformación:",
      #                choices = c("Origial", "Logaritmo", "Media móvil", "LOESS"),
      #                selected = "Original"),
      # ),
      #
      # # 2.6.3 Acordion Mapas ----

      # accordionItem(
      #   title = "Mapas",
      #   status = "primary",
      #   solidHeader = FALSE,
      #   collapsible = TRUE,
      #   collapsed = TRUE,
      #
      #   #~ a. Tipo mapa ----
      #   selectInput("basemap", "Tipo de mapa base:",
      #               choices = c("OpenStreetMap" = "OpenStreetMap",
      #                           "Satélite" = "Esri.WorldImagery"),
      #               selected = "OpenStreetMap"),
      #
      #   #~ b. Transparencia ----
      #     sliderInput("transparencia", "Transparencia:",
      #                 min = 0, max = 1, value = 0.7, step = 0.1),
      #
      #   #~ c. Etiquetas ----
      #   checkboxInput("mostrar_etiquetas", "Mostrar etiquetas en el mapa", value = TRUE)
      # )
      # )
    )
  ),


  # 2.7 Footer ---------------------------------------------------------------------------------------------------

  dashboardFooter(
    left = tags$div(
      style = "display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 5px 10px; height: 15px;", # Ajusta el padding y la altura

      # Texto alineado a la izquierda
      tags$div(
        HTML("© <a href='https://www.paho.org/es' style='text-decoration: underline;'>Organización Panamericana de la Salud</a>. Todos los derechos reservados.")
      ),

      # Iconos de redes sociales alineados a la derecha
      tags$div(
        style = "text-align: right;",
        "Síguenos en ",
        tags$a(href = "https://www.twitter.com/opsoms", icon("twitter"), style = "margin-left: 10px;"),
        tags$a(href = "https://www.facebook.com/PAHOWHO", icon("facebook"), style = "margin-left: 10px;"),
        tags$a(href = "https://www.instagram.com/opspaho", icon("instagram"), style = "margin-left: 10px;"),
        tags$a(href = "https://www.linkedin.com/company/pan-american-health-organization", target = "_blank", icon("linkedin"), style = "margin-left: 10px;"),
        tags$a(href = "https://www.youtube.com/pahopin", target = "_blank", icon("youtube"), style = "margin-left: 10px;")
      )
    )
  )
)
