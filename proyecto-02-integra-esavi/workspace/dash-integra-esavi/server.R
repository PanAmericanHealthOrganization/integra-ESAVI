
# -------------------------------------------------------------------------------------------------------------- -
# Script: server.R ----
# Version: 1.0
# Pais: País
# Epidemiologo: Analía Cáceres | caceresanali@paho.org 
# Científico de Datos: Carlos Falla | fallacar@paho.org
# Date: 2025-06-30
# Descripcion: define la interface de usuario (ui) de la aplicacion
# -------------------------------------------------------------------------------------------------------------- -


# -------------------------------------------------------------------------------------------------------------- -
# Carga de datos del global ----
# -------------------------------------------------------------------------------------------------------------- -
  
  source("global.R")  # Cargar datos y variables globales


# -------------------------------------------------------------------------------------------------------------- -
# SERVER ----
# -------------------------------------------------------------------------------------------------------------- -

  server <- function(input, output, session) {
    
    
  # Observadores iniciales ---------------------------------------------------------------------------------------
    
    datos_mapa <- reactiveVal(NULL)
      
    # observe({
    #   print("----- Observador de seguimiento inicial -----")
    #   print("dosis_global:")
    #   print(names(dosis_global))
    #   print("datos_global:")
    #   print(names(datos_global))
    #   print("geodatos:")
    #   print(names(geodatos))
    # })

    
    # función para activar el controlbar
      
    observeEvent(input$open_controlbar, {
      shinydashboardPlus::updateControlbar(id = "controlbar", session = session)
    })

    
    # Boton para limpiar filtro de vacunas en seccion vacunas
    
    observeEvent(input$limpiar_filtro_vac_vacuna, {
      updateSelectizeInput(
        session,
        inputId = "selectInput_vacuna_vac",
        selected = character(0)
      )
    })
    
    
  # ---------------------------------------------------------------------------- -
  # 1. Bloque de Controles -------------------------------------------------- ----
  # ---------------------------------------------------------------------------- -
    
    # 1.1 Control línea de tiempo ----  
      
      output$time_control <- renderUI({
        
        req(datos_global) # Valida que datos_global existe
          
        if (input$time_filter == "Año notificación") {
          años <- unique(datos_global$añoNoti)
          años <- años[!is.na(años)]  # Remueve NAs
          
          req(length(años) > 0)  # Valida que hay datos
          
          sliderInput("slider_anio", 
                      "Año notificación:",
                      min = min(años, na.rm = TRUE), 
                      max = max(años, na.rm = TRUE),
                      value = c(min(años, na.rm = TRUE), 
                                max(años, na.rm = TRUE)),
                      sep = "")
          
        } else if (input$time_filter == "Periodo Notificación") {
          periodos <- unique(datos_global$periodoNoti)
          periodos <- periodos[!is.na(periodos)]
          
          req(length(periodos) > 0)
          
          sliderInput("slider_periodo", 
                      "Periodo Notificación:",
                      min = min(periodos, na.rm = TRUE), 
                      max = max(periodos, na.rm = TRUE),
                      value = c(min(periodos, na.rm = TRUE), 
                                max(periodos, na.rm = TRUE)),
                      sep = "")
          
        } else {
          semanas <- unique(datos_global$semEpiNoti)
          semanas <- semanas[!is.na(semanas)]
          
          req(length(semanas) > 0)
          
          sliderInput("slider_semEpi", 
                      "Semana epidemiológica:",
                      min = min(semanas, na.rm = TRUE), 
                      max = max(semanas, na.rm = TRUE),
                      value = c(min(semanas, na.rm = TRUE), 
                                max(semanas, na.rm = TRUE)),
                      sep = "")
        }
      })
      

    
    
    
  # ---------------------------------------------------------------------------- -
  # 2. Bloque de Filtros ---------------------------------------------------- ----
  # ---------------------------------------------------------------------------- -
        
    # 2.1 Reactive para el estado de filtros ----
       
      rv <- reactiveValues(
        filtros_estado = list(),
        reset_count = 0
      )
      
    # 2.2 Inicialización de estados de filtros ----
      
      observe({
        if (length(rv$filtros_estado) == 0) {
          for (nombre_filtro in names(filtros_config)) {
            rv$filtros_estado[[nombre_filtro]] <- list(
              valores_disponibles = obtener_valores_disponibles(nombre_filtro),
              seleccionados = NULL
            )
          }
        }
      })
      
    # 2.3 Función obtener valores disponibles filtros ----
      
      obtener_valores_disponibles <- function(nombre_filtro, datos = datos_global) {
        columna <- filtros_config[[nombre_filtro]]$columna
        sort(unique(datos[[columna]]))
      }
      
    # 2.4 Reset general de filtros ----
    
      observeEvent(input$reset_general, {
        print("Iniciando reset general")  # Debugging
        
        # Actualizar el contador de resets
        rv$reset_count <- rv$reset_count + 1
        
        # Reiniciar cada filtro
        for (nombre_filtro in names(filtros_config)) {
          filtro <- filtros_config[[nombre_filtro]]
          print(paste("Reseteando", filtro$id))  # Debugging
          
          # Actualizar el estado en rv
          rv$filtros_estado[[nombre_filtro]]$seleccionados <- NULL
          
          # Actualizar el input
          updateSelectizeInput(
            session,
            filtro$id,
            choices = rv$filtros_estado[[nombre_filtro]]$valores_disponibles,
            selected = character(0)
          )
        }
        
        print("Reset general completado")  # Debugging
      })
      
    # 2.5 Observa cambios en los filtros individuales ----
      
      lapply(names(filtros_config), function(nombre_filtro) {
        filtro <- filtros_config[[nombre_filtro]]
          
        # 2.5.1 Reset individual ----
          
          observeEvent(input[[paste0("reset_", filtro$id)]], {
            rv$filtros_estado[[nombre_filtro]]$seleccionados <- NULL
            updateSelectizeInput(
              session,
              filtro$id,
              choices = rv$filtros_estado[[nombre_filtro]]$valores_disponibles,
              selected = character(0)
            )
          })
          
        # 2.5.2 Observar cambios en la selección ----
          
          observeEvent(input[[filtro$id]], {
            rv$filtros_estado[[nombre_filtro]]$seleccionados <- input[[filtro$id]]
          })
      })
      
      
      
  # ---------------------------------------------------------------------------- -
  # 3. Aplicación de filtros y actualización datos -------------------------- ----
  # ---------------------------------------------------------------------------- -
    
    # 3.1 Datos filtrados usando el estado reactivo ----
      
      datos_filtrados <- reactive({
        datos <- datos_global
        dosis <- dosis_global
        geodatos <- geodatos_global
        

      # 3.1.1 Crear variables iniciales para los KPIs ----
        
        vFini          <- min(dosis$fecha_sem_epi, na.rm = TRUE)
        vFfin          <- max(dosis$fecha_sem_epi, na.rm = TRUE)
        vDosis         <- sum(dosis$NumDosis, na.rm = TRUE)
        vNotif         <- length(unique(datos$numeroNotificacao))
        vNotif_G       <- length(unique(datos$numeroNotificacao[datos$marca_grave == "Grave"]))
        vNotif_NG      <- length(unique(datos$numeroNotificacao[datos$marca_grave == "No grave"]))
        vNotif_muerte  <- length(unique(datos$numeroNotificacao[datos$marca_muerte == "Sí"]))
        vNotif_menores <- length(unique(datos$numeroNotificacao[datos$marca_menores == "Sí"]))
        vNotif_embaraz <- length(unique(datos$numeroNotificacao[datos$marca_embarazo == "Sí"]))
        vEstados       <- length(unique(datos$geonoti))
        vVacunas       <- length(unique(datos$id_vaccine))
        vTvacunas      <- length(unique(datos$nomcomv))
        
        # Usar tryCatch para manejar posibles errores en las operaciones con doseImunobiologico
        
        tryCatch({
          vdosis1 <- length(unique(datos[datos$doseImunobiologico == 1, ]$id_vaccine))
          vdosis2 <- length(unique(datos[datos$doseImunobiologico == 2, ]$id_vaccine))
          vdosis3 <- length(unique(datos[datos$doseImunobiologico == 3, ]$id_vaccine))
          vdosisOtr <- length(unique(datos[datos$doseImunobiologico > 3, ]$id_vaccine))
        }, error = function(e) {
          # En caso de error, asignar valores predeterminados
          vdosis1 <<- 0
          vdosis2 <<- 0
          vdosis3 <<- 0
          vdosisOtr <<- 0
          warning("Error al procesar doseImunobiologico: ", e$message)
        })
        
        vEventos <- length(unique(datos$event_id))
        vPTs     <- length(unique(datos$pt))
        vHLTs    <- length(unique(datos$hlt))
        vHLGTs   <- length(unique(datos$hlgt))
        vSOCs    <- length(unique(datos$soc))
        vSMQs    <- length(unique(datos$smq))
      
        
        # Preparar datos para disproporcionalidad
        
        aux_vac <- as.data.frame(unique(datos$nomcomv)) %>% 
          rename(nomcomv = `unique(datos$nomcomv)`) %>% 
          mutate(cod_vac = row_number())
        
        aux_pt  <- as.data.frame(unique(datos$pt)) %>% 
          rename(pt = `unique(datos$pt)`) %>% 
          mutate(cod_pt = row_number())
        
        aux_smq <- as.data.frame(unique(datos$smq)) %>% 
          rename(smq = `unique(datos$smq)`) %>% 
          mutate(cod_smq = row_number())
        
        datos_disprop <- datos %>% 
          select(event_id, pt, smq, nomcomv)
        
        datos_disprop <- merge(datos_disprop, aux_vac, by = "nomcomv", all.x = TRUE)
        datos_disprop <- merge(datos_disprop, aux_pt, by = "pt", all.x = TRUE)
        datos_disprop <- merge(datos_disprop, aux_smq, by = "smq", all.x = TRUE)
        datos_disprop <- datos_disprop %>% 
          unique() %>% 
          rename(PT = pt, SMQ = smq)
        
        # Limpiar variables temporales
        rm(aux_vac, aux_pt, aux_smq) 
        
        
        
      # 3.1.2 Aplicar filtros ----
        
        for (nombre_filtro in names(filtros_config)) {
          filtro <- filtros_config[[nombre_filtro]]
          valores_seleccionados <- rv$filtros_estado[[nombre_filtro]]$seleccionados
          
          if (!is.null(valores_seleccionados) && length(valores_seleccionados) > 0) {
            # Aplicar filtro a los datos
            datos <- datos %>% 
              filter(.data[[filtro$columna]] %in% valores_seleccionados)
            
            # Aplicar filtro a las dosis
            if (filtro$columna %in% names(dosis)) {
              dosis <- dosis %>% 
                filter(.data[[filtro$columna]] %in% valores_seleccionados)
            }
            
            # Actualizar KPIs después de aplicar el filtro
            vFini     <- min(datos$periodoNoti, na.rm = TRUE)
            vFfin     <- max(datos$periodoNoti, na.rm = TRUE)
            vNotif    <- length(unique(datos$numeroNotificacao))
            vNotif_G  <- length(unique(datos$numeroNotificacao[datos$marca_grave == "Grave"]))
            vNotif_NG <- length(unique(datos$numeroNotificacao[datos$marca_grave == "No grave"]))
            vNotif_muerte  <- length(unique(datos$numeroNotificacao[datos$marca_muerte == "Sí"]))
            vNotif_menores <- length(unique(datos$numeroNotificacao[datos$marca_menores == "Sí"]))
            vNotif_embaraz <- length(unique(datos$numeroNotificacao[datos$marca_embarazo == "Sí"]))
            vEstados       <- length(unique(datos$geonoti))
            vVacunas       <- length(unique(datos$id_vaccine))
            vTvacunas      <- length(unique(datos$nomcomv))
            
            # Proteger operaciones con doseImunobiologico
            tryCatch({
              vdosis1   <- length(unique(datos[datos$doseImunobiologico == 1, ]$id_vaccine))
              vdosis2   <- length(unique(datos[datos$doseImunobiologico == 2, ]$id_vaccine))
              vdosis3   <- length(unique(datos[datos$doseImunobiologico == 3, ]$id_vaccine))
              vdosisOtr <- length(unique(datos[datos$doseImunobiologico > 3, ]$id_vaccine))
            }, error = function(e) {
              vdosis1   <<- 0
              vdosis2   <<- 0
              vdosis3   <<- 0
              vdosisOtr <<- 0
              warning("Error al recalcular doseImunobiologico después del filtro: ", e$message)
            })
            
            vEventos <- length(unique(datos$event_id))
            vPTs     <- length(unique(datos$pt))
            vHLTs    <- length(unique(datos$hlt))
            vHLGTs   <- length(unique(datos$hlgt))
            vSOCs    <- length(unique(datos$soc))
            vSMQs    <- length(unique(datos$smq))
            
            # Recalcular datos_disprop
            aux_vac <- as.data.frame(unique(datos$nomcomv)) %>% 
              rename(nomcomv = `unique(datos$nomcomv)`) %>% 
              mutate(cod_vac = row_number())
            
            aux_pt  <- as.data.frame(unique(datos$pt)) %>% 
              rename(pt = `unique(datos$pt)`) %>% 
              mutate(cod_pt = row_number())
            
            aux_smq <- as.data.frame(unique(datos$smq)) %>% 
              rename(smq = `unique(datos$smq)`) %>% 
              mutate(cod_smq = row_number())
            
            datos_disprop <- datos %>% 
              select(event_id, pt, smq, nomcomv)
            
            datos_disprop <- merge(datos_disprop, aux_vac, by = "nomcomv", all.x = TRUE)
            datos_disprop <- merge(datos_disprop, aux_pt, by = "pt", all.x = TRUE)
            datos_disprop <- merge(datos_disprop, aux_smq, by = "smq", all.x = TRUE)
            datos_disprop <- datos_disprop %>% 
              unique() %>% 
              rename(PT = pt, SMQ = smq)
            
            rm(aux_vac, aux_pt, aux_smq)
          }
        }
        
        # Calcular dosis totales de manera segura
        vDosis <- sum(dosis$NumDosis, na.rm = TRUE)
          
        # Devolver la lista completa de datos y métricas
        return(list(
          dosis         = dosis,
          datos         = datos,
          geodatos      = geodatos,
          datos_disprop = datos_disprop,
          vNotif        = vNotif,
          vNotif_G      = vNotif_G,
          vNotif_NG     = vNotif_NG,
          vFini         = vFini,
          vFfin         = vFfin,
          vDosis        = vDosis,
          vVacunas      = vVacunas,
          vTvacunas     = vTvacunas,
          vdosis1       = vdosis1,
          vdosis2       = vdosis2,
          vdosis3       = vdosis3,
          vdosisOtr     = vdosisOtr,
          vEventos      = vEventos,
          vPTs          = vPTs,
          vHLTs         = vHLTs,
          vHLGTs        = vHLGTs,
          vSOCs         = vSOCs,
          vSMQs         = vSMQs,
          vEstados      = vEstados,
          vNotif_muerte  = vNotif_muerte,
          vNotif_menores = vNotif_menores,
          vNotif_embaraz = vNotif_embaraz
        ))
      })

      
      
    # 3.2 Actualización del observador para los filtros ----
      observe({
        rv$reset_count  # Forzar reactividad con el contador de resets
        
        # Evitar errores de observador recursivo
        isolate({
          for (nombre_filtro in names(filtros_config)) {
            # Clonar los datos originales para este proceso
            datos_temp <- datos_global
            
            # Aplicar todos los filtros excepto el actual
            for (otro_nombre in setdiff(names(filtros_config), nombre_filtro)) {
              valores_seleccionados <- rv$filtros_estado[[otro_nombre]]$seleccionados
              if (!is.null(valores_seleccionados) && length(valores_seleccionados) > 0) {
                columna <- filtros_config[[otro_nombre]]$columna
                if (columna %in% names(datos_temp)) {  # Verificar que la columna existe
                  datos_temp <- datos_temp %>%
                    filter(.data[[columna]] %in% valores_seleccionados)
                }
              }
            }
            
            # Actualizar valores disponibles de manera segura
            tryCatch({
              columna <- filtros_config[[nombre_filtro]]$columna
              if (columna %in% names(datos_temp)) {  # Verificar que la columna existe
                valores_disponibles <- sort(unique(datos_temp[[columna]]))
                rv$filtros_estado[[nombre_filtro]]$valores_disponibles <- valores_disponibles
                
                # Obtener selecciones actuales y actualizar manteniendo selecciones válidas
                valores_seleccionados <- rv$filtros_estado[[nombre_filtro]]$seleccionados
                
                updateSelectizeInput(
                  session,
                  filtros_config[[nombre_filtro]]$id,
                  choices = valores_disponibles,
                  selected = if (!is.null(valores_seleccionados)) {
                    intersect(valores_seleccionados, valores_disponibles)
                  } else {
                    NULL
                  }
                )
              } else {
                # Si la columna no existe, no intentar actualizar
                warning("La columna ", columna, " no existe en los datos")
              }
            }, error = function(e) {
              warning("Error al actualizar filtro ", nombre_filtro, ": ", e$message)
            })
          }
        })
      })
      
      
      
    # 3.3 Actualización datos disproporcionalidad ----
      
      observe({
        req(datos_filtrados())
        
        tryCatch({
          paso <- datos_filtrados()$datos_disprop
          
          # Verificar que los datos tienen la estructura esperada
          if (is.null(paso) || nrow(paso) == 0) {
            updateSelectizeInput(session, "filtro_cmq",
                                choices = character(0),
                                selected = character(0))
            updateSelectizeInput(session, "filtro_vacuna",
                                choices = character(0),
                                selected = character(0))
            return()
          }
          
          # Actualizar filtro de evento PT
          if ("PT" %in% names(paso)) {
            choices_pt <- sort(unique(na.omit(paso$PT)))
            updateSelectizeInput(session, "filtro_cmq",
                                choices = choices_pt,
                                selected = character(0))
          }
          
          # Actualizar filtro de vacuna
          if ("nomcomv" %in% names(paso)) {
            choices_vac <- sort(unique(na.omit(paso$nomcomv)))
            updateSelectizeInput(session, "filtro_vacuna",
                                choices = choices_vac,
                                selected = character(0))
          }
        }, error = function(e) {
          warning("Error actualizando filtros de disproporcionalidad: ", e$message)
        })
      })
      

      observeEvent(input$btn_limpiar_filtro_cmq, {
        updateSelectizeInput(session, "filtro_cmq", selected = character(0))  # Limpiar la selección
        updateSelectizeInput(session, "filtro_vacuna", selected = character(0))  # Limpiar la selección
      })
      
      
      datos_filtrados_disprop <- reactive({
        
        req(datos_filtrados(), input$tipo_analisis, input$nivel_analisis)
      
        
        # 3.3.1 Seleccion y filtrado de datos ----
          
        paso <- datos_filtrados()$datos_disprop
        
        aux_vac <- paso %>% select(cod_vac, nomcomv) %>% unique() %>% rename(Vacuna = nomcomv)
        aux_smq <- paso %>% select(cod_smq, SMQ) %>% unique() %>% rename(cod_meddra_term = cod_smq)
        aux_pt  <- paso %>% select(cod_pt, PT) %>% unique() %>% rename(cod_meddra_term = cod_pt)
        

        # 3.3.1 Seleccion Nivel de análisis ----

        if (input$nivel_analisis == "analisis_pt") {

          df_disprop <- dcast(paso, cod_vac + cod_pt ~ ., fun.aggregate = function(x) length(unique(x)), value.var = "event_id")
          aux_df <- aux_pt

        } else if (input$nivel_analisis == "analisis_smq") {

          df_disprop <- dcast(paso, cod_vac + cod_smq ~ ., fun.aggregate = function(x) length(unique(x)), value.var = "event_id")
          aux_df <- aux_smq

        } else { #(input$nivel_analisis == "analisis_cmq")

          # Verificar si el selectizeInput tiene valores seleccionados
          if (is.null(input$filtro_cmq) || length(input$filtro_cmq) == 0) {
            return(NULL)  # No se ha seleccionado nada
          }
          # Filtrar o procesar los datos según los valores seleccionados
          df_disprop <- paso %>% mutate(cod_cmq = fifelse(PT %in% input$filtro_cmq,1,2),
                                        CMQ = fifelse(PT %in% input$filtro_cmq,"CMQ de interés","Otros eventos"))
          aux_df <- df_disprop %>% select(cod_cmq, CMQ) %>% unique() %>% rename(cod_meddra_term = cod_cmq)
          df_disprop <- dcast(df_disprop, cod_vac + cod_cmq ~ ., fun.aggregate = function(x) length(unique(x)), value.var = "event_id")
        }


        # 3.3.2 datos en formato PhViD ----

        df_disprop <- as.PhViD(df_disprop)

        # 3.3.3 Seleccion Tipo de análisis (Método Dispropor) ----

        if (input$tipo_analisis == "analisis_prr" | input$tipo_analisis == "analisis_ror") {
            
          if (input$tipo_analisis == "analisis_prr") {
            
            paso   <- tryCatch(expr = {apply_PRR_C1(df_disprop)}, error = function(e) {df_aux_PRR_C1})
            
          } else { #(input$tipo_analisis == "analisis_ror")

            paso   <- tryCatch(expr = {apply_ROR_C1(df_disprop)}, error = function(e) {df_aux_PRR_C1})

          }

          paso   <- merge(paso,aux_vac, by = "cod_vac", all.x = TRUE)
          paso   <- merge(paso,aux_df, by = "cod_meddra_term", all.x = TRUE)
          paso   <- paso %>% select(9,10,3,4,5,6,7,8)
          
        } else {

          if (input$tipo_analisis == "analisis_bcpnn_norm") {

            paso   <- tryCatch(expr = {apply_BCPNN_E1_C1(df_disprop)}, error = function(e) {df_aux_PRR_C1})

          } else { #(input$tipo_analisis == "analisis_bcpnn_mc")

            paso   <- tryCatch(expr = {apply_BCPNN_E2_C1(df_disprop)}, error = function(e) {df_aux_PRR_C1})

          }

          paso   <- merge(paso,aux_vac, by = "cod_vac", all.x = TRUE)
          paso   <- merge(paso,aux_df, by = "cod_meddra_term", all.x = TRUE)
          paso   <- paso %>% select(7,8,3,4,5,6)

        }

        rm(aux_vac,aux_smq,aux_pt)
        
        if (is.null(input$filtro_vacuna) || length(input$filtro_vacuna) == 0) {
          paso
        } else {
          paso <- paso %>% filter(Vacuna %in% input$filtro_vacuna)
        }

        if (input$nivel_analisis == "analisis_cmq") {
          paso <- paso %>% filter(CMQ != "Otros eventos")
        } else {
          return(paso)
        }
      
      })  
      

    
  # ---------------------------------------------------------------------------- -
  # 4. Creación de Boxes para Periodo y KPIs -------------------------------- ----
  # ---------------------------------------------------------------------------- -
    
    # 4.1 Outputs para pasar a la funcion de boxes ----
      
      # Funciones que contienen todos los outputs para pasar a la funcion de boxes
        
      # 4.1.1 Outputs para pasar a la funcion de periodo box ----
        
        create_periodo_output <- function(id_prefix) {
          ns <- NS(id_prefix)
          
          output[[ns("fecha_ini")]] <- renderText({
            req(datos_filtrados())
            valor <- datos_filtrados()$vFini
            #valor <- as.Date(valor, format="%Y-%m-%d")
            format(as.Date(valor), "%d-%m-%Y")
          })
          
          output[[ns("fecha_fin")]] <- renderText({
            req(datos_filtrados())
            valor <- datos_filtrados()$vFfin
            #valor <- as.Date(valor, format="%Y-%m-%d")
            format(as.Date(valor), "%d-%m-%Y")
          })
        }
        
      # 4.1.2 Outputs para pasar a la funcion de kips box ----
      
        create_kpi_outputs <- function(id_prefix) {
          ns <- NS(id_prefix)
          
          output[[ns("total_dosis")]] <- renderText({
            req(datos_filtrados())
            valor <- datos_filtrados()$vDosis
            valor <- format_num(valor,0)
          })
            
          output[[ns("total_noti")]] <- renderText({
            req(datos_filtrados())
            valor <- datos_filtrados()$vNotif
            valor <- format_num(valor,0)
          })
          
          output[[ns("total_noti_Graves")]] <- renderText({
            req(datos_filtrados())
            valor <- datos_filtrados()$vNotif_G
            valor <- format_num(valor,0)
          })
          
          output[[ns("total_noti_Ngraves")]] <- renderText({
            req(datos_filtrados())
            valor <- datos_filtrados()$vNotif_NG
            valor <- format_num(valor,0)
          })
          
          output[[ns("porcent_noti_Graves")]] <- renderText({
            req(datos_filtrados())
            valor <- datos_filtrados()$vNotif_G/datos_filtrados()$vNotif
            valor <- format_porcent(valor)
          })
          
          output[[ns("porcent_noti_Ngraves")]] <- renderText({
            req(datos_filtrados())
            valor <- datos_filtrados()$vNotif_NG/datos_filtrados()$vNotif
            valor <- format_porcent(valor)
          })
          
          output[[ns("tasa_noti")]] <- renderText({
            req(datos_filtrados())
            valor <- datos_filtrados()$vNotif/datos_filtrados()$vDosis * 1000000
            valor <- format_num(valor,1)
          })
          
          output[[ns("tasa_noti_Graves")]] <- renderText({
            req(datos_filtrados())
            valor <- datos_filtrados()$vNotif_G/datos_filtrados()$vDosis * 1000000
            valor <- format_num(valor,1)
          })
          
          output[[ns("tasa_noti_Ngraves")]] <- renderText({
            req(datos_filtrados())
            valor <- datos_filtrados()$vNotif_NG/datos_filtrados()$vDosis * 1000000
            valor <- format_num(valor,1)
          })
        }
          
        
        # 4.1.3 Outputs para pasar a la funcion de kips generales ----
      
        create_kpi_gen_outputs <- function(id_prefix) {
          ns <- NS(id_prefix)
          
          output[[ns("total_estados")]] <- renderText({
            req(datos_filtrados())
            valor <- datos_filtrados()$vEstados
            valor <- format_num(valor,0)
          })
                    
          output[[ns("total_vacunas")]] <- renderText({
            req(datos_filtrados())
            valor <- datos_filtrados()$vVacunas
            valor <- format_num(valor,0)
          })
            
          # output[[ns("total_tipos_vacuna")]] <- renderText({
          #   req(datos_filtrados())
          #   valor <- datos_filtrados()$vTvacunas
          #   valor <- format_num(valor,0)
          # })
          
          output[[ns("total_eventos")]] <- renderText({
            req(datos_filtrados())
            valor <- datos_filtrados()$vEventos
            valor <- format_num(valor,0)
          })
          
          # output[[ns("total_pts")]] <- renderText({
          #   req(datos_filtrados())
          #   valor <- datos_filtrados()$vPTs
          #   valor <- format_num(valor,0)
          # })
          
          output[[ns("total_muertes")]] <- renderText({
            req(datos_filtrados())
            valor <- datos_filtrados()$vNotif_muerte
            valor <- format_num(valor,0)
          })
          
          output[[ns("total_embarazadas")]] <- renderText({
            req(datos_filtrados())
            valor <- datos_filtrados()$vNotif_embaraz
             valor <- format_num(valor,0)
          })
          
          output[[ns("total_menores")]] <- renderText({
            req(datos_filtrados())
            valor <- datos_filtrados()$vNotif_menores
            valor <- format_num(valor,0)
          })
        }
        
        
        # 4.1.4 Outputs para pasar a la funcion de kips de vacunas ----
      
        create_kpi_vacunas_outputs <- function(id_prefix) {
          ns <- NS(id_prefix)
          
          output[[ns("total_vacunas")]] <- renderText({
            req(datos_filtrados())
            valor <- datos_filtrados()$vVacunas
            valor <- format_num(valor,0)
          })
            
          output[[ns("total_tipos_vacuna")]] <- renderText({
            req(datos_filtrados())
            valor <- datos_filtrados()$vTvacunas
            valor <- format_num(valor,0)
          })
            
          output[[ns("total_1_dosis")]] <- renderText({
            req(datos_filtrados())
            valor <- datos_filtrados()$vdosis1
            valor <- format_num(valor,0)
          })
            
          output[[ns("total_2_dosis")]] <- renderText({
            req(datos_filtrados())
            valor <- datos_filtrados()$vdosis2
            valor <- format_num(valor,0)
          })
            
          output[[ns("total_3_dosis")]] <- renderText({
            req(datos_filtrados())
            valor <- datos_filtrados()$vdosis3
            valor <- format_num(valor,0)
          })
            
          output[[ns("total_otras_dosis")]] <- renderText({
            req(datos_filtrados())
            valor <- datos_filtrados()$vdosisOtr
            valor <- format_num(valor,0)
          })
        }
        
        
        # 4.1.5 Outputs para pasar a la funcion de kips generales ----
      
        create_kpi_eventos_outputs <- function(id_prefix) {
          ns <- NS(id_prefix)
          
          output[[ns("total_eventos")]] <- renderText({
            req(datos_filtrados())
            valor <- datos_filtrados()$vEventos
            valor <- format_num(valor,0)
          })
          
          output[[ns("total_pts")]] <- renderText({
            req(datos_filtrados())
            valor <- datos_filtrados()$vPTs
            valor <- format_num(valor,0)
          })
          
          output[[ns("total_hlts")]] <- renderText({
            req(datos_filtrados())
            valor <- datos_filtrados()$vHLTs
            valor <- format_num(valor,0)
          })
          
          output[[ns("total_hlgts")]] <- renderText({
            req(datos_filtrados())
            valor <- datos_filtrados()$vHLGTs
             valor <- format_num(valor,0)
          })
          
          output[[ns("total_socs")]] <- renderText({
            req(datos_filtrados())
            valor <- datos_filtrados()$vSOCs
            valor <- format_num(valor,0)
          })
          
          output[[ns("total_smqs")]] <- renderText({
            req(datos_filtrados())
            valor <- datos_filtrados()$vSMQs
            valor <- format_num(valor,0)
          })
        }
        
        
      # 4.2 Creación de los outputs para cada tab ----
      
        create_periodo_output("tab_dash")
        create_periodo_output("tab_desc")
        create_periodo_output("tab_even")
        create_periodo_output("tab_vacc")
        create_periodo_output("tab_antc")
        create_periodo_output("tab_sena")
        
        create_kpi_outputs("tab_dash")
        create_kpi_outputs("tab_desc")
        create_kpi_outputs("tab_even")
        create_kpi_outputs("tab_vacc")
        create_kpi_outputs("tab_antc")
        create_kpi_outputs("tab_sena")
        
        create_kpi_gen_outputs("tab_dash_gen")
        create_kpi_vacunas_outputs("tab_vaccs")
        create_kpi_eventos_outputs("tab_events")
        
        
        
  # ---------------------------------------------------------------------------- -
  # 5. Subsets de datos ----------------------------------------------------- ----
  # ---------------------------------------------------------------------------- -

    # 5.1 Función de Agrupación de datos para crear subsets ----
      
      procesarDatosGraficos <- function(datos_dosis = NULL,
                                        datos_noti = NULL,
                                        agrup_dosis = NULL,
                                        agrup_noti = NULL,
                                        agrup_es_fecha = FALSE,
                                        formato_fecha = "timestamp",
                                        campo_filtro_noti = NULL,
                                        filtro_noti = NULL,
                                        calcular_dosis = TRUE,    
                                        calcular_notif = TRUE,
                                        unidad_tasa = f_unidad_tasa("1M")) {
        
        resultado <- list()
        
        # Verificar si los datos están disponibles y tienen la estructura esperada
        if (calcular_dosis && (!is.null(datos_dosis) && !is.null(agrup_dosis))) {
          tryCatch({
            # Convertir a data.table si no lo es
            if (!is.data.table(datos_dosis)) {
              paso_da <- as.data.table(datos_dosis)
            } else {
              paso_da <- copy(datos_dosis)  # Hacer una copia para evitar modificaciones por referencia
            }
            
            # Verificar que todas las columnas de agrupación existen
            columnas_faltantes <- setdiff(agrup_dosis, names(paso_da))
            if (length(columnas_faltantes) > 0) {
              warning("Las siguientes columnas no existen en datos_dosis: ", 
                      paste(columnas_faltantes, collapse = ", "))
              # Crear columnas faltantes con NA
              for (col in columnas_faltantes) {
                paso_da[[col]] <- NA
              }
            }
            
            # Realizar la agregación
            paso_da <- paso_da[, .(DOSIS = sum(NumDosis, na.rm = TRUE)), by = agrup_dosis]
            
            # Reemplazar NA por "No especificado"
            for (col in agrup_dosis) {
              # Convertir NA o cadenas vacías a "No especificado"
              paso_da[is.na(get(col)) | get(col) == "", (col) := "No especificado"]
            }
            
            # Aplicar formato de fecha si es necesario
            if (agrup_es_fecha) {
              paso_da <- formatearFechas(paso_da, agrup_dosis, formato_fecha)
            }
            
            resultado$r_dosis <- paso_da
          }, error = function(e) {
            warning("Error procesando datos_dosis: ", e$message)
            # Crear un data.table vacío con la estructura mínima necesaria
            resultado$r_dosis <- data.table(DOSIS = numeric(0))
            for (col in agrup_dosis) {
              resultado$r_dosis[[col]] <- character(0)
            }
          })
        }
        
        # Procesar datos de notificaciones si se solicita
        if (calcular_notif && (!is.null(datos_noti) && !is.null(agrup_noti))) {
          tryCatch({
            # Convertir a data.table si no lo es
            if (!is.data.table(datos_noti)) {
              paso_not <- as.data.table(datos_noti)
            } else {
              paso_not <- copy(datos_noti)  # Hacer una copia para evitar modificaciones por referencia
            }
            
            # Verificar que todas las columnas de agrupación existen
            columnas_faltantes <- setdiff(agrup_noti, names(paso_not))
            if (length(columnas_faltantes) > 0) {
              warning("Las siguientes columnas no existen en datos_noti: ", 
                      paste(columnas_faltantes, collapse = ", "))
              # Crear columnas faltantes con NA
              for (col in columnas_faltantes) {
                paso_not[[col]] <- NA
              }
            }
            
            # Aplicar filtro si se especifica
            if (!is.null(campo_filtro_noti) && !is.null(filtro_noti)) {
              if (campo_filtro_noti %in% names(paso_not)) {
                paso_not <- paso_not[get(campo_filtro_noti) == filtro_noti]
              } else {
                warning("La columna de filtro ", campo_filtro_noti, " no existe en datos_noti")
              }
            }
            
            # Realizar la agregación
            paso_not <- paso_not[, .(NOTIF = uniqueN(numeroNotificacao)), by = agrup_noti]
            
            # Reemplazar NA por "No especificado"
            for (col in agrup_noti) {
              # Convertir NA o cadenas vacías a "No especificado"
              paso_not[is.na(get(col)) | get(col) == "", (col) := "No especificado"]
            }
            
            # Aplicar formato de fecha si es necesario
            if (agrup_es_fecha) {
              paso_not <- formatearFechas(paso_not, agrup_noti, formato_fecha)
            }
            
            resultado$r_notif <- paso_not
          }, error = function(e) {
            warning("Error procesando datos_noti: ", e$message)
            # Crear un data.table vacío con la estructura mínima necesaria
            resultado$r_notif <- data.table(NOTIF = numeric(0))
            for (col in agrup_noti) {
              resultado$r_notif[[col]] <- character(0)
            }
          })
        }
        
        # Combinar los resultados si se calcularon ambos
        if (calcular_dosis && calcular_notif && 
            !is.null(resultado$r_dosis) && !is.null(resultado$r_notif)) {
          tryCatch({
            paso <- merge(resultado$r_dosis, 
                          resultado$r_notif, 
                          by.x = agrup_dosis, 
                          by.y = agrup_noti, 
                          all = TRUE)

            # Reemplazar NA con 0 en columnas numéricas
            paso <- as.data.frame(paso)
            paso <- paso %>% mutate_if(is.numeric, ~replace(., is.na(.), 0))
            paso <- as.data.table(paso)

            # Calcular métricas derivadas
            vTdsis <- sum(paso$DOSIS, na.rm = TRUE)
            vTnoti <- sum(paso$NOTIF, na.rm = TRUE)
            
            # Evitar división por cero y calcula individualmente las proporciones y la tasa
            for (i in 1:nrow(paso)) {
              paso$pDOSIS[i] <- ifelse(vTdsis > 0, paso$DOSIS[i] / vTdsis, 0)
              paso$pNOTIF[i] <- ifelse(vTnoti > 0, paso$NOTIF[i] / vTnoti, 0)
              paso$TASA[i] <- ifelse(paso$DOSIS[i] > 0, paso$NOTIF[i] / paso$DOSIS[i] * unidad_tasa, 0)
            }
            
            resultado$r_combi <- paso
          }, error = function(e) {
            warning("Error combinando datos: ", e$message)
            # Crear un data.table vacío con estructura básica
            resultado$r_combi <- data.table(
              DOSIS = numeric(0), 
              NOTIF = numeric(0),
              pDOSIS = numeric(0),
              pNOTIF = numeric(0),
              TASA = numeric(0)
            )
          })
        }
        
        return(resultado)
      }
        
        
    # 5.2 Función auxiliar para formatear fechas ----
      
      formatearFechas <- function(datos, campo_fecha, formato) {
        tryCatch({
          # Asegurarse de que todos los campos existen
          for (campo in campo_fecha) {
            if (!campo %in% names(datos)) {
              warning("El campo ", campo, " no existe en los datos")
              return(datos)
            }
          }
          
          # Aplicar el formato según se solicite
          switch(formato,
                 "timestamp" = {
                   for (campo in campo_fecha) {
                     # Convertir a POSIXct primero y luego a timestamp
                     datos[, (campo) := as.numeric(as.POSIXct(datos[[campo]], origin = "1970-01-01")) * 1000]
                   }
                 },
                 "date" = {
                   for (campo in campo_fecha) {
                     datos[, (campo) := as.Date(datos[[campo]])]
                   }
                 },
                 "POSIXct" = {
                   for (campo in campo_fecha) {
                     datos[, (campo) := as.POSIXct(datos[[campo]], origin = "1970-01-01")]
                   }
                 },
                 {
                   # Por defecto no hacer nada
                   warning("Formato de fecha desconocido: ", formato)
                 })
          
          return(datos)
        }, error = function(e) {
          warning("Error al formatear fechas: ", e$message)
          return(datos)  # Devolver los datos sin cambios en caso de error
        })
      }
      
    # 5.3 Creación de Subsets de datos (Funciones) ----
      
      # 5.3.0 Tablas generales dosis administradas ----
        
        # ..0.a tbl GráficoTtendencias dosis administradas ----
      
        tbl_tendencias_dosis <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$dosis)) {return(NULL)
        }
          
        paso <- procesarDatosGraficos(datos_dosis = datos_filtrados$dosis,
                                      datos_noti  = NULL,
                                      agrup_dosis = "semEpiNoti",
                                      agrup_noti  = NULL,
                                      agrup_es_fecha = FALSE,
                                      formato_fecha  = NULL,
                                      calcular_dosis = TRUE,    
                                      calcular_notif = FALSE,
                                      unidad_tasa    = f_unidad_tasa("1M")
                                      )$r_dosis
          
        paso <- as.data.frame(paso) # Pasar a data frame para este caso
          
          # print("paso despues df:")
          # print(names(paso))
          # print(head(paso))
          
          return(paso)
        }
        
        
      # 5.3.1 tbl Gráfico de tendencias ----
      
        tbl_tendencias <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {return(NULL)}
            
          paso <- procesarDatosGraficos(datos_dosis = datos_filtrados$dosis,
                                        datos_noti  = datos_filtrados$datos,
                                        agrup_dosis = "fecha_sem_epi",
                                        agrup_noti  = "dataNotificacao",
                                        agrup_es_fecha = TRUE,
                                        formato_fecha  = "timestamp",
                                        calcular_dosis = TRUE,    
                                        calcular_notif = TRUE,
                                        unidad_tasa    = f_unidad_tasa("1M"))$r_combi
            
          paso <- as.data.frame(paso) # Pasar a data frame para este caso
          
          return(paso)
        }
        
        
      # 5.3.2 tbl Gráfico variación de tasas ----
        
        tbl_tendencias_var <- function(datos_filtrados) {
          
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {return(NULL)}
          
          paso <- procesarDatosGraficos(datos_dosis = datos_filtrados$dosis,
                                        datos_noti  = datos_filtrados$datos,
                                        agrup_dosis = "semEpiNoti",
                                        agrup_noti  = "semEpiNoti",
                                        agrup_es_fecha = FALSE,
                                        formato_fecha  = NULL,
                                        calcular_dosis = TRUE,    
                                        calcular_notif = TRUE,
                                        unidad_tasa    = f_unidad_tasa("1M"))$r_combi
          
          paso <- as.data.frame(paso) # Pasar a data frame para este caso
          paso <- paso %>% arrange(semEpiNoti) %>% 
                           mutate(TASA_Anterior = lag(TASA),
                                  VART = (TASA - TASA_Anterior) / TASA_Anterior)
          return(paso)
        }
        
        
      # 5.3.3 tbl Gráfico WindRose ----
        
        tbl_tendencias_anio_mes <- function(datos_filtrados) {
          
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {return(NULL)}
          
          paso <- datos_filtrados()$datos
          paso <- paso[!is.na(añoNoti),]
          paso <- paso[, .(NOTIF = uniqueN(numeroNotificacao)), by = c("añoNoti","mesNoti")]
          
           return(paso)
        }
        
        
      # 5.3.4 tbl Gráfico Mapa ----
        
        tbl_mapa <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos) || is.null(datos_filtrados()$geodatos)) {
            return(NULL)
          }
          
          tryCatch({
            # Obtener conteo de notificaciones ÚNICAS por estado
            notif_por_estado <- datos_filtrados()$datos %>%
              # Agrupar por estado y contar notificaciones únicas
              group_by(codigoEstadoNotificacao, geonoti) %>%
              summarize(NOTIF = n_distinct(numeroNotificacao), .groups = "drop") %>%
              filter(!is.na(codigoEstadoNotificacao))
            
            # Unir con geodatos
            mapa_data <- merge(
              datos_filtrados()$geodatos,
              notif_por_estado,
              by.x = "ISO_CODE", 
              by.y = "codigoEstadoNotificacao",
              all.x = TRUE
            )
            
            # Asegurar que NOTIF no tenga NAs
            mapa_data$NOTIF[is.na(mapa_data$NOTIF)] <- 0
            
            # Asegurar que las geometrías son válidas
            mapa_data <- st_make_valid(mapa_data)
            
            # Check for empty geometries and remove them
            if(any(st_is_empty(mapa_data))) {
              warning("Removing empty geometries")
              mapa_data <- mapa_data[!st_is_empty(mapa_data),]
            }
            
            # Asegurar que el dataframe tenga datos
            if(nrow(mapa_data) == 0) {
              warning("No valid data after filtering")
              return(NULL)
            }
            
            return(mapa_data)
          }, error = function(e) {
            warning("Error in tbl_mapa: ", e$message)
            return(NULL)
          })
        }
        
        
      # 5.3.5 tbl Distrb x Genero ----
        
        tbl_distrb_genero <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {
            return(NULL)
          }
            
          paso <- procesarDatosGraficos(datos_dosis = datos_filtrados$dosis,
                                        datos_noti  = datos_filtrados$datos,
                                        agrup_dosis = "sexo",
                                        agrup_noti  = "sexo",
                                        agrup_es_fecha = FALSE,
                                        formato_fecha  = FALSE,
                                        calcular_dosis = TRUE,    
                                        calcular_notif = TRUE,
                                        unidad_tasa    = f_unidad_tasa("1M")
                                        )$r_combi
            
          paso <- as.data.frame(paso) # Pasar a data frame para este caso
            
          return(paso)
        }
        
        
      # 5.3.6 tbl Gráfico Distrb x Genero Graves ----
        
        tbl_distrb_genero_g <- function(datos_filtrados) {
          
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {
            return(NULL)
          }
            
          paso <- procesarDatosGraficos(datos_dosis = datos_filtrados$dosis,
                                        datos_noti  = datos_filtrados$datos,
                                        agrup_dosis = "sexo",
                                        agrup_noti  = "sexo",
                                        agrup_es_fecha = FALSE,
                                        formato_fecha  = FALSE,
                                        campo_filtro_noti = "marca_grave",
                                        filtro_noti = "Grave",
                                        calcular_dosis = TRUE,    
                                        calcular_notif = TRUE,
                                        unidad_tasa    = f_unidad_tasa("1M")
                                        )$r_combi
            
          paso <- as.data.frame(paso) # Pasar a data frame para este caso
            
          return(paso)
        }
          
           
      # 5.3.7 tbl Gráfico Distrb x Genero No Graves ----
        
        tbl_distrb_genero_ng <- function(datos_filtrados) {
          
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {
            return(NULL)
          }
            
          paso <- procesarDatosGraficos(datos_dosis = datos_filtrados$dosis,
                                        datos_noti  = datos_filtrados$datos,
                                        agrup_dosis = "sexo",
                                        agrup_noti  = "sexo",
                                        agrup_es_fecha = FALSE,
                                        formato_fecha  = FALSE,
                                        campo_filtro_noti = "marca_grave",
                                        filtro_noti = "No grave",
                                        calcular_dosis = TRUE,    
                                        calcular_notif = TRUE,
                                        unidad_tasa    = f_unidad_tasa("1M")
                                        )$r_combi
            
          paso <- as.data.frame(paso) # Pasar a data frame para este caso

          return(paso)
        }
        
        
      # 5.3.8 tbl Gráfico de tendencias multiple ----
      
        tbl_tendencias_mult <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {return(NULL)}
          
          paso <- procesarDatosGraficos(datos_dosis = datos_filtrados$dosis,
                                        datos_noti  = datos_filtrados$datos,
                                        agrup_dosis = "semEpiNoti",
                                        agrup_noti  = "semEpiNoti",
                                        agrup_es_fecha = FALSE,
                                        formato_fecha  = NULL,
                                        calcular_dosis = TRUE,    
                                        calcular_notif = TRUE,
                                        unidad_tasa    = f_unidad_tasa("1M")
                                        )$r_combi
          return(paso)
        }
        
        
      # 5.3.9 tbl Gráfico Pirámide poblacional ----
      
        tbl_piramide_poblc <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {return(NULL)
        }
          
        paso <- procesarDatosGraficos(datos_dosis = datos_filtrados$dosis,
                                      datos_noti  = datos_filtrados$datos,
                                      agrup_dosis = c("sexo","grupo_etario"),
                                      agrup_noti  = c("sexo","grupo_etario"),
                                      agrup_es_fecha = FALSE,
                                      formato_fecha  = NULL,
                                      calcular_dosis = TRUE,
                                      calcular_notif = TRUE,
                                      unidad_tasa    = f_unidad_tasa("1M")
                                      )$r_combi
          
        paso <- as.data.frame(paso) # Pasar a data frame para este caso
          
           # print("paso despues priramide poblacional")
           # print(names(paso))
           # print(paso)
          
          return(paso)
        }
      
      
      # 5.3.9xx tbl Gráfico Pirámide gravedad ----
      
        tbl_piramide_gravedad <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {return(NULL)}
          
          paso <- procesarDatosGraficos(datos_dosis = NULL,
                                        datos_noti  = datos_filtrados$datos,
                                        agrup_dosis = NULL,
                                        agrup_noti  = c("marca_grave","grupo_etario"),
                                        agrup_es_fecha = FALSE,
                                        formato_fecha  = NULL,
                                        calcular_dosis = TRUE,
                                        calcular_notif = TRUE,
                                        unidad_tasa    = f_unidad_tasa("1M")
                                        )$r_notif
            
          paso <- as.data.frame(paso)
          
          return(paso)
        }

        
      # 5.3.9xx tbl Gráfico tota Gravedad ----
      
        tbl_notif_x_gravedad <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {return(NULL)}
          
          paso <- procesarDatosGraficos(datos_dosis = NULL,
                                        datos_noti  = datos_filtrados$datos,
                                        agrup_dosis = NULL,
                                        agrup_noti  = c("marca_grave"),
                                        agrup_es_fecha = FALSE,
                                        formato_fecha  = NULL,
                                        calcular_dosis = FALSE,    
                                        calcular_notif = TRUE,
                                        unidad_tasa    = f_unidad_tasa("1M")
                                        )$r_notif
          paso <- as.data.table(paso)
            
          return(paso)
        }
        
        

      # 5.3.9xx tbl Gráfico barras Notif x Sexo y Gravedad ----
      
        tbl_notif_x_sexo_gravedad <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {return(NULL)}
          
          paso <- procesarDatosGraficos(datos_dosis = NULL,
                                        datos_noti  = datos_filtrados$datos,
                                        agrup_dosis = NULL,
                                        agrup_noti  = c("marca_grave","sexo"),
                                        agrup_es_fecha = FALSE,
                                        formato_fecha  = NULL,
                                        calcular_dosis = FALSE,    
                                        calcular_notif = TRUE,
                                        unidad_tasa    = f_unidad_tasa("1M")
                                        )$r_notif
          paso <- as.data.table(paso)
            
          return(paso)
        }
        
        
      # 5.3.10 tbl Gráfico Tendencia gravedad ----
      
        tbl_tendencia_gravedad <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {return(NULL)
        }
          
        paso <- procesarDatosGraficos(datos_dosis = datos_filtrados$dosis,
                                      datos_noti  = datos_filtrados$datos,
                                      agrup_dosis = NULL,
                                      agrup_noti  = c("marca_grave","semEpiNoti"),
                                      agrup_es_fecha = FALSE,
                                      formato_fecha  = NULL,
                                      calcular_dosis = FALSE,
                                      calcular_notif = TRUE,
                                      unidad_tasa    = f_unidad_tasa("1M")
                                      )$r_notif
          
        paso <- as.data.frame(paso) # Pasar a data frame para este caso
          
            #print("paso despues tendencia gravedad")
           # print(names(paso))
            #print(head(paso))
          
          return(paso)
        }
        
          
      # 5.3.11 tbl Gráfico Tendencia sexo ----
      
        tbl_tendencia_sexo <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {return(NULL)
        }
          
        paso <- procesarDatosGraficos(datos_dosis = datos_filtrados$dosis,
                                      datos_noti  = datos_filtrados$datos,
                                      agrup_dosis = c("sexo","semEpiNoti"),
                                      agrup_noti  = c("sexo","semEpiNoti"),
                                      agrup_es_fecha = FALSE,
                                      formato_fecha  = NULL,
                                      calcular_dosis = TRUE,
                                      calcular_notif = TRUE,
                                      unidad_tasa    = f_unidad_tasa("1M")
                                      )$r_combi
          
        paso <- as.data.frame(paso) # Pasar a data frame para este caso
          
            #print("paso despues tendencia gravedad")
           # print(names(paso))
            #print(head(paso))
          
          return(paso)
        }
        
        
        # 5.3.12 tbl Gráfico Top Estados ----
      
        tbl_pareto_estado <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {return(NULL)
        }
          
        paso <- procesarDatosGraficos(datos_dosis = datos_filtrados$dosis,
                                      datos_noti  = datos_filtrados$datos,
                                      agrup_dosis = "geonoti",
                                      agrup_noti  = "geonoti",
                                      agrup_es_fecha = FALSE,
                                      formato_fecha  = NULL,
                                      calcular_dosis = FALSE,
                                      calcular_notif = TRUE,
                                      unidad_tasa    = f_unidad_tasa("1M")
                                      )$r_notif
          
        paso <- as.data.frame(paso) # Pasar a data frame para este caso
          
            #print("paso despues tendencia gravedad")
           # print(names(paso))
            #print(head(paso))
          
          return(paso)
        }
        
        
      # 5.3.13 tbl Gráfico Tendencias multiples vacunas ----
      
        tbl_tendencias_mult_vac <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {return(NULL)}
          
          paso <- procesarDatosGraficos(datos_dosis = NULL,
                                      datos_noti  = datos_filtrados$datos,
                                      agrup_dosis = NULL,
                                      agrup_noti  = c("nomcomv","dataNotificacao"),
                                      #agrup_noti  = c("nomcomv","periodoNoti"),
                                      agrup_es_fecha = FALSE,
                                      formato_fecha  = NULL,
                                      calcular_dosis = FALSE,    
                                      calcular_notif = TRUE,
                                      unidad_tasa    = f_unidad_tasa("1M")
                                      )$r_noti
          
          inputVacuna <- input$selectInput_vacuna_vac
          
          if (!is.null(inputVacuna) && length(inputVacuna) > 0) {
            paso <- paso %>% filter(nomcomv %in% inputVacuna)
          }
                    
          return(paso)
        }
        
        
      # 5.3.14 tbl Frecuencia Notif x Vacuna  ----
      
        tbl_notif_x_vacuna <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {return(NULL)}
          
          paso <- procesarDatosGraficos(datos_dosis = NULL,
                                        datos_noti  = datos_filtrados$datos,
                                        agrup_dosis = NULL,
                                        agrup_noti  = "nomcomv",
                                        agrup_es_fecha = FALSE,
                                        formato_fecha  = NULL,
                                        calcular_dosis = FALSE,    
                                        calcular_notif = TRUE,
                                        unidad_tasa    = f_unidad_tasa("1M")
                                        )$r_noti
                  
          inputVacuna <- input$selectInput_vacuna_vac
          
          if (!is.null(inputVacuna) && length(inputVacuna) > 0) {
            paso <- paso %>% filter(nomcomv %in% inputVacuna)
          }
          
          paso <- as.data.frame(paso) 
            
          return(paso)
        }
        
        
      # 5.3.15 tbl Vacunas frecuencia treemap ----
      
        tbl_treemap_vac <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {return(NULL)
        }
          
        paso <- procesarDatosGraficos(datos_dosis = NULL,
                                      datos_noti  = datos_filtrados$datos,
                                      agrup_dosis = NULL,
                                      agrup_noti  = "nomcomv",
                                      agrup_es_fecha = FALSE,
                                      formato_fecha  = NULL,
                                      calcular_dosis = FALSE,    
                                      calcular_notif = TRUE,
                                      unidad_tasa    = f_unidad_tasa("1M")
                                      )$r_noti
          
        paso <- as.data.frame(paso) # Pasar a data frame para este caso
          
          # print("paso despues df:")
          # print(names(paso))
          # print(head(paso))
          
          return(paso)
        }
        
        
      # 5.3.16 tbl dias vacunación inicio categorias ----
      
        tbl_dias_vac_ini_cat <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {return(NULL)}
            
          paso <- datos_filtrados()$datos
            
          paso <- paso[!dias_vac_ini_cat %in% c("Sin Info","Síntomas antes de vacuna","Fechas Inconsistentes"),]
          paso <- paso[!is.na(nomcomv),]
          paso <- dcast(paso, numeroNotificacao + id_vaccine + event_id + dias_vac_ini + dias_vac_ini_cat~ ., fun.aggregate = length)
          paso <- dcast(paso, dias_vac_ini_cat ~ ., fun.aggregate = length, value.var = "event_id")
          paso <- as.data.table(paso)
          names(paso)[2] <- "eventos"
          paso$dias_vac_ini_cat <- factor(paso$dias_vac_ini_cat, levels = orden_personalizado_días)
          paso <- paso[order(dias_vac_ini_cat, decreasing = FALSE), ]
          
          return(paso)
          
        }
        
       
      # 5.3.17 tbl dias vacunación inicio ----
      
        tbl_dias_vac_ini <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {return(NULL)}
          
        paso <- datos_filtrados()$datos
        paso <- paso[!dias_vac_ini_cat %in% c("Sin Info","Síntomas antes de vacuna","Fechas Inconsistentes"),]
        paso <- paso[!is.na(nomcomv),]
        paso <- dcast(paso, numeroNotificacao + id_vaccine + nomcomv + event_id + sexo + grupo_etario + marca_grave + dias_vac_ini ~ ., fun.aggregate = length)
        paso <- as.data.table(paso)
        paso <- paso[,-9]
          
        return(paso)
        
        }
        
        
      # 5.3.17 tbl Vacunas x geografia ----
      
        tbl_vacunas_geo <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos) || is.null(datos_filtrados()$geodatos) ) {return(NULL)}
        
          paso <- procesarDatosGraficos(datos_dosis = NULL,
                                        datos_noti  = datos_filtrados$datos,
                                        agrup_dosis = NULL,
                                        agrup_noti  = c("nomcomv","codigoEstadoNotificacao","geonoti"),
                                        agrup_es_fecha = FALSE,
                                        formato_fecha  = NULL,
                                        calcular_dosis = FALSE,    
                                        calcular_notif = TRUE,
                                        unidad_tasa    = f_unidad_tasa("1M")
                                        )$r_noti
          
          inputVacuna <- input$selectInput_vacuna_vac
            
          if (!is.null(inputVacuna) && length(inputVacuna) > 0) {
              paso <- paso %>% filter(nomcomv %in% inputVacuna)
          }
          
          paso_geo <- datos_filtrados()$geodatos
          
          result_geo <- list()
          
          # Normaliza las vacunas para cruce con Estado
          aux_vacuna <- data.table(unique(paso$nomcomv))
          names(aux_vacuna) <- "nomcomv"
          aux_vacuna <- aux_vacuna %>% filter(!is.na(nomcomv))
          
          # Normaliza los estados vacunas para cruce con Vacuna
          aux_estado <- data.table(unique(paso$codigoEstadoNotificacao), unique(paso$geonoti))
          names(aux_estado) <- c("codigoEstadoNotificacao","geonoti")
    
          # Generación de tabla cruzada (todos los estados contra todas las vacunas)
          aux_estado_vacuna <- as.data.table(merge(as.data.frame(aux_estado), as.data.frame(aux_vacuna), by = NULL, all = TRUE))
          paso <- merge(aux_estado_vacuna, paso, by =c("codigoEstadoNotificacao","geonoti","nomcomv"), all.x = TRUE)
          paso <- paso[, NOTIF := fifelse(is.na(NOTIF), 0, NOTIF)]
          
          paso_estado_vac <- paso
          
          result_geo$paso_temp <- paso_estado_vac
          
          paso <- merge(paso, paso_geo, by.x = "codigoEstadoNotificacao", by.y = "ISO_CODE", all.x = TRUE)
          paso <- st_as_sf(paso)
          paso <- paso %>% mutate(geometry = st_make_valid(geometry))
          
          
          # 1ra salida
          result_geo$paso_geo_vac <- paso
          
          
          aux_paso_estado_vac <- dcast(paso_estado_vac, geonoti ~ ., fun.aggregate = sum, value.var = "NOTIF")
          names(aux_paso_estado_vac)[2] <- "TNOTIF"
          
          paso_estado_vac <- merge(paso_estado_vac, aux_paso_estado_vac, by = "geonoti", all.x = TRUE)
          paso_estado_vac <- paso_estado_vac[, pNOTIF := NOTIF / TNOTIF * 100]
          
          # 2da salida
          result_geo$paso_estado_vac <- paso_estado_vac
        
        
        return(result_geo)
        
        }
        
      
      # 5.3.18 tbl Vacuna - evento - desenlace  ----
      
        tbl_vac_eve_des <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos) || is.null(datos_filtrados()$geodatos) ) {return(NULL)}
        
        paso <- procesarDatosGraficos(datos_dosis = NULL,
                                      datos_noti  = datos_filtrados$datos,
                                      agrup_dosis = NULL,
                                      agrup_noti  = c("nomcomv","soc","evolucaoCaso"),
                                      agrup_es_fecha = FALSE,
                                      formato_fecha  = NULL,
                                      calcular_dosis = FALSE,    
                                      calcular_notif = TRUE,
                                      unidad_tasa    = f_unidad_tasa("1M")
                                      )$r_noti
        return(paso)
        
      }
        
        
      # 5.3.19 tbl Gráfico barras Notif x Vacuna y sexo ----
      
        tbl_notif_x_vacuna_sexo <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {return(NULL)}
          
          paso <- procesarDatosGraficos(datos_dosis = NULL,
                                        datos_noti  = datos_filtrados$datos,
                                        agrup_dosis = NULL,
                                        agrup_noti  = c("nomcomv","sexo"),
                                        agrup_es_fecha = FALSE,
                                        formato_fecha  = NULL,
                                        calcular_dosis = FALSE,    
                                        calcular_notif = TRUE,
                                        unidad_tasa    = f_unidad_tasa("1M")
                                        )$r_noti
          
          inputVacuna <- input$selectInput_vacuna_vac
          
          if (!is.null(inputVacuna) && length(inputVacuna) > 0) {
            paso <- paso %>% filter(nomcomv %in% inputVacuna)
          }
          
          paso <- as.data.table(paso)
            
            # print("paso despues df:")
            # print(names(paso))
            # print(head(paso))
            
          return(paso)
        }
        
        
      # 5.3.20 tbl Gráfico barras Notif x Vacuna y grupo etario ----
      
        tbl_notif_x_vacuna_ge <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {return(NULL)}
          
          paso <- procesarDatosGraficos(datos_dosis = NULL,
                                        datos_noti  = datos_filtrados$datos,
                                        agrup_dosis = NULL,
                                        agrup_noti  = c("nomcomv","grupo_etario"),
                                        agrup_es_fecha = FALSE,
                                        formato_fecha  = NULL,
                                        calcular_dosis = FALSE,    
                                        calcular_notif = TRUE,
                                        unidad_tasa    = f_unidad_tasa("1M")
                                        )$r_noti
        
          inputVacuna <- input$selectInput_vacuna_vac
          
          if (!is.null(inputVacuna) && length(inputVacuna) > 0) {
            paso <- paso %>% filter(nomcomv %in% inputVacuna)
          }
        
          paso <- as.data.table(paso)
        
          paso$grupo_etario <- factor(paso$grupo_etario, levels = orden_personalizado)
          paso <- paso[order(grupo_etario), ]
          
          # print("paso despues df:")
          # print(names(paso))
          # print(head(paso))
          
          return(paso)
        }
        
        
      # 5.3.20 tbl Gráfico barras Notif x Vacuna y grupo etario Menores ----
      
        tbl_notif_x_vacuna_ge_menores <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {return(NULL)}
          
          paso <- procesarDatosGraficos(datos_dosis = NULL,
                                        datos_noti  = datos_filtrados$datos,
                                        agrup_dosis = NULL,
                                        agrup_noti  = c("nomcomv","grupo_etario_menores"),
                                        agrup_es_fecha = FALSE,
                                        formato_fecha  = NULL,
                                        calcular_dosis = FALSE,    
                                        calcular_notif = TRUE,
                                        unidad_tasa    = f_unidad_tasa("1M")
                                        )$r_noti
          
          inputVacuna <- input$selectInput_vacuna_vac
          
          if (!is.null(inputVacuna) && length(inputVacuna) > 0) {
            paso <- paso %>% filter(nomcomv %in% inputVacuna)
          }
          
          paso <- as.data.table(paso)
          
          paso <- paso[grupo_etario_menores != "No aplica" & grupo_etario_menores != "Sin info",]
          paso$grupo_etario <- factor(paso$grupo_etario_menores, levels = orden_personalizado_menores)
          paso <- paso[order(grupo_etario_menores), ]
          
            
            # print("paso despues df:")
            # print(names(paso))
            # print(head(paso))
            
          return(paso)
        }
        
        
      # 5.3.20 tbl Gráfico barras Notif x Vacuna y grupo etario - Graves ----
      
        tbl_notif_x_vacuna_ge_gravedad <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {return(NULL)}
          
          paso <- procesarDatosGraficos(datos_dosis = NULL,
                                        datos_noti  = datos_filtrados$datos,
                                        agrup_dosis = NULL,
                                        agrup_noti  = c("nomcomv","grupo_etario","marca_grave"),
                                        agrup_es_fecha = FALSE,
                                        formato_fecha  = NULL,
                                        calcular_dosis = FALSE,    
                                        calcular_notif = TRUE,
                                        unidad_tasa    = f_unidad_tasa("1M")
                                        )$r_noti
          
          inputVacuna <- input$selectInput_vacuna_vac
          
          if (!is.null(inputVacuna) && length(inputVacuna) > 0) {
            paso <- paso %>% filter(nomcomv %in% inputVacuna)
          }
          
          paso <- as.data.table(paso)
          
          paso <- paso[grupo_etario != "No aplica" & grupo_etario != "Sin info",]
          paso$grupo_etario <- factor(paso$grupo_etario, levels = orden_personalizado)
          paso <- paso[order(grupo_etario), ]
          
            
            # print("paso despues df:")
            # print(names(paso))
            # print(head(paso))
            
          return(paso)
        }
       
        

      # 5.3.21 tbl Gráfico WordCloud Vacunas ----
      
        tbl_wordcloud_vacuna <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {return(NULL)
        }
          
        paso <- datos_filtrados()$datos %>% 
                select(numeroNotificacao, id_vaccine, nomcomv) %>%
                unique() %>% filter(!is.na(nomcomv)) %>%
                                    group_by(nomcomv) %>%
                                    summarize(weight = n()) %>%
                                    rename(name = nomcomv)
        
        paso <- as.data.table(paso)
        
          # print("paso despues df:")
          # print(names(paso))
          # print(head(paso))
          
        return(paso)
      }
        
        
      # 5.3.22 tbl Gráfico WordCloud PT ----
      
        tbl_wordcloud_pt <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {return(NULL)
        }
          
        paso <- datos_filtrados()$datos %>% 
                select(numeroNotificacao, event_id, pt) %>%
                unique() %>% filter(!is.na(pt)) %>%
                                    group_by(pt) %>%
                                    summarize(weight = n()) %>%
                                    rename(name = pt) %>%
                                    mutate(name = substr(name, 1, 35))
        
        paso <- as.data.table(paso)
        
          # print("paso despues df:")
          # print(names(paso))
          # print(head(paso))
          
        return(paso)
      }
        
        
      # 5.3.23 tbl Gráfico WordCloud HLT ----
      
        tbl_wordcloud_hlt <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {return(NULL)}
          
        paso <- datos_filtrados()$datos %>% 
                select(numeroNotificacao, event_id, hlt) %>%
                unique() %>% filter(!is.na(hlt)) %>%
                                    group_by(hlt) %>%
                                    summarize(weight = n()) %>%
                                    rename(name = hlt) %>%
                                    mutate(name = substr(name, 1, 35))
        
        paso <- as.data.table(paso)
        
          # print("paso despues df:")
          # print(names(paso))
          # print(head(paso))
          
        return(paso)
      }
        
       
      # 5.3.24 tbl Gráfico WordCloud HLGT ----
      
        tbl_wordcloud_hlgt <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {return(NULL)}
          
        paso <- datos_filtrados()$datos %>% 
                select(numeroNotificacao, event_id, hlgt) %>%
                unique() %>% filter(!is.na(hlgt)) %>%
                                    group_by(hlgt) %>%
                                    summarize(weight = n()) %>%
                                    rename(name = hlgt) %>%
                                    mutate(name = substr(name, 1, 35))
        
        paso <- as.data.table(paso)
        
          # print("paso despues df:")
          # print(names(paso))
          # print(head(paso))
          
        return(paso)
      }
        
       
      # 5.3.25 tbl Gráfico WordCloud SOC ----
      
        tbl_wordcloud_soc <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {return(NULL)}
          
        paso <- datos_filtrados()$datos %>% 
                select(numeroNotificacao, event_id, soc) %>%
                unique() %>% filter(!is.na(soc)) %>%
                                    group_by(soc) %>%
                                    summarize(weight = n()) %>%
                                    rename(name = soc) %>%
                                    mutate(name = substr(name, 1, 35))
        
        paso <- as.data.table(paso)
        
          # print("paso despues df:")
          # print(names(paso))
          # print(head(paso))
          
        return(paso)
      }
        
       
      # 5.3.26 tbl Gráfico barras Notif x Vacuna y Gravedad ----
      
        tbl_notif_x_vacuna_gravedad <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {return(NULL)}
          
          paso <- procesarDatosGraficos(datos_dosis = NULL,
                                        datos_noti  = datos_filtrados$datos,
                                        agrup_dosis = NULL,
                                        agrup_noti  = c("nomcomv","marca_grave"),
                                        agrup_es_fecha = FALSE,
                                        formato_fecha  = NULL,
                                        calcular_dosis = FALSE,    
                                        calcular_notif = TRUE,
                                        unidad_tasa    = f_unidad_tasa("1M")
                                        )$r_noti
          
          inputVacuna <- input$selectInput_vacuna_vac
          
          if (!is.null(inputVacuna) && length(inputVacuna) > 0) {
            paso <- paso %>% filter(nomcomv %in% inputVacuna)
          }
          
          paso <- as.data.table(paso)
            
            # print("paso despues df:")
            # print(names(paso))
            # print(head(paso))
            
          return(paso)
        }
        
       
      # 5.3.27 tbl Gráfico barras Notif x Vacuna Gravedad Sexo ----
      
        tbl_notif_x_vacuna_gravedad_sexo <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {return(NULL)}
          
          paso <- procesarDatosGraficos(datos_dosis = NULL,
                                        datos_noti  = datos_filtrados$datos,
                                        agrup_dosis = NULL,
                                        agrup_noti  = c("nomcomv","marca_grave","sexo"),
                                        agrup_es_fecha = FALSE,
                                        formato_fecha  = NULL,
                                        calcular_dosis = FALSE,    
                                        calcular_notif = TRUE,
                                        unidad_tasa    = f_unidad_tasa("1M")
                                        )$r_noti
          
          inputVacuna <- input$selectInput_vacuna_vac
          
          if (!is.null(inputVacuna) && length(inputVacuna) > 0) {
            paso <- paso %>% filter(nomcomv %in% inputVacuna)
          }
          
          paso <- as.data.table(paso)
            
            # print("paso despues df:")
            # print(names(paso))
            # print(head(paso))
            
          return(paso)
        }
        
       
      # 5.3.28 tbl Frecuencia Eventos x SOC  ----
      
        tbl_event_x_soc <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {return(NULL)
        }
          
        paso <- as.data.frame(datos_filtrados()$datos)
        paso <- paso %>% select(numeroNotificacao,event_id,soc) %>% 
                          #!is.na(soc)) %>%
                          group_by(soc) %>%
                          summarise(EVENT = n())
          
        return(paso)
        }
        
      # 5.3.29 tbl Frecuencia Eventos x HLGT  ----
      
        tbl_event_x_hlgt <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {return(NULL)
        }
          
        paso <- as.data.frame(datos_filtrados()$datos)
        paso <- paso %>% select(numeroNotificacao,event_id,hlgt) %>% 
                          #!is.na(hlgt)) %>%
                          group_by(hlgt) %>%
                          summarise(EVENT = n())
          
        return(paso)
        }
        
      # 5.3.30 tbl Frecuencia Eventos x HLT  ----
      
        tbl_event_x_hlt <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {return(NULL)
        }
          
        paso <- as.data.frame(datos_filtrados()$datos)
        paso <- paso %>% select(numeroNotificacao,event_id,hlt) %>% 
                          #!is.na(hlt)) %>%
                          group_by(hlt) %>%
                          summarise(EVENT = n())
          
        return(paso)
        }
        
      # 5.3.31 tbl Frecuencia Eventos x PT  ----
      
        tbl_event_x_pt <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {return(NULL)
        }
          
        paso <- as.data.frame(datos_filtrados()$datos)
        paso <- paso %>% select(numeroNotificacao,event_id,pt) %>% 
                          unique() %>%
                          #!is.na(pt)) %>%
                          group_by(pt) %>%
                          summarise(EVENT = n())
          
        return(paso)
        }
        
        
      # 5.3.32 tbl Frecuencia Eventos x PT y Gravdedad ----
      
        tbl_event_x_pt_gravedad <- function(datos_filtrados) {
          req(datos_filtrados(), input$selectInput_vacuna_event)
          if (is.null(datos_filtrados()$datos)) {return(NULL)
        }
          
        paso <- as.data.frame(datos_filtrados()$datos)
        
        inputVacuna <- input$selectInput_vacuna_event
        
        if (inputVacuna != "Todas") {
            paso <- paso %>% filter(nomcomv == inputVacuna)
        }
        
        paso <- paso %>% select(numeroNotificacao,event_id,pt,marca_grave) %>% 
                          unique() %>%
                          #!is.na(pt)) %>%
                          group_by(pt,marca_grave) %>%
                          summarise(EVENT = n())
          
        return(paso)
        }
        
        
      # 5.3.34 tbl Bubble Event SOC - Vacuna ----
      
        tbl_bubble_soc_vac <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {return(NULL)
        }
        
          paso <- datos_filtrados()$datos %>% 
                  select(numeroNotificacao, event_id, soc, nomcomv) %>%
                  unique() %>% filter(!is.na(soc)) %>%
                                      group_by(nomcomv, soc) %>%
                                      summarize(EVENT = n())
          paso <- as.data.frame(paso)
          
          return(paso)
        
        }
        
        
      # 5.3.35 tbl Pareto Eventos x PT Sexo  ----
      
        tbl_event_x_pt_sexo <- function(datos_filtrados) {
          req(datos_filtrados(), input$selectInput_grav_sexo)
          if (is.null(datos_filtrados()$datos)) {return(NULL)}
          
          paso <- as.data.frame(datos_filtrados()$datos)
          
          inputGrave <- input$selectInput_grav_sexo
  
          if (inputGrave != "Todos") {
              paso <- paso %>% filter(marca_grave == inputGrave)
          }
            
          paso <- paso %>% select(numeroNotificacao,event_id,pt,sexo) %>% 
                            unique() %>%
                            #!is.na(pt)) %>%
                            group_by(pt,sexo) %>%
                            summarise(EVENT = n())
            
          return(paso)
        }
        
        
      # 5.3.36 tbl TreeMap Event PT - Vacuna ----
      
        tbl_TreeMap_soc_pt_vac <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {return(NULL)
        }
        
          paso <- datos_filtrados()$datos %>% 
                  select(numeroNotificacao, event_id, soc, pt, nomcomv) %>%
                  unique() %>% filter(!is.na(soc)) %>%
                                  filter(!is.na(pt)) %>%
                                      group_by(nomcomv, pt, soc) %>%
                                      summarize(EVENT = n())
          
          paso <- as.data.frame(paso)
          paso <- paso%>% mutate(nomcomv = fifelse(is.na(nomcomv), "Sin info", nomcomv))
          
          return(paso)
        
        }

        # 36.a Funcion reactiva para el treemap ----
        
        process_data_to_treemap <- reactive({
          # Inicializar lista para almacenar los puntos
          points <- list()
          
          paso <- tbl_TreeMap_soc_pt_vac(datos_filtrados())
          
          # Obtener vacunas únicas
          vacunas <- unique(paso$nomcomv)
          
          for(i in seq_along(vacunas)) {
            vac <- vacunas[i]
            vac_data <- paso %>% filter(nomcomv == !!vac)
            
            # Calcular valor promedio de la vacuna
            vac_value <- round(mean(vac_data$EVENT))
            
            # Crear punto de vacuna
            vac_point <- list(
              id = paste0("id_", i-1),
              name = vac,
              #color = hc_theme_538()$colors[i],
              color = paletteer_d("dichromat::BluetoDarkOrange_12")[i],
              value = vac_value
            )
            points[[length(points) + 1]] <- vac_point
            
            # Procesar soc por vacuna
            socs <- unique(vac_data$soc)
            for(j in seq_along(socs)) {
              vsoc <- socs[j]
              soc_data <- vac_data %>% filter(soc == !!vsoc)
              
              # Crear punto de soc
              soc_point <- list(
                id = paste0(vac_point$id, "_", j-1),
                name = vsoc,
                parent = vac_point$id
              )
              points[[length(points) + 1]] <- soc_point
              
              # Procesar pt por soc
              for(k in seq_along(soc_data$pt)) {
                pt_point <- list(
                  id = paste0(soc_point$id, "_", k-1),
                  name = soc_data$pt[k],
                  parent = soc_point$id,
                  value = round(soc_data$EVENT[k])
                )
                points[[length(points) + 1]] <- pt_point
              }
            }
          }
          
          return(points)
        })
  
        
      # 5.3.37 tbl Heatmap Event PT - GE ----
      
        tbl_HeatMap_pt_ge <- function(datos_filtrados) {
          req(datos_filtrados(), input$selectInput_grav_sexo)
          if (is.null(datos_filtrados()$datos)) {return(NULL)}

          paso <- datos_filtrados()$datos
          
          inputGrave <- input$selectInput_grav_sexo
          
          if (inputGrave != "Todos") {
              paso <- paso %>% filter(marca_grave == inputGrave)
          }

          paso <- paso %>% 
                  select(numeroNotificacao, event_id, pt, grupo_etario) %>%
                  unique() %>% filter(!is.na(pt)) %>%
                                      group_by(grupo_etario,pt) %>%
                                      summarize(EVENT = n())
          paso <- as.data.frame(paso)
          
          aux_rnkg <- paso %>% group_by(pt) %>% 
                                summarize(EVENT = sum(EVENT)) %>%
                                arrange(-EVENT) %>% mutate(ord_pt = row_number()) %>%
                                select(pt,ord_pt)

          paso <- merge(paso, aux_rnkg, by = "pt", all.x=TRUE)
          paso$grupo_etario <- factor(paso$grupo_etario, levels = orden_personalizado)
          paso <- paso[with(paso, order(ord_pt, grupo_etario)), ]

          return(paso)
        
        }
        
        
      # 5.3.38 tbl Densidad Noti edad x Sexo  ----
      
        tbl_Densidad_edad_sexo <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {return(NULL)}
        
          paso <- procesarDatosGraficos(datos_dosis = NULL,
                                        datos_noti  = datos_filtrados$datos,
                                        agrup_dosis = NULL,
                                        agrup_noti  = c("numeroNotificacao","sexo","edad"),
                                        agrup_es_fecha = FALSE,
                                        formato_fecha  = NULL,
                                        calcular_dosis = FALSE,    
                                        calcular_notif = TRUE,
                                        unidad_tasa    = f_unidad_tasa("1M")
                                        )$r_noti
          
          paso <- paso %>% select(sexo,edad)
          
          return(paso)
        
        }
        
        
      # 5.3.39 tbl Sankey Vacuna SOC Desenlace ----
      
        tbl_sankey_soc_vac_desc <- function(datos_filtrados) {
          req(datos_filtrados(), input$selectInput_grav_sankey)
          if (is.null(datos_filtrados()$datos)) {return(NULL)
          }
          
          paso <- datos_filtrados()$datos
          
          inputGrave <- input$selectInput_grav_sankey
          
          if (inputGrave != "Todos") {
              paso <- paso %>% filter(marca_grave == inputGrave)
          }

          paso <- paso %>% select(numeroNotificacao, event_id, nomcomv, pt, evolucaoCaso) %>% 
                            unique() %>% mutate(evolucaoCaso = fifelse(is.na(evolucaoCaso), "Sin info",evolucaoCaso))
          
          paso0 <- paso %>% group_by(pt) %>% summarize(EVENT = n()) 
          paso0 <- paso0 %>% arrange(desc(EVENT)) %>% mutate(ord = row_number()) %>% select(pt, ord)

          paso1 <- paso %>% group_by(nomcomv, pt) %>%
                                  summarize(EVENT = n()) %>%
                                  rename(desde = nomcomv, hasta = pt)
          paso1 <- merge(paso1,paso0, by.x="hasta", by.y="pt", all.x=TRUE)

          paso2 <- paso %>% group_by(pt,evolucaoCaso) %>%
                                  summarize(EVENT = n()) %>%
                                  rename(desde = pt, hasta = evolucaoCaso)
          paso2 <- merge(paso2,paso0, by.x="desde", by.y="pt", all.x=TRUE)

          paso <- rbind(paso1,paso2)
          paso <- as.data.frame(paso)
          
          rm(paso0, paso1, paso2)
          
          return(paso)
        
        }
        
        
      # 5.3.40 tbl Heatmap Vacuna Dosis ----
      
        tbl_HeatMap_vac_dosis <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {return(NULL)}
        
          paso <- datos_filtrados()$datos %>% 
                  select(numeroNotificacao, nomcomv, doseImunobiologico) %>%
                  unique() %>% filter(!is.na(nomcomv)) %>%
                                      group_by(nomcomv,doseImunobiologico) %>%
                                      summarize(NOTIF = n())
          
          inputVacuna <- input$selectInput_vacuna_vac
          
          if (!is.null(inputVacuna) && length(inputVacuna) > 0) {
            paso <- paso %>% filter(nomcomv %in% inputVacuna)
          }
                                    
          paso <- as.data.frame(paso)

          
          aux_rnkg <- paso %>% group_by(nomcomv) %>% 
                                summarize(NOTIF = sum(NOTIF)) %>%
                                arrange(-NOTIF) %>% mutate(ord_nomcomv = row_number()) %>%
                                select(nomcomv,ord_nomcomv)

          paso <- merge(paso, aux_rnkg, by = "nomcomv", all.x=TRUE)
          
          paso$doseImunobiologico <- factor(paso$doseImunobiologico)#, levels = orden_personalizado)
          paso <- paso[with(paso, order(ord_nomcomv, doseImunobiologico)), ]

          return(paso)
        
        }
        
        
      # 5.3.41 tbl Pareto Vacuna y dosis ----
      
        tbl_notif_x_vacuna_dosis <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {return(NULL)}
          
          paso <- procesarDatosGraficos(datos_dosis = NULL,
                                        datos_noti  = datos_filtrados$datos,
                                        agrup_dosis = NULL,
                                        agrup_noti  = c("nomcomv","doseImunobiologico"),
                                        agrup_es_fecha = FALSE,
                                        formato_fecha  = NULL,
                                        calcular_dosis = FALSE,    
                                        calcular_notif = TRUE,
                                        unidad_tasa    = f_unidad_tasa("1M")
                                        )$r_noti
          
          inputVacuna <- input$selectInput_vacuna_vac
          
          if (!is.null(inputVacuna) && length(inputVacuna) > 0) {
            paso <- paso %>% filter(nomcomv %in% inputVacuna)
          }
          
          paso <- as.data.table(paso)
            
            # print("paso despues df:")
            # print(names(paso))
            # print(head(paso))
            
          return(paso)
        }
        
        
      # 5.3.42 tbl Pareto Vacuna y lote ----
      
        tbl_notif_x_vacuna_lote <- function(datos_filtrados) {
          req(datos_filtrados())
          if (is.null(datos_filtrados()$datos)) {return(NULL)
        }
          
        paso <- procesarDatosGraficos(datos_dosis = NULL,
                                      datos_noti  = datos_filtrados$datos,
                                      agrup_dosis = NULL,
                                      agrup_noti  = c("nomcomv","loteImunobiologico"),
                                      agrup_es_fecha = FALSE,
                                      formato_fecha  = NULL,
                                      calcular_dosis = FALSE,    
                                      calcular_notif = TRUE,
                                      unidad_tasa    = f_unidad_tasa("1M"))

        paso <- as.data.table(paso)
        paso[, lote := paste0(loteImunobiologico,"-",nomcomv)]
        paso[, c("lote","NOTIF")]
          
          # print("paso despues df:")
          # print(names(paso))
          # print(head(paso))
          
        return(paso)
        }
        
         
             
  # ---------------------------------------------------------------------------- -
  # 6. Generación de gráficos ----------------------------------------------- ----
  # ---------------------------------------------------------------------------- -
    
    # 6.1 Gráfico de tendencias ----
      
      output$grafico_tendencia <- renderHighchart({
        
        req(datos_filtrados())
        if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}
          
        paso <- tbl_tendencias(datos_filtrados())
          
        highchart(type = "stock") %>%
          hc_tooltip(crosshairs = TRUE, shared = TRUE) %>% 
          hc_xAxis(categories = paso$fecha_sem_epi, type = "datetime",
                   plotBands = list(
                     list(from = as.numeric(as.POSIXct("2021-01-01")) * 1000,  # Convirtiendo fechas a timestamp (millisegundos)
                          to = as.numeric(as.POSIXct("2022-01-01")) * 1000,
                          color = vColor13,
                          label = list(text = "1er año vacunación")),
                     list(from = as.numeric(as.POSIXct("2022-01-01")) * 1000,  # Convirtiendo fechas a timestamp (millisegundos)
                          to = as.numeric(as.POSIXct("2023-01-01")) * 1000,
                          color = "#eeeeee",
                          label = list(text = "2do año vacunación")),
                     list(from = as.numeric(as.POSIXct("2023-01-01")) * 1000,  # Convirtiendo fechas a timestamp (millisegundos)
                          to = as.numeric(as.POSIXct("2024-01-01")) * 1000,  # Fecha actual
                          color = vColor13,#"#dddddd",
                          label = list(text = "3er año vacunación")),
                     list(from = as.numeric(as.POSIXct("2024-01-01")) * 1000,  # Convirtiendo fechas a timestamp (millisegundos)
                          to = as.numeric(as.POSIXct(Sys.Date())) * 1000,  # Fecha actual
                          color = "#eeeeee",
                          label = list(text = "Actualidad"))
                     )
                   ) %>%
           
          hc_yAxis_multiples(
            list(
              title = list(text = "Dosis", style = list(color = vColor11)),
              lineWidth = 1,
              labels = list(formatter = JS("function() {return (this.value / 1000000).toFixed(1) + 'M';}")),
              opposite = FALSE  # Eje Y izquierdo
            ),
            list(
              title = list(text = "Notificaciones", style = list(color = vColor26)),
              lineWidth = 1,
              labels = list(formatter = JS("function() {return (this.value / 1000).toFixed(1) + 'K';}")),
              opposite = TRUE   # Eje Y derecho
            ),
            list(
              title = list(text = "Tasa", style = list(color = vColor12)),
              lineWidth = 1,
              labels = list(format = "{value:,.1f}"),
              opposite = TRUE,   # Eje Y derecho
              offset = 80  # Añade espacio adicional para separar el tercer eje
            )
          ) %>%
          hc_add_series(data = paso, type = "column", hcaes(x = fecha_sem_epi, y = DOSIS), yAxis = 0, name = "Dosis",          color = vColor11, dataLabels = list(align = "center", enabled = FALSE), tooltip = list(valueDecimals = 0)) %>%
          hc_add_series(data = paso, type = "line",   hcaes(x = fecha_sem_epi, y = NOTIF), yAxis = 1, name = "Notificaciones", color = vColor26, dataLabels = list(align = "center", enabled = FALSE), tooltip = list(valueDecimals = 0)) %>%
          hc_add_series(data = paso, type = "line",   hcaes(x = fecha_sem_epi, y = TASA),  yAxis = 2, name = "Tasa",           color = vColor12, dataLabels = list(align = "center", enabled = FALSE), tooltip = list(valueDecimals = 1)) %>%
          hc_exporting(enabled = TRUE)
      })
      
      
    # 6.2 Gráfico de variación de tasa ----
      
      output$grafico_variacion <- renderHighchart({
        
        req(datos_filtrados(), input$slider_periodonoti)
        if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}
        
        # Obtener los valores del slider
        min_slider <- input$slider_periodonoti[1]
        max_slider <- input$slider_periodonoti[2]
        
        paso <- tbl_tendencias_var(datos_filtrados())
        paso <- as.data.table(paso)
        paso <- paso[semEpiNoti >= min_slider & semEpiNoti <= max_slider]

        colores <- ifelse(paso$VART < 0, "#2ecc71", "#e74c3c")
        
        highchart() %>%
          hc_chart(type = "column") %>%
          hc_xAxis(categories = paso$semEpiNoti) %>%
          hc_plotOptions(
              column = list(
                  borderRadius = "0.5%"
              )
          ) %>%
          hc_credits(enabled = FALSE) %>%
           hc_tooltip(
              formatter = JS("function() {
                  return '<b>' + this.series.name + '</b><br/>' +
                         'Semana: ' + this.x + '<br/>' +
                         'Variación: ' + Highcharts.numberFormat(this.y, 2) + '%';
              }")
          ) %>%
          hc_series(
              list(
                  name = "Variación de la tasa de notificación",
                  data = map2(paso$VART, colores, function(y, color) {
                      list(y = y, color = color)
                  }),
                  tooltip = list(
                      valueDecimals = 2,
                      valueSuffix = "%"
                  )
              )
          ) %>%
          hc_exporting(enabled = TRUE)
      }) 
      
      
    # 6.3 Gráfico WorldCloud PT ----
      
      output$wordcloud_pt <- renderHighchart({
        
        req(datos_filtrados())
        if (is.null(datos_filtrados()$datos)) {return(NULL)}
        
        paso <- tbl_wordcloud_pt(datos_filtrados())
        paso <- paso[weight > 100 & weight < 1000,]
        paso <- paso[order(weight),]
        paso <- paso[1:100,]
        
        hchart(paso, "wordcloud", 
               hcaes(name = name, weight = weight),
               rotation = 0) %>%
          hc_tooltip(
            headerFormat = '<span style="font-size: 16px"><b>{point.name}</b></span><br>',
            pointFormat = 'Frecuencia: <b>{point.weight}</b>'
          ) %>%
          hc_add_theme(hc_theme_google()) %>%
          hc_exporting(enabled = TRUE)
      })
        
      
    # 6.4 Gráfico WorldCloud HLT ----
      
      output$wordcloud_hlt <- renderHighchart({
        
        req(datos_filtrados())
        if (is.null(datos_filtrados()$datos)) {return(NULL)}
        
        paso <- tbl_wordcloud_hlt(datos_filtrados())
        paso <- paso[weight > 100 & weight < 1000,]
        paso <- paso[order(weight),]
        paso <- paso[1:100,]
        
        hchart(paso, "wordcloud", 
               hcaes(name = name, weight = weight),
               rotation = 0) %>%
          hc_tooltip(
            headerFormat = '<span style="font-size: 16px"><b>{point.name}</b></span><br>',
            pointFormat = 'Frecuencia: <b>{point.weight}</b>'
          ) %>%
          hc_add_theme(hc_theme_google()) %>%
          hc_exporting(enabled = TRUE)
      })
      
      
    # 6.5 Gráfico WorldCloud HLGT ----
      
      output$wordcloud_hlgt <- renderHighchart({
        
        req(datos_filtrados())
        if (is.null(datos_filtrados()$datos)) {return(NULL)}
        
        paso <- tbl_wordcloud_hlgt(datos_filtrados())
        paso <- paso[weight > 100 & weight < 1000,]
        paso <- paso[order(weight),]
        paso <- paso[1:100,]
        
        hchart(paso, "wordcloud", 
               hcaes(name = name, weight = weight),
               rotation = 0) %>%
          hc_tooltip(
            headerFormat = '<span style="font-size: 16px"><b>{point.name}</b></span><br>',
            pointFormat = 'Frecuencia: <b>{point.weight}</b>'
          ) %>%
          hc_add_theme(hc_theme_google()) %>%
          hc_exporting(enabled = TRUE)
      })
      
      
    # 6.6 Gráfico WorldCloud SOC ----
          
      output$wordcloud_soc <- renderHighchart({
        
        req(datos_filtrados())
        if (is.null(datos_filtrados()$datos)) {return(NULL)}
        
        paso <- tbl_wordcloud_soc(datos_filtrados())
        paso <- paso[weight > 100 & weight < 1000,]
        paso <- paso[order(weight),]
        paso <- paso[1:100,]
        
        hchart(paso, "wordcloud", 
               hcaes(name = name, weight = weight),
               rotation = 0) %>%
          hc_tooltip(
            headerFormat = '<span style="font-size: 16px"><b>{point.name}</b></span><br>',
            pointFormat = 'Frecuencia: <b>{point.weight}</b>'
          ) %>%
          hc_add_theme(hc_theme_google()) %>%
          hc_exporting(enabled = TRUE)
      })
      
      
    # 6.8 Grafico Distrb x Genero Dosis ----
      
    output$dosis_x_genero <- renderHighchart({

      req(datos_filtrados())
      if (is.null(datos_filtrados()$datos)) {return(NULL)}

      paso <- tbl_distrb_genero(datos_filtrados())

      T_DOSIS <- sum(paso$DOSIS)
      paso <- paso %>%
        select(name = sexo, y = pDOSIS, z = DOSIS) %>%
        mutate(y = y * 100)

      highchart() %>%
        hc_chart(type = "pie") %>%
        hc_add_series(
            data = paso,
            #name = "aaaaaaaa",
            colorByPoint = TRUE,
            innerSize = "70%", # Tamaño fijo de la dona
            colors = c("#F7A35C", "#7CB5EC"), # Colores personalizados para Femenino y Masculino
            dataLabels = list(
                list(
                    enabled = FALSE,
                    distance = 25,
                    format = "{point.name}",
                    style = list(
                        fontSize = "14px",
                        fontWeight = "bold",
                        color = "black"
                    )
                ),
                list(
                    enabled = FALSE,
                    distance = -30,
                    format = "{point.y:.1f}%",
                    style = list(
                        fontSize = "12px",
                        color = "black"
                    )
                )
            )
        ) %>%
        hc_plotOptions(
            series = list(
                allowPointSelect = FALSE,
                cursor = "pointer",
                borderRadius = 5,
                point = list(
                    events = list(
                        mouseOver = JS("function() {
                            var chart = this.series.chart;
                            if (chart.customLabel) {
                                chart.customLabel.attr({
                                    text: this.name + '<br><strong>' + Highcharts.numberFormat(this.z, 0, ',', '.') + '</strong>'
                                });
                            }
                        }"),
                        mouseOut = JS(sprintf("function() {
                            var chart = this.series.chart;
                            if (chart.customLabel) {
                                chart.customLabel.attr({
                                    text: 'Dosis<br><strong>%s</strong>'
                                });
                            }
                        }", format_num(T_DOSIS, 0)))
                    )
                )
            )
        ) %>%
        # hc_title(
        #     text = "Distribución de DOSIS por Sexo",
        #     style = list(fontSize = "20px")
        # ) %>%
        # hc_subtitle(
        #     text = "Porcentaje de distribución por género",
        #     style = list(fontSize = "14px")
        # ) %>%
        hc_tooltip(
            pointFormat = "Dosis: <b>{point.z:.0f}</b><br>Proporción: <b>{point.y:.1f}%</b>"
        ) %>%
        hc_legend(enabled = TRUE) %>%
        hc_add_theme(hc_theme_null()) %>%
        hc_chart(
            events = list(
                render = JS(sprintf("
                    function() {
                        var chart = this,
                            series = chart.series[0];

                        if (!chart.customLabel) {
                            chart.customLabel = chart.renderer.label(
                                'Dosis<br><strong>%s</strong>',
                                0, 0
                            )
                            .css({
                                color: '#000000',
                                fontSize: '12px',
                                textAlign: 'center'
                            })
                            .add();
                        }

                        var x = series.center[0] + chart.plotLeft - 3;
                        var y = series.center[1] + chart.plotTop - 20;

                        chart.customLabel.attr({
                            x: x,
                            y: y,
                            'text-anchor': 'middle'
                        });
                    }", format_num(T_DOSIS, 0))
                )
            )
        ) %>%
        hc_exporting(enabled = TRUE)
    })
      
      
    # 6.9 Grafico Distrb x Genero Notif ----
      
    output$notif_x_genero <- renderHighchart({
      
      req(datos_filtrados())
      if (is.null(datos_filtrados()$datos)) {return(NULL)}
        
      paso <- tbl_distrb_genero(datos_filtrados())
      T_NOTIF <- sum(paso$NOTIF)
        
      paso <- paso %>%
        select(name = sexo, y = pNOTIF, z = NOTIF) %>%
        mutate(y = y * 100)
        
      highchart() %>%
        hc_chart(type = "pie") %>%
        hc_add_series(
            data = paso,
            name = "Proporción",
            colorByPoint = TRUE,
            innerSize = "70%", # Tamaño fijo de la dona
            colors = c("#F7A35C","#7CB5EC"), # Colores personalizados para Femenino y Masculino
            dataLabels = list(
                list(
                    enabled = TRUE,
                    distance = 25,
                    format = "{point.name}",
                    style = list(
                        fontSize = "14px",
                        fontWeight = "bold"
                    )
                ),
                list(
                    enabled = TRUE,
                    distance = -30,
                    format = "{point.y:.1f}%",
                    style = list(
                        fontSize = "12px",
                        color = "white"
                    )
                )
            )
        ) %>%
        hc_plotOptions(
            series = list(
                allowPointSelect = TRUE,
                cursor = "pointer",
                borderRadius = 5,
                point = list(
                    events = list(
                        mouseOver = JS("function() {
                            var chart = this.series.chart;
                            if (chart.customLabel) {
                                chart.customLabel.attr({
                                    text: this.name + '<br><strong>' + Highcharts.numberFormat(this.z, 0, ',', '.') + '</strong>'
                                });
                            }
                        }"),
                        mouseOut = JS(sprintf("function() {
                            var chart = this.series.chart;
                            if (chart.customLabel) {
                                chart.customLabel.attr({
                                    text: 'Notificaciones<br><strong>%s</strong>'
                                });
                            }
                        }", format_num(T_NOTIF, 0)))
                    )
                )
            )
        ) %>%
        # hc_title(
        #     text = "Distribución de DOSIS por Sexo",
        #     style = list(fontSize = "20px")
        # ) %>%
        # hc_subtitle(
        #     text = "Porcentaje de distribución por género",
        #     style = list(fontSize = "14px")
        # ) %>%
        hc_tooltip(
            pointFormat = "Notificaciones: <b>{point.z:.0f}</b><br>Proporción: <b>{point.y:.1f}%</b>"
        ) %>%
        hc_legend(enabled = FALSE) %>%
        hc_add_theme(hc_theme_null()) %>%
        hc_chart(
            events = list(
                render = JS(sprintf("
                    function() {
                        var chart = this,
                            series = chart.series[0];

                        if (!chart.customLabel) {
                            chart.customLabel = chart.renderer.label(
                                'Notificaciones<br><strong>%s</strong>',
                                0, 0
                            )
                            .css({
                                color: '#000000',
                                fontSize: '12px',
                                textAlign: 'center'
                            })
                            .add();
                        }

                        var x = series.center[0] + chart.plotLeft - 3;
                        var y = series.center[1] + chart.plotTop - 20;

                        chart.customLabel.attr({
                            x: x,
                            y: y,
                            'text-anchor': 'middle'
                        });
                    }", format_num(T_NOTIF, 0))
                )
            )
        ) %>%
        hc_exporting(enabled = TRUE)
    })
      
      
    # 6.10 Grafico Distrb x Genero Notif G ----
      
    output$notif_x_genero_g <- renderHighchart({
      
      req(datos_filtrados())
      if (is.null(datos_filtrados()$datos)) {return(NULL)}
        
      paso <- tbl_distrb_genero_g(datos_filtrados())
      T_NOTIF <- sum(paso$NOTIF)
        
      paso <- paso %>%
        select(name = sexo, y = pNOTIF, z = NOTIF) %>%
        mutate(y = y * 100)
        
      highchart() %>%
        hc_chart(type = "pie") %>%
        hc_add_series(
            data = paso,
            name = "Proporción",
            colorByPoint = TRUE,
            innerSize = "70%", # Tamaño fijo de la dona
            colors = c("#F7A35C","#7CB5EC"), # Colores personalizados para Femenino y Masculino
            dataLabels = list(
                list(
                    enabled = TRUE,
                    distance = 25,
                    format = "{point.name}",
                    style = list(
                        fontSize = "14px",
                        fontWeight = "bold"
                    )
                ),
                list(
                    enabled = TRUE,
                    distance = -30,
                    format = "{point.y:.1f}%",
                    style = list(
                        fontSize = "12px",
                        color = "white"
                    )
                )
            )
        ) %>%
        hc_plotOptions(
            series = list(
                allowPointSelect = TRUE,
                cursor = "pointer",
                borderRadius = 5,
                point = list(
                    events = list(
                        mouseOver = JS("function() {
                            var chart = this.series.chart;
                            if (chart.customLabel) {
                                chart.customLabel.attr({
                                    text: this.name + '<br><strong>' + Highcharts.numberFormat(this.z, 0, ',', '.') + '</strong>'
                                });
                            }
                        }"),
                        mouseOut = JS(sprintf("function() {
                            var chart = this.series.chart;
                            if (chart.customLabel) {
                                chart.customLabel.attr({
                                    text: 'Graves<br><strong>%s</strong>'
                                });
                            }
                        }", format_num(T_NOTIF, 0)))
                    )
                )
            )
        ) %>%
        # hc_title(
        #     text = "Distribución de DOSIS por Sexo",
        #     style = list(fontSize = "20px")
        # ) %>%
        # hc_subtitle(
        #     text = "Porcentaje de distribución por género",
        #     style = list(fontSize = "14px")
        # ) %>%
        hc_tooltip(
            pointFormat = "Not. graves: <b>{point.z:.0f}</b><br>Proporción: <b>{point.y:.1f}%</b>"
        ) %>%
        hc_legend(enabled = FALSE) %>%
        hc_add_theme(hc_theme_null()) %>%
        hc_chart(
            events = list(
                render = JS(sprintf("
                    function() {
                        var chart = this,
                            series = chart.series[0];

                        if (!chart.customLabel) {
                            chart.customLabel = chart.renderer.label(
                                'Graves<br><strong>%s</strong>',
                                0, 0
                            )
                            .css({
                                color: '#000000',
                                fontSize: '12px',
                                textAlign: 'center'
                            })
                            .add();
                        }

                        var x = series.center[0] + chart.plotLeft - 3;
                        var y = series.center[1] + chart.plotTop - 20;

                        chart.customLabel.attr({
                            x: x,
                            y: y,
                            'text-anchor': 'middle'
                        });
                    }", format_num(T_NOTIF, 0))
                )
            )
        ) %>%
        hc_exporting(enabled = TRUE)
    })
      
      
      
    # 6.11 Grafico Distrb x Genero Notif NG ----
      
    output$notif_x_genero_ng <- renderHighchart({
      
      req(datos_filtrados())
      if (is.null(datos_filtrados()$datos)) {return(NULL)}
        
      paso <- tbl_distrb_genero_ng(datos_filtrados())
      T_NOTIF <- sum(paso$NOTIF)
        
      paso <- paso %>%
        select(name = sexo, y = pNOTIF, z = NOTIF) %>%
        mutate(y = y * 100)
        
      highchart() %>%
        hc_chart(type = "pie") %>%
        hc_add_series(
            data = paso,
            name = "Proporción",
            colorByPoint = TRUE,
            innerSize = "70%", # Tamaño fijo de la dona
            colors = c("#F7A35C","#7CB5EC"), # Colores personalizados para Femenino y Masculino
            dataLabels = list(
                list(
                    enabled = TRUE,
                    distance = 25,
                    format = "{point.name}",
                    style = list(
                        fontSize = "14px",
                        fontWeight = "bold"
                    )
                ),
                list(
                    enabled = TRUE,
                    distance = -30,
                    format = "{point.y:.1f}%",
                    style = list(
                        fontSize = "12px",
                        color = "white"
                    )
                )
            )
        ) %>%
        hc_plotOptions(
            series = list(
                allowPointSelect = TRUE,
                cursor = "pointer",
                borderRadius = 5,
                point = list(
                    events = list(
                        mouseOver = JS("function() {
                            var chart = this.series.chart;
                            if (chart.customLabel) {
                                chart.customLabel.attr({
                                    text: this.name + '<br><strong>' + Highcharts.numberFormat(this.z, 0, ',', '.') + '</strong>'
                                });
                            }
                        }"),
                        mouseOut = JS(sprintf("function() {
                            var chart = this.series.chart;
                            if (chart.customLabel) {
                                chart.customLabel.attr({
                                    text: 'No graves<br><strong>%s</strong>'
                                });
                            }
                        }", format_num(T_NOTIF, 0)))
                    )
                )
            )
        ) %>%
        # hc_title(
        #     text = "Distribución de DOSIS por Sexo",
        #     style = list(fontSize = "20px")
        # ) %>%
        # hc_subtitle(
        #     text = "Porcentaje de distribución por género",
        #     style = list(fontSize = "14px")
        # ) %>%
        hc_tooltip(
            pointFormat = "Not. no graves: <b>{point.z:.0f}</b><br>Proporción: <b>{point.y:.1f}%</b>"
        ) %>%
        hc_legend(enabled = FALSE) %>%
        hc_add_theme(hc_theme_null()) %>%
        hc_chart(
            events = list(
                render = JS(sprintf("
                    function() {
                        var chart = this,
                            series = chart.series[0];

                        if (!chart.customLabel) {
                            chart.customLabel = chart.renderer.label(
                                'No graves<br><strong>%s</strong>',
                                0, 0
                            )
                            .css({
                                color: '#000000',
                                fontSize: '12px',
                                textAlign: 'center'
                            })
                            .add();
                        }

                        var x = series.center[0] + chart.plotLeft - 3;
                        var y = series.center[1] + chart.plotTop - 20;

                        chart.customLabel.attr({
                            x: x,
                            y: y,
                            'text-anchor': 'middle'
                        });
                    }", format_num(T_NOTIF, 0))
                )
            )
        ) %>%
        hc_exporting(enabled = TRUE)
    })
      
      
    # 6.12 Grafico Tendencias multiples ----
      
    output$tendencias_multiples <- renderHighchart({
      
      req(datos_filtrados(), input$slider_semepi)
      if (is.null(datos_filtrados()$datos)) {return(NULL)}
      
      # Obtener los valores del slider
      min_slider <- input$slider_semepi[1]
      max_slider <- input$slider_semepi[2]

      paso <- as.data.table(tbl_tendencias_mult(datos_filtrados()))
      paso[, Año := as.numeric(substr(semEpiNoti, 1, 4))]
      paso[, Semana := as.numeric(semEpiNoti - (Año * 100))]
      
      # Filtrar los datos según el rango del slider
      paso <- paso[Semana >= min_slider & Semana <= max_slider]

      hc <- highchart() %>%
        hc_chart(type = "spline") %>%
        hc_xAxis(
          categories = unique(paso$Semana),
          title = list(text = "Semana Epidemiológica")
        ) %>%
        hc_yAxis(
          title = list(text = "Notificaciones")
        ) %>%
        hc_plotOptions(
          series = list(
            animation = list(duration = 1000),
            marker = list(enabled = FALSE),
            lineWidth = 2
          )
        )
      
   
      # Añadir una serie por cada año
      unique_anos <- unique(paso$Año)
      for (ano in unique_anos) {
        datos_ano <- paso[Año == ano, .(Semana, NOTIF)]
        hc <- hc %>%
          hc_add_series(
            name = as.character(ano),
            data = list_parse2(datos_ano[, .(Semana, NOTIF)]),
            marker = list(enabled = FALSE)
          )
      }
      
      hc <- hc %>%
          hc_exporting(enabled = TRUE)
      
      return(hc)
        
    })
 
        
        
   # 6.13 Grafico Pirámide Poblacional ----
      
    output$piramide_poblacional <- renderHighchart({
      
      req(datos_filtrados())
      if (is.null(datos_filtrados()$datos)) {return(NULL)}
        
      paso <- tbl_piramide_poblc(datos_filtrados())
      paso <- as.data.table(paso)
      
      # Crear series por sexo
      paso_h <- paso[sexo == "Masculino", -c("sexo")]
      paso_m <- paso[sexo == "Femenino", -c("sexo")]
      
      # Renombrar
      names(paso_h) <- c("grupo_etario","DOSISh","NOTIFh","pDOSISh","pNOTIFh","TASAh")
      names(paso_m) <- c("grupo_etario","DOSISm","NOTIFm","pDOSISm","pNOTIFm","TASAm")
        
      # unir
      paso <- merge(paso_h, paso_m, by = "grupo_etario", all = TRUE)
      
      # Ordenar
      paso$grupo_etario <- factor(paso$grupo_etario, levels = orden_personalizado)
      paso <- paso[order(paso$grupo_etario, decreasing = TRUE), ]
      
      # Graficar

      hc <- highchart() %>%
        hc_chart(type = "bar") %>%

        # Configuración de los ejes X
        hc_xAxis(
          list(
            categories = paso$grupo_etario,
            reversed = FALSE,
            labels = list(step = 1)
          ),
          list(
            # Eje espejo en el lado derecho
            opposite = TRUE,
            reversed = FALSE,
            categories = paso$grupo_etario,
            linkedTo = 0,
            labels = list(step = 1)
          )
        ) %>%
        
        # Configuración del eje Y
        hc_yAxis(
          title = list(text = NULL),
          labels = list(
            formatter = JS("function() {
              return Math.abs(this.value);
            }")
          )
        ) %>%
        
        hc_tooltip(
         formatter = JS("function() { return '<b>' + this.series.name + ', rango de edad ' + this.point.category + '</b><br/>' + 'Tasa: ' + Math.abs(this.y).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: true }) ; }")
        ) %>%
        
        # Configuración de las series
        hc_add_series(
          name = "Hombres",
          data = paso$NOTIFh * -1,
          color = "#7CB5EC",
          dataLabels = list(enabled = TRUE, 
            formatter = JS("function() { return Math.abs(this.y).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }); }")
          )
        ) %>%
        hc_add_series(
          name = "Mujeres",
          data = paso$NOTIFm,
          color = "#F7A35C",
          dataLabels = list(enabled = TRUE, 
            formatter = JS("function() { return this.y.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }); }")
          )
        ) %>%
        
        # Configuración del tooltip
        hc_tooltip(
          formatter = JS("function() {
            return '<b>' + this.series.name + this.point.category + '</b><br/>' +
                 'Notificaciones: ' + Math.abs(this.point.y).toFixed(2);
          }")
        ) %>%
        
        # Configuración de las opciones de la gráfica
        hc_plotOptions(
          series = list(
            stacking = "normal",
            borderRadius = "2"
          )
        ) %>%
        hc_exporting(enabled = TRUE)
      
      hc
    })
    
        
    # 6.13 Gráfico Torta Gravedad xxxxx ----
      
    output$pie_notif_gravedad <- renderHighchart({
      
      req(datos_filtrados())
      if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}
          
      paso <- tbl_notif_x_gravedad(datos_filtrados())
      paso <- paso[order(NOTIF, decreasing = TRUE),]
      
      # Versión usando hchart directamente (más simple)
      hc <- highchart() %>%
        hc_add_series(
          type = "pie",
          name = "Notificaciones",
          data = paso,
          mapping = hcaes(name = marca_grave, y = NOTIF),
          dataLabels = list(
            enabled = TRUE,
            format = "<b>{point.name}</b><br>{point.percentage:.1f} %<br>total: {point.y}"
          )
        ) %>%
        hc_colors(unname(colores_gravedad[as.character(paso$marca_grave)])) %>%
        hc_exporting(enabled = TRUE)
      
      return(hc)
    })
        
        
    # 6.13 Gráfico Pareto Notif x Sexo y Gravedad xxxxx ----
    
     output$bar_notif_sexo_gravedad <- renderHighchart({
      
      req(datos_filtrados())
      if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}
        
      paso <- tbl_notif_x_sexo_gravedad(datos_filtrados())
      paso <- paso[order(NOTIF, decreasing = TRUE),]
        
      hc <- highchart() %>%
        hc_chart(type = "bar") %>%
        hc_xAxis(categories = unique(paso$sexo), title = list(text = "Sexo"), visible = TRUE) %>%
        hc_plotOptions(bar = list(
          horizontal = TRUE,
          dataLabels = list(enabled = TRUE, 
                            formatter = JS("function() { return Math.abs(this.y).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }); }")
                            )
        )) %>%
        hc_labels(enabled = FALSE) %>%
        hc_scrollbar(enabled = FALSE)
        
      # Agrega una serie por cada tipo de vacuna
      for(grave in unique(paso$marca_grave)) {
          datos_grave <- paso[marca_grave == grave]
          hc <- hc %>%
              hc_add_series(
                  name = grave,
                  data = datos_grave$NOTIF,
                  dataLabels = list(
                      enabled = TRUE,
                      formatter = JS("function() { return Math.abs(this.y).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }); }")
                  )
              )
      }
      colores_ordenados <- colores_gravedad[match(unique(paso$marca_grave), names(colores_gravedad))]
      hc <- hc %>% hc_colors(unname(colores_ordenados)) %>%
                   hc_exporting(enabled = TRUE)
      
      return(hc)

    })
      
          
   # 6.13 Grafico Pirámide Gravedad xxxxx ----
      
    output$piramide_gravedad <- renderHighchart({
      
      req(datos_filtrados())
      if (is.null(datos_filtrados()$datos)) {return(NULL)}
        
      paso <- tbl_piramide_gravedad(datos_filtrados())
      paso <- as.data.table(paso)

      # Crear series por sexo
      paso_g  <- paso[marca_grave == "Grave", -c("marca_grave")]
      paso_ng <- paso[marca_grave == "No grave", -c("marca_grave")]
      
      # Renombrar
      names(paso_g)  <- c("grupo_etario","NOTIFg")
      names(paso_ng) <- c("grupo_etario","NOTIFng")
        
      # unir
      paso <- merge(paso_g, paso_ng, by = "grupo_etario", all = TRUE)
      
      # Ordenar
      paso$grupo_etario <- factor(paso$grupo_etario, levels = orden_personalizado)
      paso <- paso[order(paso$grupo_etario, decreasing = TRUE), ]
      
      # Graficar

      hc <- highchart() %>%
        hc_chart(type = "bar") %>%

        # Configuración de los ejes X
        hc_xAxis(
          list(
            categories = paso$grupo_etario,
            reversed = FALSE,
            labels = list(step = 1)
          ),
          list(
            # Eje espejo en el lado derecho
            opposite = TRUE,
            reversed = FALSE,
            categories = paso$grupo_etario,
            linkedTo = 0,
            labels = list(step = 1)
          )
        ) %>%
        
        # Configuración del eje Y
        hc_yAxis(
          title = list(text = NULL),
          labels = list(
            formatter = JS("function() {
              return Math.abs(this.value);
            }")
          )
        ) %>%
        
        # Configuración de las series
        hc_add_series(
          name = "Graves",
          data = paso$NOTIFg * -1,
          color = color_grave,
          dataLabels = list(enabled = TRUE, 
            formatter = JS("function() { return Math.abs(this.y).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }); }")
          )
        ) %>%
        hc_add_series(
          name = "No graves",
          data = paso$NOTIFng,
          color = color_no_grave,
          dataLabels = list(enabled = TRUE, 
            formatter = JS("function() { return this.y.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }); }")
          )
        ) %>%
        
        # Configuración del tooltip
        hc_tooltip(
          formatter = JS("function() {
            return '<b>' + this.series.name + this.point.category + '</b><br/>' +
                 'Notificaciones: ' + Math.abs(this.point.y).toFixed(2);
          }")
        ) %>%
        
        # Configuración de las opciones de la gráfica
        hc_plotOptions(
          series = list(
            stacking = "normal",
            borderRadius = "2"
          )
        ) %>%
        hc_exporting(enabled = TRUE)
      
      hc
    })        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
    # 6.14 Gráfico Tendencia Gravedad ----
    
    output$tendencias_gravedad <- renderHighchart({
      
      req(datos_filtrados(), input$slider_periodonoti_gravedad)
      if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}
      
      # Obtener los valores del slider
      min_slider <- input$slider_periodonoti_gravedad[1]
      max_slider <- input$slider_periodonoti_sexo[2]
      
      paso <- as.data.table(tbl_tendencia_gravedad(datos_filtrados()))
      paso <- paso[semEpiNoti >= min_slider & semEpiNoti <= max_slider]
      
      paso_g  <- paso[marca_grave == "Grave", -c("marca_grave")]
      paso_ng <- paso[marca_grave == "No grave", -c("marca_grave")]

      # Renombrar
      names(paso_g)  <- c("semEpiNoti","NOTIFg")
      names(paso_ng) <- c("semEpiNoti","NOTIFng")

      # Unir
      paso <- merge(paso_g, paso_ng, by = "semEpiNoti", all = TRUE)
      
      colores <- c("#DD4B39", "#00A65A")

      grafico <- highchart() %>%
        hc_chart(type = "column") %>%
        #hc_title(text = "Tendencia de los ESAVI por gravedad y semana epidemiológica") %>%
        hc_xAxis(categories = paso$semEpiNoti, title = list(text = "Semana epidemiológica")) %>%
        hc_yAxis(title = list(text = "Notificaciones")) %>%
        hc_tooltip(shared = TRUE, headerFormat = "<b>{point.key}</b><br/>") %>%
        hc_colors(colors = colores) %>%  # Definir colores personalizados
        hc_plotOptions(column = list(stacking = "normal")) %>%
        hc_add_series(name = "Graves", data = paso$NOTIFg) %>%
        hc_add_series(name = "No graves", data = paso$NOTIFng) %>%
        hc_exporting(enabled = TRUE)
      
      return(grafico)
      
    })
        
        
    # 6.15 Gráfico Tendencia Sexo ----
    
    output$tendencias_sexo <- renderHighchart({
      
      req(datos_filtrados(), input$slider_periodonoti_sexo)
      if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}
      
      # Obtener los valores del slider
      min_slider <- input$slider_periodonoti_sexo[1]
      max_slider <- input$slider_periodonoti_sexo[2]
      
      paso <- as.data.table(tbl_tendencia_sexo(datos_filtrados()))
      paso <- paso[semEpiNoti >= min_slider & semEpiNoti <= max_slider]

      paso_h <- paso[sexo == "Masculino", -c("sexo")]
      paso_m <- paso[sexo == "Femenino", -c("sexo")]

      # Renombrar
      names(paso_h) <- c("semEpiNoti","DOSISh","NOTIFh","pDOSISh","pNOTIFh","TASAh")
      names(paso_m) <- c("semEpiNoti","DOSISm","NOTIFm","pDOSISm","pNOTIFm","TASAm")

      # Unir
      paso <- merge(paso_h, paso_m, by = "semEpiNoti", all = TRUE)
      
      colores <- c("#7CB5EC", "#F7A35C")

      grafico <- highchart() %>%
        hc_chart(type = "column") %>%
        #hc_title(text = "Tendencia de los ESAVI por gravedad y semana epidemiológica") %>%
        hc_xAxis(categories = paso$semEpiNoti, title = list(text = "Semana epidemiológica")) %>%
        hc_yAxis(title = list(text = "Notificaciones")) %>%
        hc_tooltip(shared = TRUE, headerFormat = "<b>{point.key}</b><br/>") %>%
        hc_colors(colors = colores) %>%  # Definir colores personalizados
        hc_plotOptions(column = list(stacking = "normal")) %>%
        hc_add_series(name = "Hombres", data = paso$NOTIFh) %>%
        hc_add_series(name = "Mujeres", data = paso$NOTIFm) %>%
        hc_exporting(enabled = TRUE)
      
      return(grafico)
      
    })
        
        
    # 6.16 Gráfico Pareto Notif x Estado (Porcentaje) ----
        
    output$pareto_estado <- renderHighchart({
      
      req(datos_filtrados())
      if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}
      
      paso <- as.data.table(tbl_pareto_estado(datos_filtrados()))
      
      # Calcular el total y el porcentaje
      total_notif <- sum(paso$NOTIF)
      paso <- paso %>%
        mutate(PORCENTAJE = (NOTIF / total_notif) * 100) %>%
        arrange(desc(PORCENTAJE))
      
      # Obtener la cantidad de estados para el gradiente de color
      n_estados <- nrow(paso)
      
      # Crear un vector de colores en degradado similar a la paleta "Blues" del mapa
      # Desde azul claro a azul oscuro (del menos al más frecuente)
      colores_degradado <- colorRampPalette(c("#EFF6FF", "#2166ac"))(n_estados)
      
      grafico <- highchart() %>%
        hc_chart(type = "bar") %>%
        hc_xAxis(categories = paso$geonoti, visible = TRUE) %>%
        # Usar colores personalizados en lugar de un solo color
        hc_plotOptions(
          bar = list(
            colorByPoint = TRUE,
            colors = rev(colores_degradado)  # Revertir para que coincida con el orden de los datos
          )
        ) %>%
        hc_add_series(
          name = "Porcentaje de Notificaciones",
          data = paso$PORCENTAJE,
          dataLabels = list(
            enabled = TRUE,
            format = "{point.y:.1f}%"  # Formato de porcentaje con 1 decimal
          )
        ) %>%
        hc_tooltip(
          pointFormat = "<b>{point.y:.1f}%</b> del total<br>({point.NOTIF:,.0f} notificaciones)"
        ) %>%
        hc_legend(enabled = FALSE) %>%
        hc_exporting(enabled = TRUE)
      
      return(grafico)
    })
      
      
    # 6.17 Gráfico Pareto Notif x Vacuna ----
    
     output$bar_noti_vac <- renderHighchart({

      req(datos_filtrados())
      if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}

      paso <- tbl_notif_x_vacuna(datos_filtrados())
      paso <- paso[order(paso$NOTIF, decreasing = TRUE),]
      
      hc <- highchart() %>%
        hc_chart(type = "bar") %>%
        hc_xAxis(categories = paso$nomcomv) %>%
        hc_xAxis(title = list(text = "Vacunas administradas")) %>%
        hc_add_series(data = paso$NOTIF, name = "Notificaciones", type = "bar") %>%
        hc_plotOptions(bar = list(
        horizontal = TRUE,
        dataLabels = list(enabled = TRUE, 
                          #format = "{point.y}",
                          formatter = JS("function() { return Math.abs(this.y).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }); }"))
        )) %>%
        hc_labels(enabled = FALSE) %>%
        hc_scrollbar(enabled = FALSE) %>%
        hc_exporting(enabled = TRUE)

      return(hc)

    })
    
    # OPCION PARA AGREGAR COLOR    
    # output$bar_noti_vac <- renderHighchart({
    #   
    #   req(datos_filtrados())
    #   if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}
    #   
    #   paso <- tbl_notif_x_vacuna(datos_filtrados())
    #   paso <- paso[order(paso$NOTIF, decreasing = TRUE),]
    #   
    #   datos_series <- map2(paso$NOTIF, paso$nomcomv, function(y, name) {
    #     color <- colores_vacunas[name]  # Obtener el color correspondiente
    #     if(is.na(color)) color <- "#808080"  # Color por defecto si no está en el vector
    #     list(y = y, color = color)
    #   })
    #   
    #   print("datos_series")
    #   print(datos_series)
    #   
    #   hc <- highchart() %>%
    #     hc_chart(type = "bar") %>%
    #     hc_xAxis(categories = paso$nomcomv) %>%
    #     hc_xAxis(title = list(text = "Vacunas administradas")) %>%
    #     #hc_add_series(data = paso$NOTIF, name = "Notificaciones", type = "bar", color = vColor1) %>%
    #     hc_add_series(
    #       data = datos_series,
    #       name = "Notificaciones", 
    #       type = "bar"
    #     ) %>%
    #     hc_plotOptions(bar = list(
    #       horizontal = TRUE,
    #       dataLabels = list(
    #         enabled = TRUE, 
    #         formatter = JS("function() { return Math.abs(this.y).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }); }")
    #       )
    #     )) %>%
    #     hc_labels(enabled = TRUE)
    #   
    #   return(hc)
    #   
    # })
        
        
    # 6.18 Grafico Tendencias multiples Vacunas ----
      
    output$tendencias_multiples_vac <- renderHighchart({

      req(datos_filtrados())
      if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}
      
      paso <- tbl_tendencias_mult_vac(datos_filtrados())
      paso <- as.data.table(paso)
      
      # Tablas auxiliares para crear todos los periodos con todas las vacunas
      
      aux_semEpi <- as.data.table(unique(paso$dataNotificacao))
      names(aux_semEpi) <- "dataNotificacao"
      
      aux_vac <- as.data.table(unique(paso$nomcomv))
      names(aux_vac) <- "nomcomv"
      
      aux_paso <- CJ(aux_semEpi$dataNotificacao, aux_vac$nomcomv)
      setnames(aux_paso, c("dataNotificacao", "nomcomv"))
      aux_paso <- aux_paso[order(nomcomv,dataNotificacao),]
      
      # Recalculo de paso
      
      paso <- merge(aux_paso, paso, by = c("nomcomv","dataNotificacao"), all.x = TRUE)
      paso[is.na(NOTIF), NOTIF := 0]
      paso <- paso[!is.na(dataNotificacao),]
      paso <- paso[order(nomcomv,dataNotificacao),]
      
      # Conversión de fecha para Highcharts
      paso[, dataNotificacao := as.numeric(as.POSIXct(dataNotificacao, tz = "UTC")) * 1000]
      
      rm(aux_semEpi,aux_vac,aux_paso)
      gc(reset = TRUE)

      
      # Generación del gráfico
      
      hc <- highchart(type = "stock") %>%
        hc_tooltip(
          crosshairs = TRUE, 
          shared = TRUE,
          dateTimeLabelFormats = list(
            day = "%Y-%m-%d",
            week = "%Y-%m-%d",
            month = "%Y-%m",
            year = "%Y"
          )
        ) %>% 
        hc_xAxis(
          type = "datetime",
          dateTimeLabelFormats = list(
            day = "%Y-%m-%d",
            week = "%Y-%m-%d",
            month = "%Y-%m",
            year = "%Y"
          ),
          title = list(text = "Fecha de notificación")
        ) %>%
        hc_plotOptions(
          series = list(
            dataLabels = list(
              enabled = TRUE,
              align = 'right',
              crop = FALSE,
              overflow = 'none',
              formatter = JS("function() {
                if (this.point === this.series.points[this.series.points.length - 1]) {
                  return this.series.name;
                }
                return '';
              }")
            )
          )
        )
        
      # Añadir series
      unique_vacuna <- unique(paso$nomcomv)
      for (vac in unique_vacuna) {
        datos_vac <- paso[nomcomv == vac]
        hc <- hc %>%
          hc_add_series(
            type = "line",
            name = as.character(vac),
            data = map2(datos_vac$dataNotificacao, datos_vac$NOTIF, function(x,y) list(x,y))
          )
      }
      
      hc <- hc %>% hc_exporting(enabled = TRUE)
      
      
      #VERSION 2
      
      # hc <- highchart(type = "stock") %>%
      #   hc_tooltip(crosshairs = TRUE, shared = TRUE) %>% 
      #   hc_xAxis(
      #     categories = unique(paso$dataNotificacao), type = "datetime",
      #     title = list(text = "Fecha de notificación")
      #   )
      # 
      # # Añadir una serie por cada año
      # unique_vacuna <- unique(paso$nomcomv)
      # for (vac in unique_vacuna) {
      #   datos_vac <- paso[nomcomv == vac, .(dataNotificacao, NOTIF)]
      #   hc <- hc %>%
      #     hc_add_series(type = "line",
      #       name = as.character(vac),
      #       data = datos_vac$NOTIF
      #     )
      # }
      
      #VERSION 1
      
      # hc <- highchart() %>%
      #   hc_chart(type = "spline") %>%
      #   hc_xAxis(
      #     categories = unique(paso$semEpiNoti), 
      #     title = list(text = "Semana Epidemiológica")
      #   ) %>%
      #   hc_yAxis(
      #     title = list(text = "Notificaciones")
      #   ) %>%
      #   hc_plotOptions(
      #     series = list(
      #       animation = list(duration = 1000),
      #       marker = list(enabled = FALSE),
      #       lineWidth = 2
      #     )
      #   )
      # 
      # 
      # # Añadir una serie por cada año
      # unique_vacuna <- unique(paso$nomcomv)
      # for (vac in unique_vacuna) {
      #   datos_vac <- paso[nomcomv == vac, .(semEpiNoti, NOTIF)]
      #   hc <- hc %>%
      #     hc_add_series(
      #       name = as.character(vac),
      #       data = list_parse2(datos_vac[, .(semEpiNoti, NOTIF)]),
      #       marker = list(enabled = FALSE)
      #     )
      # }
      
      return(hc)
        
    })       
        
        
    # 6.19 Gráfico Pareto Notif x Vacuna y sexo ----
    
     output$bar_noti_vac_sexo <- renderHighchart({
      
      req(datos_filtrados())
      if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}
        
      paso <- tbl_notif_x_vacuna_sexo(datos_filtrados())
      paso <- paso[order(NOTIF, decreasing = TRUE),]
        
      hc <- highchart() %>%
        hc_chart(type = "bar") %>%
        hc_xAxis(categories = unique(paso$nomcomv), visible = TRUE) %>%
        hc_xAxis(title = list(text = "Vacunas administradas")) %>%
        hc_plotOptions(bar = list(
          horizontal = TRUE,
          dataLabels = list(enabled = TRUE, 
                            formatter = JS("function() { return Math.abs(this.y).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }); }")
                            )
        )) %>%
        hc_labels(enabled = FALSE) %>%
        hc_scrollbar(enabled = FALSE)
        
      # Agrega una serie por cada tipo de vacuna
      for(sex in unique(paso$sexo)) {
          datos_sexo <- paso[sexo == sex]
          hc <- hc %>%
              hc_add_series(
                  name = sex,
                  data = datos_sexo$NOTIF,
                  dataLabels = list(
                      enabled = TRUE,
                      formatter = JS("function() { return Math.abs(this.y).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }); }")
                  )
              )
      }
      colores_ordenados <- colores_sexo[match(unique(paso$sexo), names(colores_sexo))]
      hc <- hc %>% hc_colors(unname(colores_ordenados)) %>%
                   hc_exporting(enabled = TRUE)
      
      return(hc)

    })
      
      
    # 6.20 Gráfico Pareto Notif x Vacuna y grupo etario ----
    
     output$bar_noti_vac_ge <- renderHighchart({

      req(datos_filtrados())
      if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}

      paso <- tbl_notif_x_vacuna_ge(datos_filtrados())
      
      hc <- highchart() %>%
        hc_chart(type = "column") %>%
        hc_xAxis(categories = unique(paso$nomcomv), visible = TRUE) %>%
        hc_xAxis(title = list(text = "Vacunas administradas")) %>%
        hc_plotOptions(bar = list(
          horizontal = TRUE,
          dataLabels = list(enabled = TRUE, 
                            formatter = JS("function() { return Math.abs(this.y).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }); }")
                            )
        )) %>%
        hc_labels(enabled = FALSE) %>%
        hc_scrollbar(enabled = FALSE)
        
      # Agrega una serie por cada tipo de vacuna
      for(ge in unique(paso$grupo_etario)) {
          datos_ge <- paso[grupo_etario == ge]
          hc <- hc %>%
              hc_add_series(
                  name = ge,
                  data = datos_ge$NOTIF,
                  dataLabels = list(
                      enabled = TRUE,
                      formatter = JS("function() { return Math.abs(this.y).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }); }")
                  )
              )
      }
      colores_ordenados <- colores_ge[match(unique(paso$grupo_etario), names(colores_ge))]
      hc <- hc %>% hc_colors(unname(colores_ordenados)) %>%
                   hc_exporting(enabled = TRUE)
      
      return(hc)

    })
      
    
    # 6.20 Gráfico Pareto Notif x Vacuna y grupo etario Menores----
    
     output$bar_noti_vac_ge_menores <- renderHighchart({

      req(datos_filtrados())
      if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}

      paso <- tbl_notif_x_vacuna_ge_menores(datos_filtrados())
      
      hc <- highchart() %>%
        hc_chart(type = "column") %>%
        hc_xAxis(categories = unique(paso$nomcomv), visible = TRUE) %>%
        hc_xAxis(title = list(text = "Vacunas administradas")) %>%
        hc_plotOptions(bar = list(
          horizontal = TRUE,
          dataLabels = list(enabled = TRUE, 
                            formatter = JS("function() { return Math.abs(this.y).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }); }")
                            )
        )) %>%
        hc_labels(enabled = FALSE) %>%
        hc_scrollbar(enabled = FALSE)
        
      # Agrega una serie por cada tipo de vacuna
      for(ge in unique(paso$grupo_etario_menores)) {
          datos_ge <- paso[grupo_etario_menores == ge]
          hc <- hc %>%
              hc_add_series(
                  name = ge,
                  data = datos_ge$NOTIF,
                  dataLabels = list(
                      enabled = TRUE,
                      formatter = JS("function() { return Math.abs(this.y).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }); }")
                  )
              )
      }
      colores_ordenados <- colores_ge[match(unique(paso$grupo_etario_menores), names(colores_ge_menores))]
      hc <- hc %>% hc_colors(unname(colores_ordenados)) %>%
                   hc_exporting(enabled = TRUE)
      
      return(hc)

    })
        
        
    # 6.20 Grafico TreeMap Vacunas ----
    
    output$treemap_vac <- renderHighchart({
      
      req(datos_filtrados())
      if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}
      
      paso <- tbl_notif_x_vacuna(datos_filtrados())
      names(paso) <- c("name","value")
      
      colores_vacunas <- c("#1f77b4", "#F39C13", "#DE4C39", "#ffbb78", "#20B2AA","#55e7ff","#aec7e8","#2ca02c")
      

      # Convertir data frame a lista con colores
      treemap_data <- lapply(seq_len(nrow(paso)), function(i) {
        c(as.list(paso[i,]), color = colores_vacunas[i])
      })
      
      hc <- highchart() %>%
        hc_chart(type = "treemap") %>%
        hc_plotOptions(
          treemap = list(
            layoutAlgorithm = 'stripes',
            alternateStartingDirection = TRUE,
            borderColor = '#fff',
            borderRadius = 6,
            borderWidth = 2,
            dataLabels = list(
              style = list(
                textOutline = 'none'
              )
            )
          )
        ) %>%
        hc_add_series(
          type = "treemap",
          data = treemap_data,
          levels = list(
            list(
              level = 1,
              layoutAlgorithm = 'sliceAndDice',
              dataLabels = list(
                enabled = TRUE,
                align = 'left',
                verticalAlign = 'top',
                style = list(
                  fontSize = '15px',
                  fontWeight = 'bold',
                  color = '#FFFFFF'
                ),
                format = '{point.name}<br>{point.value}'
              )
            )
          )
        ) %>%
        hc_tooltip(
          useHTML = TRUE,
          pointFormat = "<b>{point.nomcomv}</b>: <b>{point.NOTIF}</b> notificaciones"
        ) %>%
        hc_exporting(enabled = TRUE)
      
      return(hc)
    })
        

    # 6.21 Gráfico Pareto dias Vacunación ----
    
    output$bar_dias_vac <- renderHighchart({
      
      req(datos_filtrados())
      if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}
      
      paso <- tbl_dias_vac_ini_cat(datos_filtrados())
      
      hc <- highchart() %>%
        hc_chart(type = "bar") %>%
        hc_xAxis(categories = paso$dias_vac_ini_cat) %>%
        hc_xAxis(title = list(text = "Días entre vacunación e inicio de síntomas")) %>%
        hc_add_series(data = paso$eventos, name = "Notificaciones",enabled = FALSE, type = "bar", color = vColor1) %>%
        hc_plotOptions(bar = list(
        horizontal = TRUE,
        dataLabels = list(enabled = TRUE, 
                          #format = "{point.y}",
                          formatter = JS("function() { return Math.abs(this.y).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }); }"))
        )) %>%
        hc_labels(enabled = TRUE) %>%
        hc_exporting(enabled = TRUE)

      return(hc)
      
    })
      
      
    # 6.22 Gráfico Box plot dias Vac-Ini x Vacuna ----
      
      output$boxplot_dias_vac_ini <- renderHighchart({
        
        req(datos_filtrados())
        if (is.null(datos_filtrados()$datos)) {return(NULL)}
        
        paso <- tbl_dias_vac_ini(datos_filtrados())
        
        hc <- hcboxplot(
          x    = paso$dias_vac_ini,
          var  = paso$nomcomv,
          name = "Estadísticas",
          outliers = FALSE
          #color = "blue"
        ) %>%
        hc_exporting(enabled = TRUE) #%>% 
        #hc_chart(type = "column")
        
      })
        
        
    # 6.23 Gráfico Box plot dias Vac-Ini x Vacuna-Sexo ----
      
      output$boxplot_dias_vac_ini_sexo <- renderHighchart({
        
        req(datos_filtrados())
        if (is.null(datos_filtrados()$datos)) {return(NULL)}
        
        paso <- tbl_dias_vac_ini(datos_filtrados())
        
        colores_sexo_ord <- colores_sexo[match(unique(paso$sexo), names(colores_sexo))]
        
        # Convertir los datos al formato necesario para el boxplot
        datos_boxplot <- data_to_boxplot(
          data = paso,
          variable = dias_vac_ini,
          group_var = nomcomv,
          group_var2 = sexo,
          add_outliers = FALSE,
          #name = ,
          color = colores_sexo_ord
        )
        
        # Obtener las categorías únicas
        categorias <- unique(paso$nomcomv)
        
        # Crear el highchart
        highchart() %>%
          hc_chart(type = "bar") %>%
          hc_xAxis(type = "category") %>%                  # encender esta en caso de boxplot verticales
          hc_add_series_list(datos_boxplot) %>%
          hc_plotOptions(
            boxplot = list(
              grouping = TRUE,
              fillColor = 'transparent'
            )
          ) %>%
        hc_colors(unname(colores_sexo_ord)) %>%
        hc_exporting(enabled = TRUE)
      })
        
        
    # 6.24 Gráfico Box plot dias Vac-Ini x Vacuna-GE ----
      
      output$boxplot_dias_vac_ini_ge <- renderHighchart({
        
        req(datos_filtrados())
        if (is.null(datos_filtrados()$datos)) {return(NULL)}
        
        paso <- tbl_dias_vac_ini(datos_filtrados())
        
        
        # Convertir los datos al formato necesario para el boxplot
        datos_boxplot <- data_to_boxplot(
          data = paso,
          variable = dias_vac_ini,
          group_var = nomcomv,
          group_var2 = grupo_etario,
          add_outliers = FALSE,
          #name = ,
          color = colores_ge
        )
        
        # Obtener las categorías únicas
        categorias <- unique(paso$nomcomv)
        
        # Crear el highchart
        highchart() %>%
          hc_chart(type = "column") %>%
          hc_xAxis(type = "category") %>%                  # encender esta en caso de boxplot verticales
          hc_add_series_list(datos_boxplot) %>%
          hc_plotOptions(
            boxplot = list(
              grouping = TRUE,
              fillColor = 'transparent'
            )
          ) %>%
        hc_colors(colores_ge) %>%
        hc_exporting(enabled = TRUE)
      })
        
        
    # 6.25 Gráfico Box plot dias Vac-Ini x Vacuna-Gravedad ----
      
      output$boxplot_dias_vac_ini_gravedad <- renderHighchart({
        
        req(datos_filtrados())
        if (is.null(datos_filtrados()$datos)) {return(NULL)}
        
        paso <- tbl_dias_vac_ini(datos_filtrados())
        
        
        # Convertir los datos al formato necesario para el boxplot
        datos_boxplot <- data_to_boxplot(
          data = paso,
          variable = dias_vac_ini,
          group_var = nomcomv,
          group_var2 = marca_grave,
          add_outliers = FALSE,
          #name = ,
          color = colores_gravedad
        )
        
        # Obtener las categorías únicas
        categorias <- unique(paso$nomcomv)
        
        # Crear el highchart
        highchart() %>%
          hc_chart(type = "bar") %>%
          hc_xAxis(type = "category") %>%                  # encender esta en caso de boxplot verticales
          hc_add_series_list(datos_boxplot) %>%
          hc_plotOptions(
            boxplot = list(
              grouping = TRUE,
              fillColor = 'transparent'
            )
          ) %>%
        hc_colors(colores_gravedad) %>%
        hc_exporting(enabled = TRUE)
      })
        
        
    # 6.26 Gráfico Pareto Notif x Vacuna y Gravedad ----
    
     output$bar_noti_vac_gravedad <- renderHighchart({
      
      req(datos_filtrados())
      if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}
        
      paso <- tbl_notif_x_vacuna_gravedad(datos_filtrados())
      paso <- paso[order(NOTIF, decreasing = TRUE),]
        
      hc <- highchart() %>%
        hc_chart(type = "bar") %>%
        hc_xAxis(categories = unique(paso$nomcomv), visible = TRUE) %>%
        hc_xAxis(title = list(text = "Vacunas administradas")) %>%
        hc_plotOptions(bar = list(
          horizontal = TRUE,
          dataLabels = list(enabled = TRUE, 
                            formatter = JS("function() { return Math.abs(this.y).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }); }")
                            )
        )) %>%
        hc_labels(enabled = FALSE) %>%
        hc_scrollbar(enabled = FALSE)
        
      # Agrega una serie por cada tipo de vacuna
      for(grave in unique(paso$marca_grave)) {
          datos_grave <- paso[marca_grave == grave]
          hc <- hc %>%
              hc_add_series(
                  name = grave,
                  data = datos_grave$NOTIF,
                  dataLabels = list(
                      enabled = TRUE,
                      formatter = JS("function() { return Math.abs(this.y).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }); }")
                  )
              )
      }
      colores_ordenados <- colores_gravedad[match(unique(paso$marca_grave), names(colores_gravedad))]
      hc <- hc %>% hc_colors(unname(colores_ordenados)) %>%
                   hc_exporting(enabled = TRUE)
      
      return(hc)

    })
        
        
    # 6.27 Gráfico Pareto Notif x Vacuna Gravedad Masculino ----
    
     output$bar_noti_vac_gravedad_masculino <- renderHighchart({
      
      req(datos_filtrados())
      if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}
        
      paso <- tbl_notif_x_vacuna_gravedad_sexo(datos_filtrados())
      paso <- paso[sexo == "Masculino",]
      paso <- paso[order(NOTIF, decreasing = TRUE),]
        
      hc <- highchart() %>%
        hc_chart(type = "bar") %>%
        hc_xAxis(categories = unique(paso$nomcomv), visible = TRUE) %>%
        hc_xAxis(title = list(text = "Vacunas administradas")) %>%
        hc_plotOptions(bar = list(
          horizontal = TRUE,
          dataLabels = list(enabled = TRUE, 
                            formatter = JS("function() { return Math.abs(this.y).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }); }")
                            )
        )) %>%
        hc_labels(enabled = FALSE) %>%
        hc_scrollbar(enabled = FALSE)
        
      # Agrega una serie por cada tipo de vacuna
      for(grave in unique(paso$marca_grave)) {
          datos_grave <- paso[marca_grave == grave]
          hc <- hc %>%
              hc_add_series(
                  name = grave,
                  data = datos_grave$NOTIF,
                  dataLabels = list(
                      enabled = TRUE,
                      formatter = JS("function() { return Math.abs(this.y).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }); }")
                  )
              )
      }
      colores_ordenados <- colores_gravedad[match(unique(paso$marca_grave), names(colores_gravedad))]
      hc <- hc %>% hc_colors(unname(colores_ordenados)) %>%
                   hc_exporting(enabled = TRUE)
      
      return(hc)

    })
        
        
    # 6.28 Gráfico Pareto Notif x Vacuna Gravedad Femenino ----
    
     output$bar_noti_vac_gravedad_femenino <- renderHighchart({
      
      req(datos_filtrados())
      if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}
        
      paso <- tbl_notif_x_vacuna_gravedad_sexo(datos_filtrados())
      paso <- paso[sexo == "Femenino",]
      paso <- paso[order(NOTIF, decreasing = TRUE),]
        
      hc <- highchart() %>%
        hc_chart(type = "bar") %>%
        hc_xAxis(categories = unique(paso$nomcomv), visible = TRUE) %>%
        hc_xAxis(title = list(text = "Vacunas administradas")) %>%
        hc_plotOptions(bar = list(
          horizontal = TRUE,
          dataLabels = list(enabled = TRUE, 
                            formatter = JS("function() { return Math.abs(this.y).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }); }")
                            )
        )) %>%
        hc_labels(enabled = FALSE) %>%
        hc_scrollbar(enabled = FALSE)
        
      # Agrega una serie por cada tipo de vacuna
      for(grave in unique(paso$marca_grave)) {
          datos_grave <- paso[marca_grave == grave]
          hc <- hc %>%
              hc_add_series(
                  name = grave,
                  data = datos_grave$NOTIF,
                  dataLabels = list(
                      enabled = TRUE,
                      formatter = JS("function() { return Math.abs(this.y).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }); }")
                  )
              )
      }
      colores_ordenados <- colores_gravedad[match(unique(paso$marca_grave), names(colores_gravedad))]
      hc <- hc %>% hc_colors(unname(colores_ordenados)) %>%
                   hc_exporting(enabled = TRUE)
      
      return(hc)

    })
    
    
       
    # 6.39 Gráfico Vacuna x GE Graves ----    
        
    output$bar_noti_vac_ge_grave <- renderHighchart({

      req(datos_filtrados())
      if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}

      paso <- tbl_notif_x_vacuna_ge_gravedad(datos_filtrados())
      paso <- paso[marca_grave == "Grave",]
      
      hc <- highchart() %>%
        hc_chart(type = "column") %>%
        hc_xAxis(categories = unique(paso$nomcomv), visible = TRUE) %>%
        hc_xAxis(title = list(text = "Vacunas administradas")) %>%
        hc_plotOptions(bar = list(
          horizontal = TRUE,
          dataLabels = list(enabled = TRUE, 
                            formatter = JS("function() { return Math.abs(this.y).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }); }")
                            )
        )) %>%
        hc_labels(enabled = FALSE) %>%
        hc_scrollbar(enabled = FALSE)
        
      # Agrega una serie por cada tipo de vacuna
      for(ge in unique(paso$grupo_etario)) {
          datos_ge <- paso[grupo_etario == ge]
          hc <- hc %>%
              hc_add_series(
                  name = ge,
                  data = datos_ge$NOTIF,
                  dataLabels = list(
                      enabled = TRUE,
                      formatter = JS("function() { return Math.abs(this.y).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }); }")
                  )
              )
      }
      colores_ordenados <- colores_ge[match(unique(paso$grupo_etario), names(colores_ge))]
      hc <- hc %>% hc_colors(unname(colores_ordenados)) %>%
                   hc_exporting(enabled = TRUE)
      
      return(hc)

    })    
            
        
    # 6.39 Gráfico Vacuna x GE No raves ----    
        
    output$bar_noti_vac_ge_no_grave <- renderHighchart({

      req(datos_filtrados())
      if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}

      paso <- tbl_notif_x_vacuna_ge_gravedad(datos_filtrados())
      paso <- paso[marca_grave == "No grave",]
      
      hc <- highchart() %>%
        hc_chart(type = "column") %>%
        hc_xAxis(categories = unique(paso$nomcomv), visible = TRUE) %>%
        hc_xAxis(title = list(text = "Vacunas administradas")) %>%
        hc_plotOptions(bar = list(
          horizontal = TRUE,
          dataLabels = list(enabled = TRUE, 
                            formatter = JS("function() { return Math.abs(this.y).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }); }")
                            )
        )) %>%
        hc_labels(enabled = FALSE) %>%
        hc_scrollbar(enabled = FALSE)
        
      # Agrega una serie por cada tipo de vacuna
      for(ge in unique(paso$grupo_etario)) {
          datos_ge <- paso[grupo_etario == ge]
          hc <- hc %>%
              hc_add_series(
                  name = ge,
                  data = datos_ge$NOTIF,
                  dataLabels = list(
                      enabled = TRUE,
                      formatter = JS("function() { return Math.abs(this.y).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }); }")
                  )
              )
      }
      colores_ordenados <- colores_ge[match(unique(paso$grupo_etario), names(colores_ge))]
      hc <- hc %>% hc_colors(unname(colores_ordenados)) %>%
                   hc_exporting(enabled = TRUE)
      
      return(hc)

    })           
        
          

    # 6.29 Gráfico Multiplot mapa Notif x Vacuna general ----
    
    output$multiMap_vac_gen <- renderPlot({
      
      req(datos_filtrados())
      if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}
      
      paso <- tbl_vacunas_geo(datos_filtrados())$paso_geo_vac
      
      # Define las etiquetas y colores de manera global
      
      labels <- c("0","1-10%", "10-25%", "25-50%", "50-75%", "75-90%", "90-100%")
      color_palette <- c("#D8DEE9","#7f7f7f", "#67a9cf", "#fddbc7", "#2166ac", "#ef8a62", "#b2182b")
      #color_palette = c("#d73027", "#fc8d59", "#fee090", "#e0f3f8", "#91bfdb", "#4575b4")
      #color_palette = c("#f7f7f7", "#67a9cf", "#fddbc7", "#2166ac", "#ef8a62", "#b2182b")
      #color_palette = c("#7b3294", "#c2a5cf", "#f7f7f7", "#a6dba0", "#008837", "#00441b")
      #color_palette = c("#8c510a", "#dfc27d", "#f7f7f7", "#80cdc1", "#35978f", "#01665e")
      #color_palette = c("#f7fbff", "#deebf7", "#c6dbef", "#9ecae1", "#6baed6", "#2171b5")
      names(color_palette) <- labels
      
      # Función para calcular los percentiles
      
      get_percentiles <- function(data) {
        percs <- unique(quantile(data$NOTIF, 
                               probs = c(0, 0.01, 0.10, 0.25, 0.50, 0.75, 0.90, 1), 
                               na.rm = TRUE,type = 7))
        
        # Si hay menos de 7 breaks únicos, se ajusta la escala, crenado breaks artificiales añadiendo pequeños valores
        if(length(percs) < 8) { 
          min_val <- min(data$NOTIF, na.rm = TRUE)
          max_val <- max(data$NOTIF, na.rm = TRUE)
          range_val <- max_val - min_val
          percs <- min_val + range_val * c(0, 0.01, 0.10, 0.25, 0.50, 0.75, 0.90, 1)
        }
        
        return(percs)
      }
      
      # Calcula los percentiles para el conjunto de datos
        
      breaks <- get_percentiles(paso)
      
      # Temp diagnóstico
        
        # # Breaks
        # print("Breaks generales (percentiles) calculados:")
        # print(breaks)
        # 
        # # Distribución de datos
        # print("Resumen de valores NOTIF:")
        # print(summary(paso$NOTIF))

      paso <- paso %>%
        mutate(NOTIF_cat = cut(NOTIF, 
                              breaks = breaks,
                              labels = labels,
                              include.lowest = TRUE))
        
         # # Veamos cuántos datos caen en cada categoría
         #  print("Conteo por categoría:")
         #  print(table(paso$NOTIF_cat))

      
      # Función para generar el mapa
      
      generate_map <- function(data, vacu) {
      
        ggplot(data) +
        geom_sf(aes(fill = NOTIF_cat), lwd = 0.3, color = "white") +
        scale_fill_manual(
          values = color_palette,
          name = "Percentiles",
          limits = labels,  # Especificamos todas las categorías posibles
          drop = FALSE,     # Evitamos que se eliminen niveles no utilizados
          guide = "none"
        ) +
        labs(title = vacu) +
        theme_void() +
        theme(
          plot.title = element_text(size = 12, hjust = 0.5)#,
          # legend.position = "right",
          # legend.justification = 0.5,
          # legend.key.size = unit(1, "cm"),
          # legend.key.width = unit(0.2, "cm"),
          # legend.text = element_text(size = 11),
          # legend.margin = margin()
        )
      } 
      
      
      # Crear una lista de gráficos, uno por cada vacuna
      maps_list <- paso %>%
        split(.$nomcomv) %>%
        purrr::imap(~generate_map(.x, .y))  # .x son los datos, .y es la vacuna
     
      # Crear una leyenda común
      legend_plot <- ggplot() +
        # Usamos el primer conjunto de datos completo en lugar de solo la primera fila
        geom_sf(data = paso, aes(fill = NOTIF_cat)) +
        scale_fill_manual(
          values = color_palette,
          name = "Percentiles",
          limits = labels,
          drop = FALSE
        ) +
        theme_void() +
        theme(
          legend.position = "right",
          legend.justification = 0.5,
          legend.key.size = unit(1.5, "cm"),
          legend.key.width = unit(0.2, "cm"),
          legend.text = element_text(size = 11)
        )
    
      # Extraer la leyenda
      shared_legend <- get_legend(legend_plot)
    
      # Combinar los mapas y la leyenda
      combined_plot <- wrap_plots(maps_list, ncol = floor(length(unique(paso$nomcomv))/2))
      
      final_plot <- plot_grid(
        combined_plot, 
        shared_legend,
        rel_widths = c(0.9, 0.1)
      )
    
      final_plot
    })
      
      
    # 6.30 Gráfico Multiplot mapa Notif x Vacuna ----
    
    output$multiMap_vac <- renderPlot({
      
      req(datos_filtrados())
      if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}
      
      paso <- tbl_vacunas_geo(datos_filtrados())$paso_geo_vac
      
      # Define las etiquetas y colores de manera global
      
      labels <- c("0-10%", "10-25%", "25-50%", "50-75%", "75-90%", "90-100%")
      color_palette <- c("#D8DEE9", "#67a9cf", "#fddbc7", "#2166ac", "#ef8a62", "#b2182b")
      #color_palette = c("#d73027", "#fc8d59", "#fee090", "#e0f3f8", "#91bfdb", "#4575b4")
      #color_palette = c("#f7f7f7", "#67a9cf", "#fddbc7", "#2166ac", "#ef8a62", "#b2182b")
      #color_palette = c("#7b3294", "#c2a5cf", "#f7f7f7", "#a6dba0", "#008837", "#00441b")
      #color_palette = c("#8c510a", "#dfc27d", "#f7f7f7", "#80cdc1", "#35978f", "#01665e")
      #color_palette = c("#f7fbff", "#deebf7", "#c6dbef", "#9ecae1", "#6baed6", "#2171b5")
      names(color_palette) <- labels
      
      # Función para calcular los percentiles
      
      get_percentiles <- function(data) {
        percs <- unique(quantile(data$NOTIF, 
                               probs = c(0, 0.10, 0.25, 0.50, 0.75, 0.90, 1), 
                               na.rm = TRUE,type = 7))
        
        # Si hay menos de 7 breaks únicos, se ajusta la escala, crenado breaks artificiales añadiendo pequeños valores
        if(length(percs) < 7) { 
          min_val <- min(data$NOTIF, na.rm = TRUE)
          max_val <- max(data$NOTIF, na.rm = TRUE)
          range_val <- max_val - min_val
          percs <- min_val + range_val * c(0, 0.10, 0.25, 0.50, 0.75, 0.90, 1)
        }
        
        return(percs)
      }
      
      # Función para generar el mapa
      
      generate_map <- function(data, vacu) {
        
        # Calcula los percentiles para el subconjunto de datos
        
        breaks <- get_percentiles(data)
        
        # Temp diagnóstico
          
          # # Breaks
          # print(paste("Vacuna:", vacu))
          # print("Breaks (percentiles) calculados:")
          # print(breaks)
          # 
          # # Distribución de datos
          # print("Resumen de valores NOTIF:")
          # print(summary(data$NOTIF))
        
        # Crea las etiquetas para las categorías
        #labels <- c("0-10%", "10-25%", "25-50%", "50-75%", "75-90%", "90-100%")
        
        # Verifica si hay suficientes categorías
            
        if(length(unique(breaks)) >= 2) {
          data <- data %>%
            mutate(NOTIF_cat = cut(NOTIF, 
                                  breaks = breaks,
                                  labels = labels,
                                  include.lowest = TRUE))
          
           # # Veamos cuántos datos caen en cada categoría
           #  print("Conteo por categoría:")
           #  print(table(data$NOTIF_cat))
          
        # Genera los mapa
            
        ggplot(data) +
          geom_sf(aes(fill = NOTIF_cat), lwd = 0.3, color = "white") +
          scale_fill_manual(
            values = color_palette,
            name = "Percentiles",
            limits = labels,  # Especificamos todas las categorías posibles
            drop = FALSE     # Evitamos que se eliminen niveles no utilizados
          ) +
          labs(title = vacu) +
          theme_void() +
          theme(
            plot.title = element_text(size = 12, hjust = 0.5),
            legend.position = "right",
            legend.justification = 0.5,
            legend.key.size = unit(1, "cm"),
            legend.key.width = unit(0.2, "cm"),
            legend.text = element_text(size = 11),
            legend.margin = margin()
          )
        } 
          
        # Si no hay suficientes categorías, crear un mapa monocromático
          
        else {
          ggplot(data) +
            geom_sf(fill = "grey90", lwd = 0.3, color = "white") +
            labs(title = paste(vacu, "(insuficientes datos para categorizar)")) +
            theme_void() +
            theme(
              plot.title = element_text(size = 12, hjust = 0.5),
              legend.position = "none"
            )
        }
      }
      

      # Crear una lista de gráficos, uno por cada vacuna
      maps_list <- paso %>%
        split(.$nomcomv) %>%
        purrr::imap(~generate_map(.x, .y))  # .x son los datos, .y es la vacuna
     
      # Combinar los gráficos en un solo gráfico (usar la cantidad adecuada de filas y columnas)
      combined_plot <- wrap_plots(maps_list, ncol = floor(length(unique(paso$nomcomv))/2))  # Puedes ajustar `ncol` según el número de periodos
      
      # Mostrar el gráfico combinado
      combined_plot
      

    })
      
      
    # 6.31 Gráfico Stacked x Estado y vacuna ----

    output$pareto_estado_vacuna <- renderHighchart({

      req(datos_filtrados())
      if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}

      paso <- as.data.table(tbl_vacunas_geo(datos_filtrados())$paso_estado_vac)

      colores_vacuna_ord <- colores_vacunas[match(unique(paso$nomcomv), names(colores_vacunas))]

      grafico <- highchart() %>%
      hc_chart(type = "bar") %>%
      hc_xAxis(categories = unique(paso$geonoti), visible = TRUE) %>%
      hc_yAxis(
          labels = list(format = "{value}%"),
          max = 100
      ) %>%
      #hc_colors(colores_vacunas[unique(paso$nomcomv)]) %>%
      hc_colors(unname(colores_vacuna_ord)) %>%
      hc_plotOptions(
          series = list(
              stacking = "percent"  # percent para mostrar porcentajes
          )
      ) %>%
      hc_scrollbar(enabled = FALSE)

      # Agrega una serie por cada tipo de vacuna
      for(vac in unique(paso$nomcomv)) {
          datos_vacuna <- paso[nomcomv == vac]
          grafico <- grafico %>%
              hc_add_series(
                  name = vac,
                  data = datos_vacuna$pNOTIF,
                  dataLabels = list(
                      enabled = TRUE,
                      formatter = JS("function() { return Math.round(this.percentage) + '%'; }")  # Redondeamos el porcentaje
                  )
              )
      }

      grafico <- grafico %>%
          hc_tooltip(
              pointFormat = "<span style='color:{point.color}'>{series.name}</span>: {point.percentage:.1f}%<br/>"
          ) %>%
          hc_exporting(enabled = TRUE)

      return(grafico)

    })
        
        
    # 6.32 Gráfico Pareto x Vacuna y Dosis ----
    
    output$pareto_vacuna_dosis <- renderHighchart({
      
      req(datos_filtrados())
      if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}
        
      paso <- tbl_notif_x_vacuna_dosis(datos_filtrados())
      paso <- paso[order(NOTIF, decreasing = TRUE),]
        
      hc <- highchart() %>%
        hc_chart(type = "bar") %>%
        hc_xAxis(categories = unique(paso$nomcomv), visible = TRUE) %>%
        hc_xAxis(title = list(text = "Vacunas administradas")) %>%
        hc_yAxis(
          labels = list(format = "{value}%"),
          max = 100
        ) %>%
        # hc_plotOptions(bar = list(
        #   horizontal = TRUE,
        #   dataLabels = list(enabled = TRUE, 
        #                     formatter = JS("function() { return Math.abs(this.y).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }); }")
        #                     )
        # )) %>%
        hc_plotOptions(
            series = list(
                stacking = "percent"  # percent para mostrar porcentajes
            )
        ) %>%
        hc_labels(enabled = TRUE) %>%
        hc_scrollbar(enabled = FALSE) %>%
        hc_exporting(enabled = TRUE)
      
        
      # Agrega una serie por cada tipo de vacuna
      for(dosis in unique(paso$doseImunobiologico)) {
          datos_dosis <- paso[doseImunobiologico == dosis]
          hc <- hc %>%
              hc_add_series(
                  name = dosis,
                  data = datos_dosis$NOTIF,
                  dataLabels = list(
                      enabled = TRUE,
                      formatter = JS("function() { return Math.round(this.percentage) + '%'; }")
                  )
              )
      }
      
      return(hc)
    })
 

    # # 6.32 Gráfico Pareto x Vacuna y lote ----
    # 
    # output$pareto_vacuna_lote <- renderHighchart({
    #   
    #   req(datos_filtrados())
    #   if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}
    #     
    #   paso <- tbl_notif_x_vacuna_lote(datos_filtrados())
    #   #paso <- paso[loteImunobiologico!="No especificado",]
    #   paso <- paso[order(NOTIF, decreasing = TRUE),]
    #   paso <- paso[1:50,]
    #   
    #   hc <- highchart() %>%
    #     hc_chart(type = "column") %>%
    #     hc_xAxis(categories = paso$lote) %>%
    #     hc_xAxis(title = list(text = "Lote de vacuna administrada")) %>%
    #     hc_add_series(data = paso$NOTIF, name = "Notificaciones") %>%
    #     hc_legend(enabled = FALSE) %>%
    #     hc_plotOptions(bar = list(
    #       horizontal = TRUE,
    #       dataLabels = list(enabled = TRUE, 
    #                         formatter = JS("function() { return Math.abs(this.y).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }); }"))
    #       )) %>%
    #     hc_labels(enabled = FALSE) %>%
    #     hc_scrollbar(enabled = FALSE) %>%
    #     hc_exporting(enabled = TRUE)
    # 
    #   return(hc)
    # })
        
        
    # 6.33 Gráfico vacuna - evento - desenlace ----
    
    output$sankye_vac_eve_des <- renderHighchart({
      
      req(datos_filtrados())
      if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}
      
      paso <- as.data.table(tbl_vac_eve_des(datos_filtrados()))
      
      #nomcomv","pt","evolucaoCaso
      
      grafico <- highchart() %>%
        hc_chart(
          type = "spline",
          parallelCoordinates = TRUE,
          parallelAxes = list(lineWidth = 3)
        ) %>%
        hc_xAxis(categories = c("Vacuna","PT","Desenlace")) %>%
        hc_yAxis_multiples(
          list(categories = unique(paso$nomcomv)),
          list(categories = unique(paso$pt)),
          list(categories = unique(paso$evolucaoCaso))
        ) %>%
        hc_add_series_list(lapply(seq_along(paso), function(i) {
          list(
            name = paste("Notificaciones", i),
            data = paso$NOTIF[[i]],
            shadow = FALSE,
            color = "rgba(11, 200, 200, 0.1)"
          )
        })) %>%
        hc_exporting(enabled = TRUE)
      
      return(grafico)
      
    })
      
        
    # 6.34 Gráfico Pareto Notif x Vacuna - Gravedad - Sexo ----
    
      output$bar_noti_vac_gravedad_sexo <- renderHighchart({
  
        req(datos_filtrados())
        if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}
          
        paso <- tbl_notif_x_vacuna_gravedad_sexo(datos_filtrados())
        
        # Aseguramos que el orden sea consistente
        paso <- paso[order(marca_grave, -sexo),]
        
        # Creamos un vector con el orden exacto de las combinaciones
        combinaciones <- c(
          "Grave - Femenino",
          "Grave - Masculino",
          "Grave - No especificado",
          "No grave - Femenino",
          "No grave - Masculino",
          "No grave - No especificado"
        )
        
        # Extraemos los colores en el orden exacto
        colores_orden <- unname(colores_gravedad_sexo[combinaciones])
        
        hc <- highchart() %>%
          hc_chart(type = "bar") %>%
          hc_xAxis(
            categories = unique(paso$nomcomv),
            visible = TRUE,
            #title = list(text = "Vacunas administradas"),
            labels = list(
              style = list(fontSize = "12px")
            )
          ) %>%
          hc_yAxis(
            title = list(text = "Número de notificaciones"),
            stackLabels = list(
              enabled = TRUE,
              formatter = JS("function() { return Math.abs(this.total).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }); }")
            )
          ) %>%
          hc_plotOptions(
            series = list(
              stacking = 'percent'
            ),
            bar = list(
              horizontal = TRUE,
              grouping = TRUE,
              groupPadding = 0.15,
              pointPadding = 0.1,
              dataLabels = list(
                enabled = TRUE,
                formatter = JS("function() { return Math.abs(this.y).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }); }")
              )
            )
          ) %>%
          hc_labels(enabled = FALSE) %>%
          hc_scrollbar(enabled = FALSE)
        
        # Establecemos los colores exactos antes de agregar las series
        hc <- hc %>% hc_colors(colores_orden)
        
        # Agregamos las series en el mismo orden que los colores
        for(combinacion in combinaciones) {
          # Separamos la combinación en gravedad y sexo
          partes <- strsplit(combinacion, " - ")[[1]]
          grave <- partes[1]
          sex <- partes[2]
          
          datos_serie <- paso[marca_grave == grave & sexo == sex]
          
          if(nrow(datos_serie) == 0) {
            datos_serie <- data.frame(
              NOTIF = rep(0, length(unique(paso$nomcomv)))
            )
          }
          
          hc <- hc %>%
            hc_add_series(
              name = combinacion,
              data = datos_serie$NOTIF,
              stack = grave,
              dataLabels = list(
                enabled = TRUE,
                formatter = JS("function() { return Math.abs(this.y).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }); }")
              )
            )
        }
        
        hc <- hc %>% 
          hc_legend(
            layout = "vertical",
            align = "right",
            verticalAlign = "middle",
            itemStyle = list(fontWeight = "normal"),
            groupBy = "stack"
          ) %>%
          hc_exporting(enabled = TRUE)
        
        return(hc)
      })
        
        
    # 6.35 Gráfico Pareto Eventos x SOC ----
    
    output$pareto_soc <- renderHighchart({
      
      req(datos_filtrados())
      if (is.null(datos_filtrados()$datos)) {return(NULL)}
      
      paso <- as.data.table(tbl_event_x_soc(datos_filtrados()))
      paso <- paso[order(EVENT, decreasing = TRUE),]
      
      n_elementos <- min(input$n_term_meddra, nrow(paso))
      paso <- paso[1:n_elementos,]
      
      grafico <- highchart() %>%
          hc_chart(type = "bar") %>%
          hc_xAxis(categories = paso$soc,visible = TRUE) %>%
          hc_colors(vColor1) %>%
          hc_add_series(
              name = "Eventos",
              data = paso$EVENT,
              dataLabels = list(enabled = TRUE, 
                                #format = "{point.y}")
                                formatter = JS("function() { return this.y.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 1, useGrouping: true }); }")
              )) %>%
          hc_tooltip(
              pointFormat = "{point.y:,.1f}"
          ) %>%
          hc_exporting(enabled = TRUE)
      
      
      return(grafico)
      
    })
        
        
    # 6.36 Gráfico Pareto Eventos x HLGT ----
    
    output$pareto_hlgt <- renderHighchart({
      
      req(datos_filtrados())
      if (is.null(datos_filtrados()$datos)) {return(NULL)}
      
      paso <- as.data.table(tbl_event_x_hlgt(datos_filtrados()))
      paso <- paso[order(EVENT, decreasing = TRUE),]
      
      n_elementos <- min(input$n_term_meddra, nrow(paso))
      paso <- paso[1:n_elementos,]
      
      grafico <- highchart() %>%
          hc_chart(type = "bar") %>%
          hc_xAxis(categories = paso$hlgt,visible = TRUE) %>%
          hc_colors(vColor24) %>%
          hc_add_series(
              name = "Eventos",
              data = paso$EVENT,
              dataLabels = list(enabled = TRUE, 
                                #format = "{point.y}")
                                formatter = JS("function() { return this.y.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 1, useGrouping: true }); }")
              )) %>%
          hc_tooltip(
              pointFormat = "{point.y:,.1f}"
          ) %>%
          hc_exporting(enabled = TRUE)
      
      
      return(grafico)
      
    })
        
        
    # 6.37 Gráfico Pareto Eventos x HLT ----
    
    output$pareto_hlt <- renderHighchart({
      
      req(datos_filtrados())
      if (is.null(datos_filtrados()$datos)) {return(NULL)}
      
      paso <- as.data.table(tbl_event_x_hlt(datos_filtrados()))
      paso <- paso[order(EVENT, decreasing = TRUE),]
      
      n_elementos <- min(input$n_term_meddra, nrow(paso))
      paso <- paso[1:n_elementos,]
      
      grafico <- highchart() %>%
          hc_chart(type = "bar") %>%
          hc_xAxis(categories = paso$hlt,visible = TRUE) %>%
          hc_colors(vColor12) %>%
          hc_add_series(
              name = "Eventos",
              data = paso$EVENT,
              dataLabels = list(enabled = TRUE, 
                                #format = "{point.y}")
                                formatter = JS("function() { return this.y.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 1, useGrouping: true }); }")
              )) %>%
          hc_tooltip(
              pointFormat = "{point.y:,.1f}"
          ) %>%
          hc_exporting(enabled = TRUE)
      
      
      return(grafico)
      
    })
        
      
        
    # 6.38 Gráfico Pareto Eventos x PT ----
    
    output$pareto_pt <- renderHighchart({
      
      req(datos_filtrados())
      if (is.null(datos_filtrados()$datos)) {return(NULL)}
      
      paso <- as.data.table(tbl_event_x_pt(datos_filtrados()))
      paso <- paso[order(EVENT, decreasing = TRUE),]
      
      n_elementos <- min(input$n_term_meddra, nrow(paso))
      paso <- paso[1:n_elementos,]
      
      grafico <- highchart() %>%
          hc_chart(type = "bar") %>%
          hc_xAxis(categories = paso$pt,visible = TRUE) %>%
          hc_colors(vColor16) %>%
          hc_add_series(
              name = "Eventos",
              data = paso$EVENT,
              dataLabels = list(enabled = TRUE, 
                                #format = "{point.y}")
                                formatter = JS("function() { return this.y.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 1, useGrouping: true }); }")
              )) %>%
          hc_tooltip(
              pointFormat = "{point.y:,.1f}"
          ) %>%
          hc_exporting(enabled = TRUE)
      
      
      return(grafico)
      
    })
        
        

    # 6.41 Gráfico Bubble PT-Vac ----
    
    output$bubble_soc_vac <- renderHighchart({
      
      req(datos_filtrados())
      if (is.null(datos_filtrados()$datos)) {return(NULL)}
      
      paso <- tbl_bubble_soc_vac(datos_filtrados())
      paso <- paso %>% mutate(nomcomv = fifelse(is.na(nomcomv),"Sin info", nomcomv))

            
      # Convertir el data frame a formato compatible con highcharter
      
      data_for_chart <- paso %>%
        group_by(paso$nomcomv) %>%
        group_map(~list(
          name = first(.x$nomcomv),
          data = lapply(1:nrow(.x), function(i) {
            list(
              name = .x$soc[i],
              value = .x$EVENT[i]
            )
          })
        ))
      
      hc <- highchart() %>%
        hc_chart(type = "packedbubble") %>%
        hc_legend(enabled = TRUE) %>%
        hc_tooltip(
          useHTML = TRUE,
          pointFormat = "<b>{point.name}:</b><br>{point.value}"
        ) %>%
        hc_plotOptions(
          packedbubble = list(
            minSize = "15%",
            maxSize = "90%",
            zMin = 0,
            zMax = 1000,
            layoutAlgorithm = list(
              splitSeries = TRUE,
              gravitationalConstant = 0.09
            ),
            dataLabels = list(
              enabled = TRUE,
              format = "{point.name}<br>{point.value}",
              filter = list(
                property = "y",
                operator = ">",
                value = 250
              ),
              style = list(
                color = "black",
                textOutline = "none",
                fontWeight = "normal"
              )
            )
          )
        ) %>%
        hc_exporting(enabled = TRUE) %>%
        hc_exporting(enabled = TRUE)
      
      # Agregar las series usando los datos procesados
      for(series in data_for_chart) {
        hc <- hc %>% hc_add_series(
          name = series$name,
          data = series$data
        )
      }

      return(hc)
      
    })
        
        
    # 6.42 Gráfico Pareto Eventos x PT (Graves) ----
    
     output$bar_event_pt_graves <- renderHighchart({
      
      req(datos_filtrados())
      if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}
        
      paso <- as.data.table(tbl_event_x_pt_gravedad(datos_filtrados()))
      paso <- paso[marca_grave == "Grave",]    

      paso <- paso[order(paso$EVENT, decreasing = TRUE),]
      
      n_elementos <- min(input$n_pt_gravedad, nrow(paso))
      paso <- paso[1:n_elementos,]
      
      hc <- highchart() %>%
        hc_chart(type = "bar") %>%
        hc_xAxis(categories = paso$pt) %>%
        hc_xAxis(opposite = TRUE) %>%
        #hc_xAxis(title = list(text = "Término MedDRA")) %>%
        hc_colors(color_grave) %>%
        hc_add_series(data = paso$EVENT * -1, name = "Graves", type = "bar") %>%
        hc_plotOptions(bar = list(
        horizontal = TRUE,
        dataLabels = list(enabled = TRUE, 
                          #format = "{point.y}",
                          formatter = JS("function() { return Math.abs(this.y).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }); }"))
        )) %>%
        # Configuración del eje Y
        hc_yAxis(
          #title = list(text = NULL),
          labels = list(
            formatter = JS("function() {
              return Math.abs(this.value);
            }")
          )
        ) %>%
        hc_tooltip(
         formatter = JS("function() { return '<b>' + this.series.name + ', ' + this.point.category + '</b><br/>' + 'Eventos: ' + Math.abs(this.y).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }) ; }")
        ) %>%
        hc_labels(enabled = FALSE) %>%
        hc_scrollbar(enabled = FALSE) %>%
        hc_exporting(enabled = TRUE)

      return(hc)

    })
        
        
    # 6.43 Gráfico Pareto Eventos x PT (No Graves) ----
    
     output$bar_event_pt_no_graves <- renderHighchart({
      
      req(datos_filtrados())
      if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}
        
      paso <- as.data.table(tbl_event_x_pt_gravedad(datos_filtrados()))
      paso <- paso[marca_grave == "No grave",]    

      paso <- paso[order(paso$EVENT, decreasing = TRUE),]
      
      n_elementos <- min(input$n_pt_gravedad, nrow(paso))
      paso <- paso[1:n_elementos,]
      
      hc <- highchart() %>%
        hc_chart(type = "column") %>%
        hc_xAxis(categories = paso$pt) %>%
        #hc_xAxis(title = list(text = "Término MedDRA")) %>%
        hc_colors(color_no_grave) %>%
        hc_add_series(data = paso$EVENT, name = "No Graves", type = "bar") %>%
        hc_plotOptions(bar = list(
        horizontal = TRUE,
        dataLabels = list(enabled = TRUE, 
                          #format = "{point.y}",
                          formatter = JS("function() { return Math.abs(this.y).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }); }"))
        )) %>%
        # Configuración del eje Y
        hc_yAxis(
          #title = list(text = NULL),
          labels = list(
            formatter = JS("function() {
              return Math.abs(this.value);
            }")
          )
        ) %>%
        hc_tooltip(
         formatter = JS("function() { return '<b>' + this.series.name + ', ' + this.point.category + '</b><br/>' + 'Eventos: ' + Math.abs(this.y).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }) ; }")
        ) %>%
        hc_labels(enabled = FALSE) %>%
        hc_scrollbar(enabled = FALSE) %>%
        hc_exporting(enabled = TRUE)

      return(hc)

    })
        
    
    # 6.44 Gráfico Pareto Eventos x PT (Hombres) ----
    
     output$bar_event_pt_hombres <- renderHighchart({
      
      req(datos_filtrados())
      if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}
        
      paso <- as.data.table(tbl_event_x_pt_sexo(datos_filtrados()))
      paso <- paso[sexo == "Masculino",]    

      paso <- paso[order(paso$EVENT, decreasing = TRUE),]
      
      n_elementos <- min(input$n_pt_sexo_ge, nrow(paso))
      paso <- paso[1:n_elementos,]
      
      hc <- highchart() %>%
        hc_chart(type = "bar") %>%
        hc_xAxis(categories = paso$pt) %>%
        hc_xAxis(opposite = TRUE) %>%
        #hc_xAxis(title = list(text = "Término MedDRA")) %>%
        hc_colors(color_hombres) %>%
        hc_add_series(data = paso$EVENT *-1, name = "Hombres", type = "bar") %>%
        hc_plotOptions(bar = list(
          horizontal = TRUE,
          dataLabels = list(enabled = TRUE,
                            #format = "{point.y}",
                            formatter = JS("function() { return Math.abs(this.y).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }); }"))
          )
        )  %>%
        # Configuración del eje Y
        hc_yAxis(
          #title = list(text = NULL),
          labels = list(formatter = JS("function() {return Math.abs(this.value);}")          )
        ) %>%
        hc_tooltip(
         formatter = JS("function() { return '<b>' + this.series.name + ', ' + this.point.category + '</b><br/>' + 'Eventos: ' + Math.abs(this.y).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }) ; }")
        ) %>%
        hc_labels(enabled = FALSE) %>%
        hc_scrollbar(enabled = FALSE) %>%
        hc_exporting(enabled = TRUE)

      return(hc)

    })
        
        
    # 6.45 Gráfico Pareto Eventos x PT (Mujeres) ----
    
     output$bar_event_pt_mujeres <- renderHighchart({
      
      req(datos_filtrados())
      if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}
        
      paso <- as.data.table(tbl_event_x_pt_sexo(datos_filtrados()))
      paso <- paso[sexo == "Femenino",]    

      paso <- paso[order(paso$EVENT, decreasing = TRUE),]
      
      n_elementos <- min(input$n_pt_sexo_ge, nrow(paso))
      paso <- paso[1:n_elementos,]
      
      hc <- highchart() %>%
        hc_chart(type = "bar") %>%
        hc_xAxis(categories = paso$pt) %>%
        #hc_xAxis(title = list(text = "Término MedDRA")) %>%
        hc_colors(color_mujeres) %>%
        hc_add_series(data = paso$EVENT, name = "Mujeres", type = "bar") %>%
        hc_plotOptions(bar = list(
        horizontal = TRUE,
        dataLabels = list(enabled = TRUE, 
                          #format = "{point.y}",
                          formatter = JS("function() { return Math.abs(this.y).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }); }"))
        ))  %>%
        # Configuración del eje Y
        hc_yAxis(
          #title = list(text = NULL),
          labels = list(
            formatter = JS("function() {
              return Math.abs(this.value);
            }")
          )
        ) %>%
        hc_tooltip(
         formatter = JS("function() { return '<b>' + this.series.name + ', ' + this.point.category + '</b><br/>' + 'Eventos: ' + Math.abs(this.y).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }) ; }")
        ) %>%
        hc_labels(enabled = FALSE) %>%
        hc_scrollbar(enabled = FALSE) %>%
        hc_exporting(enabled = TRUE)

      return(hc)

    })
        
      
    # 6.46 Gráfico Treemap Vacuna SOC PT ----
    
     output$treemap_event_soc_pt_vacuna <- renderHighchart({
      
      req(datos_filtrados())
      if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}
        
      #paso <- as.data.table(tbl_TreeMap_soc_pt_vac(datos_filtrados()))
      
      hc <- highchart() %>%
        hc_chart(type = "treemap") %>%
        hc_subtitle(
          text = "Click en recuadro para hacer drill down",
          align = "left"
        ) %>%
        hc_add_series(
          name = "Vacunas",
          layoutAlgorithm = "squarified",
          allowDrillToNode = TRUE,
          animationLimit = 1000,
          dataLabels = list(enabled = FALSE),
          levels = list(
            list(
              level = 1,
              dataLabels = list(enabled = TRUE),
              borderWidth = 3,
              levelIsConstant = FALSE
            ),
            list(
              level = 1,
              dataLabels = list(
                style = list(fontSize = "14px")
              )
            )
          ),
          data = process_data_to_treemap()
        )
      
      # Configuración adicional
      hc %>%
        hc_size(height = 600) %>%
        hc_exporting(enabled = TRUE)

    })
        
        
    # 6.47 Gráfico Heatmap PT - GE ----
    
     output$heatmap_event_pt_ge <- renderHighchart({
      
      req(datos_filtrados())
      if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}
      
      paso <- tbl_HeatMap_pt_ge(datos_filtrados())
      paso <- paso %>% filter(ord_pt <= input$n_pt_sexo_ge)
      
      pts <- unique(paso$pt)
      ges <- unique(paso$grupo_etario)
      
      # Crear la lista de datos
      datos <- list()
      for(i in 1:nrow(paso)) {
        # Obtener índices
        pts_idx <- match(paso$pt[i], pts) - 1  # Resta 1 para que empiece en 0
        ges_idx <- match(paso$grupo_etario[i], ges) - 1 # Resta 1 para que empiece en 0
        
        # Agregar el vector a la lista
        datos[[i]] <- c(ges_idx, pts_idx, paso$EVENT[i])
      }
      
      highchart() %>%
        hc_chart(type = "heatmap") %>%
        hc_xAxis(categories = ges) %>%
        hc_yAxis(
          categories = pts,
          title = NULL,
          reversed = TRUE
        ) %>%
        hc_colorAxis(
          min = 0,
          minColor = "#FFFFFF",
          maxColor = "#7cb5ec"
        ) %>%
        hc_legend(
          align = "right",
          layout = "vertical",
          margin = 0,
          verticalAlign = "top",
          y = 25,
          symbolHeight = 280
        ) %>%
        # hc_tooltip(
        #   formatter = JS("function () {
        #     return '<b>' + this.series.xAxis.categories[this.point.x] + '</b><br>' +
        #            '<b>' + this.series.yAxis.categories[this.point.y] + '</b>' +
        #            '<b>' + this.point.value + '</b> eventos <br>';
        #   }")
        # ) %>%
        hc_tooltip(
         formatter = JS("function() { return '<b>' + this.series.yAxis.categories[this.point.y] + '</b><br/>' + '<b>' + this.series.xAxis.categories[this.point.x] + '</b><br/>' + 'Eventos: ' + Math.abs(this.point.value).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }) ; }")
        ) %>%
        hc_add_series(
          name = "eventos por PT",
          data = datos,
          dataLabels = list(enabled = TRUE, color = "#000000"),
          borderWidth = 1
        ) %>%
        hc_exporting(enabled = TRUE)
    })
        
        
    # 6.48 Gráfico Densidad Edad Sexo PT - GE ----
    
      # output$densidad_edad_sexo <- renderHighchart({
      #   
      #   req(datos_filtrados())
      #   if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}
      #   
      #   paso <- tbl_Densidad_edad_sexo(datos_filtrados())
      #   
      #   f <- paso %>% filter(sexo == "Femenino")
      #   m <- paso %>% filter(sexo == "Masculino")
      #   
      #   # Usar na.omit() para eliminar NAs al calcular la densidad
      #   if(sum(!is.na(m$edad)) > 1 && sum(!is.na(f$edad)) > 1) {
      #     hc <- hchart(
      #       density(na.omit(m$edad)), type = "areaspline", 
      #       color = color_hombres, name = "Hombres"
      #       ) %>%
      #       hc_add_series(
      #         density(na.omit(f$edad)), type = "areaspline",
      #         color = color_mujeres, name = "Mujeres"
      #         ) %>%
      #       hc_exporting(enabled = TRUE)
      #   } else {
      #     hc <- highchart() %>%
      #       hc_title(text = "Datos insuficientes para mostrar la densidad")
      #   }
      #   
      #   return(hc)  
      # })
     
        
    output$densidad_edad_sexo <- renderHighchart({
      
      req(datos_filtrados(), input$select_metrica_sexo)
      if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}
      
      paso <- tbl_Densidad_edad_sexo(datos_filtrados())
      
      # Verificar si hay datos en paso
      if (is.null(paso) || nrow(paso) == 0) {
        return(highchart() %>%
          hc_title(
            text = "No hay datos disponibles",
            style = list(fontSize = "16px", color = "#666")
          ) %>%
          hc_subtitle(
            text = "Verifique que los datos se hayan cargado correctamente",
            style = list(fontSize = "12px", color = "#999")
          ))
      }
      f <- paso %>%
        filter(sexo == "Femenino") %>%
        filter(!is.na(edad)) %>%
        filter(edad >= 0) %>%
        mutate(edad = as.integer(floor(edad)))
      m <- paso %>%
        filter(sexo == "Masculino") %>%
        filter(!is.na(edad)) %>%
        filter(edad >= 0) %>%
        mutate(edad = as.integer(floor(edad)))
      
      # Verificar que hay suficientes datos para cada sexo
      if(nrow(m) > 0 && nrow(f) > 0) {
        
        # Calcular frecuencias para cada valor único de edad
        freq_m <- m %>% 
          count(edad) %>% 
          mutate(prop = n / sum(n))  # Convertir a proporciones
          
        freq_f <- f %>% 
          count(edad) %>% 
          mutate(prop = n / sum(n))  # Convertir a proporciones
        
        # Obtener todos los valores únicos de edad entre ambos grupos
        todas_edades <- sort(unique(c(freq_m$edad, freq_f$edad)))
        
        # Crear dataframe completo para ambos sexos
        df_completo <- data.frame(edad = todas_edades) %>%
          # Unir con datos de hombres
          left_join(freq_m %>% select(edad, hombres = n, prop_hombres = prop), by = "edad") %>%
          # Unir con datos de mujeres
          left_join(freq_f %>% select(edad, mujeres = n, prop_mujeres = prop), by = "edad") %>%
          # Reemplazar NA con 0 (sin usar replace_na)
          mutate(
            hombres = ifelse(is.na(hombres), 0, hombres),
            mujeres = ifelse(is.na(mujeres), 0, mujeres),
            prop_hombres = ifelse(is.na(prop_hombres), 0, prop_hombres),
            prop_mujeres = ifelse(is.na(prop_mujeres), 0, prop_mujeres)
          )
        
        if (input$select_metrica_sexo == "Proporción") {
          data_hombres <- df_completo$prop_hombres
          data_mujeres <- df_completo$prop_mujeres
          titulo_eje_y <- "Proporción"
          formato_tooltip <- "{series.name}: {point.y:.2f} ({point.percentage:.1f}%)"
        } else {
          data_hombres <- df_completo$hombres
          data_mujeres <- df_completo$mujeres
          titulo_eje_y <- "Frecuencia"
          formato_tooltip <- "{series.name}: {point.y}"
        }
        
        # Crear el gráfico con highcharter
        hc <- highchart() %>%
          hc_chart(type = "column") %>%
          hc_xAxis(
            categories = df_completo$edad,
            title = list(text = "Edad")
          ) %>%
          hc_yAxis(
            title = list(text = titulo_eje_y)
          ) %>%
          hc_add_series(
            name = "Hombres",
            data = data_hombres,
            color = color_hombres
          ) %>%
          hc_add_series(
            name = "Mujeres",
            data = data_mujeres,
            color = color_mujeres
          ) %>%
          hc_plotOptions(
            column = list(
              pointPadding = 0.05,
              groupPadding = 0.1,
              borderWidth = 0
            )
          ) %>%
          hc_tooltip(
            headerFormat = "<b>Edad: {point.key}</b><br/>",
            pointFormat = formato_tooltip
          ) %>%
          hc_exporting(enabled = TRUE)
      } else {
        # Mensaje más informativo sobre qué datos faltan
        mensaje_falta <- c()
        if (nrow(m) == 0) mensaje_falta <- c(mensaje_falta, "datos de sexo Masculino")
        if (nrow(f) == 0) mensaje_falta <- c(mensaje_falta, "datos de sexo Femenino")

        total_registros <- nrow(paso)
        registros_sin_edad <- sum(is.na(paso$edad))
        hc <- highchart() %>%
          hc_title(
            text = "Datos insuficientes para mostrar la distribución",
            style = list(fontSize = "16px", color = "#DE4C39")
          ) %>%
            hc_subtitle(text = paste0(
              "Faltan: ", paste(mensaje_falta, collapse = " y "), ".<br>",
              "Total de registros: ", total_registros, "<br>",
              "Registros sin edad válida: ", registros_sin_edad, " (",
              round(registros_sin_edad / total_registros * 100, 1), "%)<br>",
              "Masculino válidos: ", nrow(m), " | Femenino válidos: ", nrow(f)
            ), style = list(fontSize = "12px", color = "#666"))
      }
      
      return(hc)  
    })
        
        
    
    # 6.49 Gráfico Sankey Vac-SOC-Desenlace ----
    
     output$sankey_vac_soc_desc <- renderHighchart({
      
      req(datos_filtrados(), input$slider_sankey)
      if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}
      
      # Obtener los valores del slider
      min_slider <- input$slider_sankey[1]
      max_slider <- input$slider_sankey[2]
      
      paso <- as.data.table(tbl_sankey_soc_vac_desc(datos_filtrados()))
      paso <- paso[EVENT >= min_slider & EVENT <= max_slider] 
      paso <- paso[order(paso$ord, decreasing = FALSE),]
      
      n_elementos <- min(input$n_sankey, max(paso$ord))
      paso <- paso[paso$ord <= n_elementos, c("desde","hasta","EVENT")]
      
      hc <- highchart() %>%
          hc_chart(type = "sankey") %>%
          hc_add_series(
              data = list_parse(
                  data.frame(
                      from = paso$desde, 
                      to = paso$hasta,
                      weight = paso$EVENT
                  )
              )#,
            # levels = list(
            #     list(level = 0, column = 0),  # Primer eje (vacunas)
            #     list(level = 1, column = 1),  # Segundo eje (síntomas)
            #     list(level = 2, column = 2)   # Tercer eje (desenlaces)
            # ),
            # layoutAlgorithm = "fixed"  # Esto puede ayudar a fijar la posición
          ) %>%
          hc_plotOptions(
              sankey = list(
                  dataLabels = list(enabled = TRUE),
                  colorByPoint = TRUE,
                  nodeWidth = 30,         # ancho de los nodos
                  nodePadding = 15,       # espacio entre nodos
                  curveFactor = 0.5,       # curvatura de los enlaces
                  nodeAlignment = "justify" # Esto fuerza el alineamiento por niveles
              )
          ) %>%
          hc_exporting(enabled = TRUE) %>%
          hc_legend(enabled = TRUE) %>%
          hc_tooltip(pointFormat = "De <b>{point.from}</b> a <b>{point.to}</b>: <b>{point.weight}</b> eventos")
        
      return(hc)  
    })
        
        
        
    # 6.50 Gráfico Heatmap Vacuna Dosis ----
    
     output$heatmap_vac_dosis <- renderHighchart({
      
      req(datos_filtrados())
      if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}
      
      paso <- tbl_HeatMap_vac_dosis(datos_filtrados())
      #paso <- paso %>% filter(ord_nomcomv <= input$n_vac_dosis)
      
      
      vacs  <- unique(paso$nomcomv)
      dosis <- unique(paso$doseImunobiologico)
      
      # Crear la lista de datos
      datos <- list()
      for(i in 1:nrow(paso)) {
        # Obtener índices
        vacs_idx <- match(paso$nomcomv[i], vacs) - 1  # Resta 1 para que empiece en 0
        dosis_idx <- match(paso$doseImunobiologico[i], dosis) - 1 # Resta 1 para que empiece en 0
        
        # Agregar el vector a la lista
        datos[[i]] <- c(dosis_idx, vacs_idx, paso$NOTIF[i])
      }
      
      highchart() %>%
        hc_chart(type = "heatmap") %>%
        hc_xAxis(categories = dosis) %>%
        hc_yAxis(
          categories = vacs,
          title = NULL,
          reversed = TRUE
        ) %>%
        hc_colorAxis(
          min = 0,
          minColor = "#FFFFFF",
          maxColor = vColor12
        ) %>%
        hc_legend(
          align = "right",
          layout = "vertical",
          margin = 0,
          verticalAlign = "top",
          y = 25,
          symbolHeight = 280
        ) %>%
        # hc_tooltip(
        #   formatter = JS("function () {
        #     return '<b>' + this.series.xAxis.categories[this.point.x] + '</b><br>' +
        #            '<b>' + this.series.yAxis.categories[this.point.y] + '</b>' +
        #            '<b>' + this.point.value + '</b> eventos <br>';
        #   }")
        # ) %>%
        hc_tooltip(
         formatter = JS("function() { return '<b>' + this.series.yAxis.categories[this.point.y] + '</b><br/>' + '<b>' + this.series.xAxis.categories[this.point.x] + '</b><br/>' + 'Eventos: ' + Math.abs(this.point.value).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: true }) ; }")
        ) %>%
        hc_add_series(
          name = "Casos por vacuna",
          data = datos,
          dataLabels = list(enabled = TRUE, color = "#000000"),
          borderWidth = 1
        ) %>%
        hc_exporting(enabled = TRUE)
    })
        
 
    # 6.51 Tablas de Disproporcionalidad - Contenido ----
      
      output$analisis_disprop <- renderDT({

        req(datos_filtrados_disprop(), input$nivel_analisis, input$tipo_analisis)
        
        paso <- datos_filtrados_disprop()
        
        # Formato a los numeros
        
        paso <- paso %>% mutate(across(3:4, as.numeric))
        paso <- paso %>% mutate(across(5:ncol(paso), ~ as.numeric(gsub(",", ".", .))))
        
        paso %>% datatable(
                           options = list(pageLength = 15,
                                          dom = 'tlip',  # 'lrtip' coloca el control de paginación y pageLength abajo (lrftip)
                                          rowCallback = JS(
                                            "function(row, data, index) {",
                                            "  if (parseFloat(data[4]) > 2) {",  
                                            "    $(row).css({'color': '#1f77b4'});",
                                            "    $(row).css({'font-weight': 'bold'});",
                                            "  }",
                                            "}"
                                          ),
                                          columnDefs = list(
                                            list(
                                              targets = 5:ncol(paso),
                                              render = JS(
                                                "function(data, type, row, meta) {
                                                  if (type === 'display') {
                                                    return data.toLocaleString('es-ES', { minimumFractionDigits: 2 });
                                                  }
                                                  return data;
                                                }"
                                              )
                                            )
                                          )
                                        ),
                          filter = 'top',
                          selection = 'single'
                          )
      })

    # 6.52 Tablas de Disproporcionalidad - Titulos ----
        
       output$titulo_disprop <- renderUI({
        
        req(input$tipo_analisis, input$nivel_analisis)
        
        # Mapea los valores seleccionados a los nombres completos
        v_nivel_analisis <- switch(input$nivel_analisis,
                                   "analisis_pt" = "PT",
                                   "analisis_smq" = "SMQ",
                                   "analisis_cmq" = "CMQ")
        
        v_tipo_analisis <- switch(input$tipo_analisis,
                                  "analisis_prr" = "PRR",
                                  "analisis_ror" = "ROR",
                                  "analisis_bcpnn_norm" = "BCPNN (Aprox. normal)",
                                  "analisis_bcpnn_mc" = "BCPNN (Aprox. Monte Carlo)")
        
        # Genera el título dinámico con clase CSS
        tags$div(class = "table-tittle", style = "margin-top: 25px;",
                 tags$span(paste0("Análisis de disproporcionalidad ",v_tipo_analisis," por ",v_nivel_analisis)))
      })

        
    # 6.53 Creación dinámica de Sliders ----    
    
      #~ Slider de periodoNoti ----    
              
      output$slider_periodonoti_ui <- renderUI({
        req(datos_filtrados())
        if (is.null(datos_filtrados()$datos)) return(NULL)
        
        datos <- as.data.table(datos_filtrados()$datos)
        
        # Obtener solo las semanas epidemiológicas que existen en los datos
        semanas_existentes <- sort(unique(datos$semEpiNoti))
        min_sem <- min(semanas_existentes, na.rm = TRUE)
        max_sem <- max(semanas_existentes, na.rm = TRUE)
        
        # Crear un slider con valores discretos (solo los que existen)
        sliderInput("slider_periodonoti", "Rango semana epidemiológica",
                    min = min_sem, 
                    max = max_sem, 
                    value = c(min_sem, max_sem),
                    step = 1,  # Esto es clave para valores discretos
                    ticks = FALSE,  # Opcional: ocultar marcas pequeñas
                    sep = "",  # Eliminar separador de miles
                    animate = TRUE
                    #choices = semanas_existentes)  # Usar solo los valores existentes
                  )
      })
          
        
      #~ Slider de periodoNoti_sexo ----    
              
      output$slider_periodonoti_sexo_ui <- renderUI({
        req(datos_filtrados())
        if (is.null(datos_filtrados()$datos)) return(NULL)
        
        datos <- as.data.table(datos_filtrados()$datos)
        
        # Obtener solo las semanas epidemiológicas que existen en los datos
        semanas_existentes <- sort(unique(datos$semEpiNoti))
        min_sem <- min(semanas_existentes, na.rm = TRUE)
        max_sem <- max(semanas_existentes, na.rm = TRUE)
        
        # Crear un slider con valores discretos (solo los que existen)
        sliderInput("slider_periodonoti_sexo", "Rango semana epidemiológica",
                    min = min_sem, 
                    max = max_sem, 
                    value = c(min_sem, max_sem),
                    step = 1,  # Esto es clave para valores discretos
                    ticks = FALSE,  # Opcional: ocultar marcas pequeñas
                    sep = "",  # Eliminar separador de miles
                    animate = FALSE
                    #choices = semanas_existentes)  # Usar solo los valores existentes
                  )
      })
          
        
      #~ Slider de periodoNoti_gravedad ----    
              
      output$slider_periodonoti_gravedad_ui <- renderUI({
        req(datos_filtrados())
        if (is.null(datos_filtrados()$datos)) return(NULL)
        
        datos <- as.data.table(datos_filtrados()$datos)
        
        # Obtener solo las semanas epidemiológicas que existen en los datos
        semanas_existentes <- sort(unique(datos$semEpiNoti))
        min_sem <- min(semanas_existentes, na.rm = TRUE)
        max_sem <- max(semanas_existentes, na.rm = TRUE)
        
        # Crear un slider con valores discretos (solo los que existen)
        sliderInput("slider_periodonoti_gravedad", "Rango semana epidemiológica",
                    min = min_sem, 
                    max = max_sem, 
                    value = c(min_sem, max_sem),
                    step = 1,  # Esto es clave para valores discretos
                    ticks = FALSE,  # Opcional: ocultar marcas pequeñas
                    sep = "",  # Eliminar separador de miles
                    animate = FALSE
                    #choices = semanas_existentes)  # Usar solo los valores existentes
                  )
      })
        
        
      #~ Slider de frec Event Sankey ----    
              
      output$slider_sankey_ui <- renderUI({
        req(datos_filtrados())
        if (is.null(datos_filtrados()$dosis) || is.null(datos_filtrados()$datos)) {return(NULL)}
      
        paso <- tbl_sankey_soc_vac_desc(datos_filtrados())
        
        min_event <- min(paso$EVENT, na.rm = TRUE)
        max_event <- max(paso$EVENT, na.rm = TRUE)
        
        # Crear un slider con valores discretos (solo los que existen)
        sliderInput("slider_sankey", "Seleccione la frecuencia que tienen los eventos a mostrar",
                    min = min_event, 
                    max = max_event, 
                    value = c(min_event, 5000),
                    step = 1,  # Esto es clave para valores discretos
                    ticks = FALSE,  # Opcional: ocultar marcas pequeñas
                    sep = "",  # Eliminar separador de miles
                    animate = FALSE
                    #choices = semanas_existentes)  # Usar solo los valores existentes
                  )
      })
        
    
    # 6.54 Creación dinámica de Selectores ----    
    
      #~ Selector de gravedad eventos sexo ----    
              
      output$select_imput_gravedad_sexo_ui <- renderUI({
        req(datos_filtrados())
        if (is.null(datos_filtrados()$datos)) return(NULL)
        
        datos <- as.data.table(datos_filtrados()$datos)
        valores_gravedad <- sort(unique(datos$marca_grave))

        # Crea un selector con los valores de gravedad
        selectInput("selectInput_grav_sexo", "Seleccione la gravedad del evento:",
                    choices = c("Todos",valores_gravedad),
                    selected = "Todos"
                    )
      })
        
        
      #~ Selector de gravedad eventos sankey ----    
              
      output$select_imput_gravedad_sankey_ui <- renderUI({
        req(datos_filtrados())
        if (is.null(datos_filtrados()$datos)) return(NULL)
        
        datos <- as.data.table(datos_filtrados()$datos)
        valores_gravedad <- sort(unique(datos$marca_grave))

        # Crea un selector con los valores de gravedad
        selectInput("selectInput_grav_sankey", "Seleccione la gravedad del evento:",
                    choices = c("Todos",valores_gravedad),
                    selected = "Todos"
                    )
      })
        
        
      #~ Selector de Vacuna para eventos x gravedad ----    
              
      output$select_imput_vacuna_ui <- renderUI({
        req(datos_filtrados())
        if (is.null(datos_filtrados()$datos)) return(NULL)
        
        datos <- as.data.table(datos_filtrados()$datos)
        valores_vacunas <- sort(unique(datos$nomcomv))

        # Crea un selector con los valores de gravedad
        selectInput("selectInput_vacuna_event", "Seleccione la vacuna a filtrar:",
                    choices = c("Todas",valores_vacunas),
                    selected = "Todas"
                    )
      })
        

      #~ Selector de Vacuna para seccion vacunas ----    
              
      output$select_imput_vac_vacuna_ui <- renderUI({
        req(datos_filtrados())
        if (is.null(datos_filtrados()$datos)) return(NULL)
        
        datos <- as.data.table(datos_filtrados()$datos)
        valores_vacunas <- sort(unique(datos$nomcomv))

        # Crea un selector con los valores de gravedad
        selectizeInput(
          inputId = "selectInput_vacuna_vac",
          label = "Filtrar por una o varias vacunas:",
          choices = valores_vacunas,
          selected = NULL,
          multiple = TRUE,
          width = "100%"
        )
      })
        
            
    # 6.55 Gráfico de timeline ----
        
      output$timeline_ui <- renderUI({
        # Asegurar que las fechas sean Date
        timeline_data$fecha <- as.Date(timeline_data$fecha, format = "%d/%m/%Y")
      
        # Ordenar eventos por fecha descendente
        timeline_data <- timeline_data %>% arrange(desc(ord))
      
        # Obtener años únicos ordenados
        anios <- timeline_data %>%
          pull(anio) %>%
          unique() %>%
          sort(decreasing = TRUE)
      
        # Inicializar la lista de elementos
        items <- list()
      
        # Construir el timeline por año
        for (anio in anios) {
          # Agregar el label del año
          items <- append(items, list(timelineLabel(as.character(anio), color = "teal")))
      
          # Filtrar los eventos solo para ese año
          eventos_anio <- timeline_data %>%
            filter(anio == !!anio) %>%
            arrange(desc(ord))
      
          # Por cada evento, crear el timelineItem correspondiente
          for (i in seq_len(nrow(eventos_anio))) {
            evento <- eventos_anio[i, ]
      
            item <- timelineItem(
              title = evento$titulo,
              time = "",
              evento$descripcion
            )
      
            # Agregar imagen si aplica
            if (!is.na(evento$imagen) && evento$imagen != "") {
              item$children <- append(
                item$children,
                list(timelineItemMedia(image = evento$imagen))
              )
            }
      
            # Agregar el item a la lista
            items <- append(items, list(item))
          }
        }
      
        # Agregar el inicio
        items <- append(items, list(timelineStart(color = "blue")))
      
        # Devolver el bloque del timeline completo
        timelineBlock(
          reversed = TRUE,
          width = 12,
          timelineEnd(color = "orange"),
          do.call(tagList, items)
        )
      })



        
        
     
    # 6.x Ejemplo de Tabla ----
      
      # output$tabla_datos_prueba <- renderTable({
      #   datos_filtrados()
      # })
      
      output$distribucion_tabla <- renderTable({
        
        req(datos_filtrados(),datos_filtrados_disprop())
        if (is.null(datos_filtrados()$datos) || is.null(datos_filtrados_disprop())) {return(NULL)}  
        

                #paso <- as.data.table(datos_filtrados()$datos_disprop)
                
            paso <- tbl_distrb_genero(datos_filtrados())    
          #paso <- as.data.table(tbl_mapa(datos_filtrados()))
           #paso <- tbl_TreeMap_soc_pt_vac(datos_filtrados())
          
          # paso <- tbl_sankey_soc_vac_desc(datos_filtrados())
          # paso <- paso[order(paso$ord, decreasing = FALSE),]
          # 
          # n_elementos <- min(input$n_sankey, max(paso$ord))
          # paso <- paso[paso$ord <= n_elementos,]


      })
    

    
  # ---------------------------------------------------------------------------- -
  # 7. Bloque para Mapa ----------------------------------------------------- ----
  # ---------------------------------------------------------------------------- -
    
    # 7.1 Renderización del mapa completo desde el inicio ----
    output$mapa <- renderLeaflet({
      req(datos_filtrados())
      
      # Obtener datos del mapa usando la función existente
      datos_mapa_actual <- tbl_mapa(datos_filtrados())
      
      # Si no hay datos válidos, mostrar solo mapa base
      if(!inherits(datos_mapa_actual, "sf") || nrow(datos_mapa_actual) == 0) {
        return(leaflet() %>%
          addProviderTiles("OpenStreetMap") %>%
          setView(lng = -55, lat = -15, zoom = 4))
      }
      
      # Variable para colorear (siempre usar NOTIF)
      var_color <- "NOTIF"
      
      # Get unique values in the dataset for our color variable
      unique_values <- unique(datos_mapa_actual[[var_color]])
      
      # Initialize map with base tiles
      map <- leaflet() %>%
        addProviderTiles(input$basemap %||% "OpenStreetMap") %>%
        setView(lng = -55, lat = -15, zoom = 4)
        
      # Try to add polygons with error handling
      tryCatch({
        # Check if we have enough unique values to create quantiles
        if(length(unique_values) >= 5) {
          # Create a color palette with quantiles
          pal <- colorQuantile(
            palette = "Blues",
            domain = datos_mapa_actual[[var_color]],
            n = 5,
            na.color = "#808080"
          )
        } else if(length(unique_values) > 1) {
          # For 2-4 unique values, use bins
          pal <- colorBin(
            palette = "Blues", 
            domain = datos_mapa_actual[[var_color]], 
            bins = length(unique_values),
            na.color = "#808080"
          )
        } else {
          # For a single value, use a fixed color
          pal <- function(x) { return("#1F77B4") }  # Fixed blue color
        }
        
        # Crear etiquetas
        labels <- sprintf(
          "<strong>%s</strong><br/>%s notificaciones",
          datos_mapa_actual$geonoti, 
          format(datos_mapa_actual[[var_color]], big.mark = ",")
        ) %>% lapply(htmltools::HTML)
        
        # Add polygons to the map
        map <- map %>%
          addPolygons(
            data = datos_mapa_actual,
            fillColor = ~pal(get(var_color)),
            fillOpacity = input$transparencia %||% 0.7,
            weight = 1,
            color = "#FFFFFF",
            label = labels,
            highlightOptions = highlightOptions(
              weight = 2,
              color = "#666",
              fillOpacity = (input$transparencia %||% 0.7) + 0.1,
              bringToFront = TRUE
            )
          )
        
        # Only add legend if we have multiple values
        if(length(unique_values) > 1) {
          map <- map %>% 
            addLegend(
              position = "bottomright",
              pal = pal,
              values = datos_mapa_actual[[var_color]],
              title = "Notificaciones",
              opacity = input$transparencia %||% 0.7
            )
        }
        
        # Añadir etiquetas si el checkbox está marcado (valor inicial)
        if (!is.null(input$mostrar_etiquetas) && input$mostrar_etiquetas) {
          # Calcular centroides para colocar las etiquetas
          centroides <- st_centroid(datos_mapa_actual)
          
          # Crear etiquetas de texto simples
          etiquetas_texto <- sprintf(
            "%s: %s", 
            datos_mapa_actual$geonoti,
            format(datos_mapa_actual[[var_color]], big.mark = ",")
          )
          
          map <- map %>%
            addLabelOnlyMarkers(
              data = centroides,
              label = etiquetas_texto,
              labelOptions = labelOptions(
                noHide = TRUE,  # Etiquetas permanentes
                direction = 'center',
                textOnly = TRUE,
                style = list(
                  "color" = "black",
                  "font-weight" = "bold",
                  "background-color" = "white",
                  "border" = "1px solid black",
                  "padding" = "3px",
                  "border-radius" = "3px",
                  "box-shadow" = "3px 3px 3px rgba(0,0,0,0.2)",
                  "font-size" = "10px"  # Tamaño de fuente pequeño para no sobrecargar el mapa
                )
              )
            )
        }
        
      }, error = function(e) {
        # If there's an error, log it and return the base map
        warning("Error rendering map polygons: ", e$message)
        # We'll return the base map without the polygons
      })
      
      # Add export functionality
      map <- map %>% 
        htmlwidgets::onRender("
          function(el, x) {
            var map = this;
        
            L.easyPrint({
              title: 'Exportar mapa',
              position: 'topleft',
              exportOnly: true,
              filename: 'mapa_exportado',
              sizeModes: ['Current']
            }).addTo(map);
          }
        ")
    
      return(map)
    })
    
    # 7.2 Observador para actualizar el mapa cuando los datos o controles cambian ----
    observe({
      req(datos_filtrados(), input$transparencia, input$basemap, input$mostrar_etiquetas)
      
      # Obtener datos del mapa
      datos_mapa_actual <- tbl_mapa(datos_filtrados())
      
      # Asegurar que sea un objeto sf válido 
      if(!inherits(datos_mapa_actual, "sf") || nrow(datos_mapa_actual) == 0) {
        return(NULL)
      }
      
      # Variable para colorear
      var_color <- "NOTIF"
      
      # Get unique values in the dataset for our color variable
      unique_values <- unique(datos_mapa_actual[[var_color]])
      
      # Actualizar mapa - limpiar todo primero
      proxy <- leafletProxy("mapa") %>%
        clearShapes() %>%
        clearControls() %>%
        clearTiles() %>%
        clearMarkers() %>%  # Limpiar etiquetas
        addProviderTiles(input$basemap)
      
      # Try to add polygons with error handling
      tryCatch({
        # Check if we have enough unique values to create quantiles
        if(length(unique_values) >= 5) {
          # Create a color palette with quantiles
          pal <- colorQuantile(
            palette = "Blues",
            domain = datos_mapa_actual[[var_color]],
            n = 5,
            na.color = "#808080"
          )
        } else if(length(unique_values) > 1) {
          # For 2-4 unique values, use bins
          pal <- colorBin(
            palette = "Blues", 
            domain = datos_mapa_actual[[var_color]], 
            bins = length(unique_values),
            na.color = "#808080"
          )
        } else {
          # For a single value, use a fixed color function
          pal <- function(x) { return("#1F77B4") }  # Fixed blue color
        }
        
        # Crear etiquetas para tooltips
        labels <- sprintf(
          "<strong>%s</strong><br/>%s notificaciones",
          datos_mapa_actual$geonoti, 
          format(datos_mapa_actual[[var_color]], big.mark = ",")
        ) %>% lapply(htmltools::HTML)
        
        # Add polygons
        proxy <- proxy %>%
          addPolygons(
            data = datos_mapa_actual,
            fillColor = ~pal(get(var_color)),
            fillOpacity = input$transparencia,
            weight = 1,
            color = "#FFFFFF",
            label = labels,
            highlightOptions = highlightOptions(
              weight = 2,
              color = "#666",
              fillOpacity = input$transparencia + 0.1,
              bringToFront = TRUE
            )
          )
        
        # Only add legend if we have multiple values
        if(length(unique_values) > 1) {
          proxy <- proxy %>% 
            addLegend(
              position = "bottomright",
              pal = pal,
              values = datos_mapa_actual[[var_color]],
              title = "Notificaciones",
              opacity = input$transparencia
            )
        }
        
        # Añadir etiquetas si el checkbox está marcado
        if (input$mostrar_etiquetas) {
          # Calcular centroides para colocar las etiquetas
          tryCatch({
            centroides <- st_centroid(datos_mapa_actual)
            
            # Crear etiquetas de texto simples
            etiquetas_texto <- sprintf(
              "%s: %s", 
              datos_mapa_actual$geonoti,
              format(datos_mapa_actual[[var_color]], big.mark = ",")
            )
            
            proxy <- proxy %>%
              addLabelOnlyMarkers(
                data = centroides,
                label = etiquetas_texto,
                labelOptions = labelOptions(
                  noHide = TRUE,
                  direction = 'center',
                  textOnly = TRUE,
                  style = list(
                    "color" = "black",
                    "font-weight" = "bold",
                    "background-color" = "white",
                    "border" = "1px solid black",
                    "padding" = "3px",
                    "border-radius" = "3px",
                    "box-shadow" = "3px 3px 3px rgba(0,0,0,0.2)",
                    "font-size" = "10px"
                  )
                )
              )
          }, error = function(e) {
            warning("Error adding label markers: ", e$message)
          })
        }
      }, error = function(e) {
        warning("Error updating map: ", e$message)
      })
    })
    
    
  # ::: Bloque de observación general ----------------------------------------------------------------------------
    
    observe({
      print("----- Observador de seguimiento final -----")
      print(paste0("Noti: ",datos_filtrados()$vNotif))
      print(paste0("Noti G: ",datos_filtrados()$vNotif_G))
      print(paste0("Noti NG: ",datos_filtrados()$vNotif_NG))
      print(paste0("%Noti G: ",datos_filtrados()$vNotif_G/datos_filtrados()$vNotif))
      print(paste0("%Noti NG: ",datos_filtrados()$vNotif_NG/datos_filtrados()$vNotif))
      print(paste0("TNoti: ",datos_filtrados()$vNotif/522270193 * 1000000))
      print(paste0("TNoti G: ",datos_filtrados()$vNotif_G/522270193 * 1000000))
      print(paste0("TNoti NG: ",datos_filtrados()$vNotif_NG/522270193 * 1000000))
      print(paste0("fIni: ", datos_filtrados()$vFini))
      print(paste0("fFin: ", datos_filtrados()$vFfin))
      print(paste0("Dosis: ", datos_filtrados()$vDosis))
      print(names(datos_filtrados()$dosis))
      #print("Disprop1:")
      #print(head(datos_filtrados()$datos_disprop))
      #print("Disprop2:")
      #print(head(datos_filtrados_disprop()))
    })
    
    
  # ---------------------------------------------------------------------------- -
  # 8. Otro codigo (temporal) ----------------------------------------------- ----
  # ---------------------------------------------------------------------------- -
        
    
    output$filter_ui <- renderUI({
      if (input$analysis_type == "Gráfico 1") {
        sliderInput("light_years", "Rango de años luz:",
                    min = 0, max = 30, value = c(0, 30))
      } else {
        selectInput("mass_filter", "Filtrar por masa del planeta:",
                    choices = unique(planets_data$Planet_Mass))
      }
    })
    
    output$highchart <- renderHighchart({
      filtered_data <- planets_data
      
      if (input$analysis_type == "Gráfico 1") {
        filtered_data <- filtered_data %>%
          filter(Light_Years_from_Earth >= input$light_years[1] &
                   Light_Years_from_Earth <= input$light_years[2])
      } else {
        filtered_data <- filtered_data %>%
          filter(Planet_Mass == input$mass_filter)
      }
      
      highchart() %>%
        hc_chart(type = "bubble") %>%
        hc_title(text = input$analysis_type) %>%
        hc_add_series(data = filtered_data %>% 
                        select(x, y, Light_Years_from_Earth), 
                      type = "bubble", 
                      marker = list(radius = ~Light_Years_from_Earth)) %>%
        hc_tooltip(pointFormat = '{point.Planets}: {point.Light_Years_from_Earth} light years')
    })
    
    
    output$highchart1 <- renderHighchart({
      filtered_data <- planets_data
      
      highchart() %>%
        hc_chart(type = "bubble") %>%
        hc_title(text = input$analysis_type) %>%
        hc_add_series(data = filtered_data %>% 
                        select(x, y, Light_Years_from_Earth), 
                      type = "bubble", 
                      marker = list(radius = ~Light_Years_from_Earth)) %>%
        hc_tooltip(pointFormat = '{point.Planets}: {point.Light_Years_from_Earth} light years')
    })
    
    output$highchart2 <- renderHighchart({
      filtered_data <- planets_data
      
      highchart() %>%
        hc_chart(type = "bubble") %>%
        hc_title(text = input$analysis_type) %>%
        hc_add_series(data = filtered_data %>% 
                        select(x, y, Light_Years_from_Earth), 
                      type = "bubble", 
                      marker = list(radius = ~Light_Years_from_Earth)) %>%
        hc_tooltip(pointFormat = '{point.Planets}: {point.Light_Years_from_Earth} light years')
    })
    
    
    output$plot1 <- renderPlot({
      plot(cars)
    })
    

  }  # Cierre de la función server
