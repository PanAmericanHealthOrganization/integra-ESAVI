# -------------------------------------------------------------------------------------------------------------- -
# Script: Procesamiento de ESAVI ----
# Version: 1.0
# Nivel: Regional
# Epidemiologos: Analía Cáceres | caceresanali@paho.org  - Felipe Molina | caceresanali@paho.org#
# Cientifico de Datos: Carlos Falla | fallacar@paho.org
# Date: 2025-05-15
# Descripcion: Procesa los datos de ESAVI Covid
# -------------------------------------------------------------------------------------------------------------- -


# -------------------------------------------------------------------------------------------------------------- -
# 1. Ambiente de trabajo ----
# -------------------------------------------------------------------------------------------------------------- -

# 1.1 Configuración ----

# Código para garantizar el uso de español utf8
Sys.setlocale("LC_CTYPE", "es_EC.UTF-8")


# 1.2 Librerías ----

library(data.table)
library(dplyr)
library(tibble)
library(sf)


select <- dplyr::select
filter <- dplyr::filter


# 1.3 Funciones ----

obtener_directorio_script <- function() {
  cmd_args <- commandArgs(trailingOnly = FALSE)
  file_arg <- grep("^--file=", cmd_args, value = TRUE)

  if (length(file_arg) > 0) {
    return(dirname(normalizePath(sub("^--file=", "", file_arg))))
  }

  if (!is.null(sys.frames()[[1]]$ofile)) {
    return(dirname(normalizePath(sys.frames()[[1]]$ofile)))
  }

  if (requireNamespace("rstudioapi", quietly = TRUE)) {
    ruta_rstudio <- tryCatch(rstudioapi::getActiveDocumentContext()$path, error = function(e) NULL)
    if (!is.null(ruta_rstudio) && nzchar(ruta_rstudio)) {
      return(dirname(normalizePath(ruta_rstudio)))
    }
  }

  normalizePath(getwd())
}

agregar_separador <- function(path) {
  separador <- .Platform$file.sep
  if (!endsWith(path, separador)) {
    return(paste0(path, separador))
  }
  path
}

# Función para generar lista de dfs de un campo

f_crear_dim <- function(df, campo, nom_dim) {
  # Convertir el data.frame a data.table
  setDT(df)

  # Obtener los valores únicos, excluir NA y vacíos, y ordenarlos
  valores_unicos <- sort(unique(na.omit(df[[campo]])))
  valores_unicos <- valores_unicos[valores_unicos != ""]

  # Verificar si hay valores únicos, si no, crear un data.frame vacío
  if (length(valores_unicos) == 0) {
    df_param <- data.frame(matrix(ncol = 1, nrow = 0))
  } else {
    df_param <- data.frame(valores_unicos)
  }

  # Asignar nombre a la columna
  names(df_param) <- nom_dim

  return(df_param)
}


# Funcion para liberar memoria

libera_memoria <- function(...) {
  # Obtiene los nombres de los objetos que se quieren eliminar
  objetos <- sapply(substitute(list(...))[-1], deparse)

  if (length(objetos) > 0) {
    rm(list = objetos, envir = .GlobalEnv)
    gc(reset = TRUE)
  }

  # Ejecutar gc() para liberar memoria
  gc(reset = TRUE)
}


# Funciones de formato de número

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


# -------------------------------------------------------------------------------------------------------------- -
# 2. Carga y selección de datos ----
# -------------------------------------------------------------------------------------------------------------- -

script_dir <- obtener_directorio_script()
root_source <- agregar_separador(normalizePath(file.path(script_dir, "..", "fuente_de_datos"), mustWork = FALSE))
root_target <- agregar_separador(normalizePath(file.path(script_dir, "..", "datos"), mustWork = FALSE))

# 2.1 Listado de tablas de la bd ----

files <- list(
  df_patients         = list(file = "db_reg_patient.rds", load = 1),
  df_reports          = list(file = "db_reg_report.rds", load = 1),
  df_vaccines         = list(file = "db_reg_vaccine.rds", load = 1),
  df_events           = list(file = "db_reg_event.rds", load = 1),
  df_events_narrative = list(file = "db_reg_narrative_event.rds", load = 0),
  df_pregnancy        = list(file = "db_reg_pregnancy.rds", load = 1),
  df_pregnancy_events = list(file = "db_reg_pregnancy_event.rds", load = 0),
  df_sOutcome         = list(file = "db_reg_seriousness_outcome.rds", load = 1),
  df_causality        = list(file = "db_reg_causality.rds", load = 0),
  df_hist_medical     = list(file = "db_reg_medical_history.rds", load = 0),
  df_hist_medicine    = list(file = "db_reg_medicines_history.rds", load = 0),
  df_vaccination      = list(file = "db_reg_vaccination.rds", load = 0)
)

# 2.2 Carga de datos ----

for (name in names(files)) {
  if (files[[name]]$load == 1) {
    assign(name, setDT(readRDS(paste0(root_source, files[[name]]$file))))
  }
}

# 2.3 Selección de datos ----

# ~ Pacientes ----

if (exists("df_patients")) {
  vars_patients <- c(
    "id" = 1,
    "sexo" = 1,
    "fechanac" = 1,
    "personid" = 0,
    "pgeosucn" = 0,
    "pgeosubn" = 0,
    "etnia" = 1
  )
  selected_vars <- names(vars_patients)[vars_patients == 1]
  df_patients <- df_patients[, ..selected_vars]
  df_patients <- unique(df_patients, by = setdiff(names(df_patients), "id"))
  setnames(df_patients, "id", "patient_id")
  rm(vars_patients)
}

# ~ Reportes ----

if (exists("df_reports")) {
  vars_reports <- c(
    "id" = 1,
    "patient_id" = 1,
    "caseid" = 1,
    "pais_iso" = 1,
    "edadinicreg" = 1,
    "unidadedad" = 1,
    "geonoti" = 1,
    "fechanot" = 1,
    "orgnoti" = 0,
    "profnoti" = 0,
    "fechacon" = 0,
    "fechabdr" = 0,
    "fechaact" = 0,
    "fechallen" = 0,
    "frecnac" = 0
  )
  selected_vars <- names(vars_reports)[vars_reports == 1]
  df_reports <- df_reports[, ..selected_vars]
  df_reports <- unique(df_reports, by = setdiff(names(df_reports), "id"))
  setnames(df_reports, "id", "report_id")
  rm(vars_reports)
}

# ~ Vacunas ----

if (exists("df_vaccines")) {
  vars_vaccines <- c(
    "id" = 1,
    "report_id" = 1,
    "nomfabri" = 1,
    "nomcomv" = 1,
    "numlote" = 1,
    "dosis" = 1, ## dosis 1, dosis 2, dosis única
    "fvacunac" = 1,
    "nomgenv" = 0,
    "nomnoclas" = 0,
    "codnomnorvac" = 0,
    "identvac" = 0,
    "codvacotro" = 0,
    "codfabwhodrug" = 0,
    "codestand" = 0,
    "hvacunac" = 0,
    "fvencimv" = 0,
    "nomdiluy" = 0,
    "numloted" = 0,
    "fvencdil" = 0,
    "frecdilu" = 0,
    "hrecdilu" = 0,
    "vac30ant" = 0,
    "cualvac" = 0
  )
  selected_vars <- names(vars_vaccines)[vars_vaccines == 1]
  df_vaccines <- df_vaccines[, ..selected_vars]
  df_vaccines <- unique(df_vaccines, by = setdiff(names(df_vaccines), "id"))
  setnames(df_vaccines, "id", "vaccine_id")
  # Convertir report_id a character para compatibilidad
  df_vaccines[, report_id := as.character(report_id)]
  rm(vars_vaccines)
}

# ~ Eventos ----

if (exists("df_events")) {
  vars_events <- c(
    "id" = 1,
    "report_id" = 1,
    "codmeddraesavip" = 1,
    "fecinesavi" = 1,
    "identesavi" = 0,
    "nomesavi" = 0,
    "hiniesav" = 0,
    "codcieesavi" = 0
  )
  selected_vars <- names(vars_events)[vars_events == 1]
  df_events <- df_events[, ..selected_vars]
  df_events <- unique(df_events, by = setdiff(names(df_events), "id"))
  setnames(df_events, "id", "event_id")
  # Convertir report_id a character para compatibilidad
  df_events[, report_id := as.character(report_id)]
  rm(vars_events)
}

# ~ Narrativa de eventos ----

if (exists("df_events_narrative")) {
  vars_events_narrative <- c(
    "id" = 0,
    "report_id" = 0,
    "desesavi" = 0,
    "comentar" = 0
  )
  selected_vars <- names(vars_events_narrative)[vars_events_narrative == 1]
  df_events_narrative <- df_events_narrative[, ..selected_vars]
  df_events_narrative <- unique(df_events_narrative, by = setdiff(names(df_events_narrative), "id"))
  setnames(df_events_narrative, "id", "avent_narrative_id")
  rm(vars_events_narrative)
}

# ~ Embarazos ----

if (exists("df_pregnancy")) {
  vars_pregnancy <- c(
    "id" = 1,
    "report_id" = 1,
    "embesavi" = 1,
    "embvac" = 0,
    "fum_esavi" = 0,
    "semanges" = 0,
    "fprobpart" = 0,
    "segemb" = 0
  )
  selected_vars <- names(vars_pregnancy)[vars_pregnancy == 1]
  df_pregnancy <- df_pregnancy[, ..selected_vars]
  df_pregnancy <- unique(df_pregnancy, by = setdiff(names(df_pregnancy), "id"))
  setnames(df_pregnancy, "id", "pregnancy_id")
  # Convertir report_id a character para compatibilidad
  df_pregnancy[, report_id := as.character(report_id)]
  rm(vars_pregnancy)
}

# ~ Embarazos eventos ----

if (exists("df_pregnancy_events")) {
  vars_pregnancy_events <- c(
    "id" = 0,
    "pregnancy_id" = 0,
    "compemb" = 0,
    "codtipcompesavi" = 0,
    "nomcompembesavi" = 0,
    "diagcompn" = 0,
    "codmedcompembesavi" = 0,
    "diagcompe" = 0,
    "investiga" = 0
  )
  selected_vars <- names(vars_pregnancy_events)[vars_pregnancy_events == 1]
  df_pregnancy_events <- df_pregnancy_events[, ..selected_vars]
  df_pregnancy_events <- unique(df_pregnancy_events, by = setdiff(names(df_pregnancy_events), "id"))
  setnames(df_pregnancy_events, "id", "pregnancy_events_id")
  rm(vars_pregnancy_events)
}

# ~ Seriedad del ESAVI ----

if (exists("df_sOutcome")) {
  vars_sOutcome <- c(
    "id" = 1,
    "report_id" = 1,
    "desenesv" = 1,
    "mueresav" = 1,
    "gravesav" = 1,
    "amenesav" = 0,
    "discesav" = 0,
    "hospesav" = 0,
    "anomesav" = 0,
    "aboresav" = 0,
    "mfetesav" = 0,
    "oevesavi" = 0,
    "fmuerte" = 0,
    "autopsia" = 0,
    "fecnotmue" = 0,
    "fecnotmuefet" = 0,
    "autofet" = 0
  )
  selected_vars <- names(vars_sOutcome)[vars_sOutcome == 1]
  df_sOutcome <- df_sOutcome[, ..selected_vars]
  df_sOutcome <- unique(df_sOutcome, by = setdiff(names(df_sOutcome), "id"))
  setnames(df_sOutcome, "id", "sOutcome_id")
  # Convertir report_id a character para compatibilidad
  df_sOutcome[, report_id := as.character(report_id)]
  rm(vars_sOutcome)
}

# ~ Causalidad ----

if (exists("df_causality")) {
  vars_causality <- c(
    "id" = 0,
    "report_id" = 0,
    "fcausal" = 0,
    "metodcausa" = 0,
    "otrometod" = 0,
    "descrcausa" = 0,
    "aeficausa" = 0,
    "umccausa" = 0,
    "narancausa" = 0,
    "refidentvac" = 0,
    "refidentesavi" = 0,
    "embduresavi" = 0
  )
  selected_vars <- names(vars_causality)[vars_causality == 1]
  df_causality <- df_causality[, ..selected_vars]
  df_causality <- unique(df_causality, by = setdiff(names(df_causality), "id"))
  setnames(df_causality, "id", "causality_id")
  rm(vars_causality)
}

# ~ Antecedentes médicos ----

if (exists("df_hist_medical")) {
  vars_hist_medical <- c(
    "id" = 0,
    "report_id" = 0,
    "antmedic" = 0,
    "antmedcie" = 0,
    "antmedra" = 0,
    "antsimi" = 0,
    "antreacv" = 0,
    "antreacm" = 0,
    "antmismv" = 0,
    "antcovid" = 0,
    "asintom" = 0,
    "finicsin" = 0,
    "confdiag" = 0,
    "expconfd" = 0,
    "fpruecon" = 0,
    "ensclinic" = 0
  )
  selected_vars <- names(vars_hist_medical)[vars_hist_medical == 1]
  df_hist_medical <- df_hist_medical[, ..selected_vars]
  df_hist_medical <- unique(df_hist_medical, by = setdiff(names(df_hist_medical), "id"))
  setnames(df_hist_medical, "id", "hist_medical_id")
  rm(vars_hist_medical)
}

# ~ Antecedentes farmacológicos ----

if (exists("df_hist_medicine")) {
  vars_hist_medicine <- c(
    "id" = 0,
    "report_id" = 0,
    "medicam" = 0,
    "codnomnormed" = 0,
    "cidforfarm" = 0,
    "present" = 0,
    "dosifica" = 0,
    "codviaadm" = 0,
    "viaadmin" = 0,
    "finicmed" = 0
  )
  selected_vars <- names(vars_hist_medicine)[vars_hist_medicine == 1]
  df_hist_medicine <- df_hist_medicine[, ..selected_vars]
  df_hist_medicine <- unique(df_hist_medicine, by = setdiff(names(df_hist_medicine), "id"))
  setnames(df_hist_medicine, "id", "hist_medicine_id")
  rm(vars_hist_medicine)
}

# ~ Vacunatorio ----

if (exists("df_vaccination")) {
  vars_vaccination <- c(
    "id" = 0,
    "report_id" = 0,
    "coddirvac" = 0,
    "instvacu" = 0,
    "dirvacun" = 0,
    "verifvac" = 0,
    "otromver" = 0
  )
  selected_vars <- names(vars_vaccination)[vars_vaccination == 1]
  df_vaccination <- df_vaccination[, ..selected_vars]
  df_vaccination <- unique(df_vaccination, by = setdiff(names(df_vaccination), "id"))
  setnames(df_vaccination, "id", "vaccination_id")
  rm(vars_vaccination)
}

# Liberar memoria
libera_memoria()


# 2.4 Dosis admin ----

df_dosis <- setDT(readRDS(paste0(root_source, "dosis_administradas.rds")))
df_dosis <- df_dosis[, c("fecha_sem_epi", "sem_epi", "sexo", "grupo_etario", "NumDosis")]

# Liberar memoria
libera_memoria()


# 2.5 SemEpi ----

df_sem_epi <- setDT(readRDS(paste0(root_source, "sem_epi.rds")))
df_sem_epi[, Fecha_Epi := as.IDate(Fecha_Epi)]
df_sem_epi[, Periodo_Epi := Vigencia * 100 + Mes]
df_sem_epi[, Sem_Epi := Vigencia * 100 + semEpiNoti]
df_sem_epi <- df_sem_epi[, c("Fecha_Epi", "Vigencia", "Periodo_Epi", "Sem_Epi")]

df_semEpiNoti <- df_sem_epi
df_semEpiVac <- df_sem_epi
df_semEpiIni <- df_sem_epi
names(df_semEpiNoti) <- c("Fecha_Epi", "añoNoti", "periodoNoti", "semEpiNoti")
names(df_semEpiVac) <- c("Fecha_Epi", "añoVac", "periodoVac", "semEpiVac")
names(df_semEpiIni) <- c("Fecha_Epi", "añoIni", "periodoIni", "semEpiIni")

rm(df_sem_epi)


# 2.6 MedDRA ----

list_meddra <- readRDS(paste0(root_source, "meddra.rds"))

df_hier <- as.data.table(list_meddra$df_medDra_mdhier)
df_llt <- list_meddra$df_medDra_llt
df_smq_list <- list_meddra$df_smq_list
df_smq_content <- list_meddra$df_smq_content

# Liberar memoria
libera_memoria(list_meddra)

# Crea df con Jerarquia Meddra a partir del llt
df_meddra <- merge(df_llt, df_hier, by = "pt_code", all.x = TRUE)
df_meddra <- df_meddra %>%
  rename(
    pt = pt_name,
    hlt = hlt_name,
    hlgt = hlgt_name,
    soc = soc_name
  ) %>%
  select(llt_code, pt, hlt, hlgt, soc) %>%
  unique()

# Liberar memoria
libera_memoria(df_llt, df_hier)

# Crea df de SMQs
df_smq <- merge(df_smq_content[, c("smq_code", "llt_code")], df_smq_list[, c("smq_code", "smq_name")], by = "smq_code", all.x = TRUE)
df_smq <- df_smq %>% rename(smq = smq_name)
df_smq <- df_smq[, c("llt_code", "smq")]

# Liberar memoria
libera_memoria(df_smq_content, df_smq_list)

# Unifica Jerarquia MedDRA con SMQs
df_meddra <- merge(df_meddra, df_smq, by = "llt_code", all.x = TRUE)
df_meddra$llt_code <- as.character(df_meddra$llt_code)

# Liberar memoria
libera_memoria(df_smq)


# -------------------------------------------------------------------------------------------------------------- -
# 3. Procesamiento de información ----
# -------------------------------------------------------------------------------------------------------------- -

# 3.1 Formato a fechas ----

df_patients[, fechanac := as.IDate(fechanac)]
df_reports[, fechanot := as.IDate(fechanot)]
df_vaccines[, fvacunac := as.IDate(fvacunac)]
df_events[, fecinesavi := as.IDate(fecinesavi)]

df_reports[, mesNoti := format(fechanot, "%b")]


# 3.2 Reportes ----

# Traer variables principales

temp_fvac <- df_vaccines[, .(fvacunac = min(fvacunac, na.rm = TRUE)), by = report_id]
temp_fini <- df_events[, .(fecinesavi = min(fecinesavi, na.rm = TRUE)), by = report_id]

df_reports <- merge(df_reports, temp_fvac, by = "report_id", all.x = TRUE)
df_reports <- merge(df_reports, temp_fini, by = "report_id", all.x = TRUE)
df_reports <- merge(df_reports, df_patients, by = "patient_id", all.x = TRUE)

# Liberar memoria
libera_memoria(df_patients, temp_fvac, temp_fini)


# ~ Cálculo de días Vac-Ini ----

df_reports[, dias_vac_ini := fifelse(
  is.na(fvacunac), 999999,
  fifelse(
    !is.na(fecinesavi), as.numeric(difftime(fecinesavi, fvacunac, units = "days")),
    fifelse(!is.na(fechanot), as.numeric(difftime(fechanot, fvacunac, units = "days")), 999999)
  )
)]

df_reports <- df_reports[, dias_vac_ini_cat := fifelse(
  dias_vac_ini == 999999, "Sin Info",
  fifelse(
    dias_vac_ini < -365 | dias_vac_ini > 365, "Fechas Inconsistentes",
    fifelse(
      dias_vac_ini < 0, "Síntomas antes de vacuna",
      fifelse(
        dias_vac_ini < 8, fifelse(dias_vac_ini == 1, paste0(dias_vac_ini, " día"), paste0(dias_vac_ini, " días")),
        fifelse(
          dias_vac_ini < 16, "8-15 días",
          fifelse(
            dias_vac_ini < 31, "16-30 días",
            fifelse(
              dias_vac_ini < 61, "31-60 días",
              fifelse(dias_vac_ini < 366, "60 días a 1 año", "Otro")
            )
          )
        )
      )
    )
  )
)]
df_reports <- df_reports[, dias_vac_ini_cat := factor(dias_vac_ini_cat)]


# ~ Cálculo edad años ----

df_reports[, edad := fifelse(
  unidadedad == 1, edadinicreg,
  fifelse(
    unidadedad == 2, round(edadinicreg / 12, 2),
    fifelse(unidadedad == 3, round(edadinicreg / 365.25, 2), NA_real_)
  )
)]

df_reports[, edad := fifelse(
  !is.na(edad), edad,
  fifelse(
    !is.na(fechanac) & !is.na(fechanot),
    as.numeric(difftime(fechanot, fechanac, units = "days") / 365.25),
    NA_real_
  )
)]

# ~ Cálculo Grupo etario ----

df_reports[, grupo_etario := fifelse(
  edad < 0, "Sin info",
  fifelse(
    edad < 18, "<18 años",
    fifelse(
      edad < 25, "18-24 años",
      fifelse(
        edad < 50, "25-49 años",
        fifelse(
          edad < 60, "50-59 años",
          fifelse(
            edad < 70, "60-69 años",
            fifelse(
              edad < 80, "70-79 años",
              fifelse(edad < 125, ">80 años", "Sin info")
            )
          )
        )
      )
    )
  )
)]
df_reports[, grupo_etario := fifelse(is.na(grupo_etario), "Sin info", grupo_etario)]

# ~ Cálculo GE y marca menores ----

df_reports[, marca_menores := fifelse(edad < 18, "Sí", "No")]
df_reports[, grupo_etario_menores := fifelse(
  edad < 0, "Sin info",
  fifelse(
    edad < 1, "[0-1) años",
    fifelse(
      edad < 5, "[1-5) años",
      fifelse(
        edad < 10, "[5-10) años",
        fifelse(
          edad < 15, "[10-15) años",
          fifelse(edad < 18, "[15-18) años", "No aplica")
        )
      )
    )
  )
)]
df_reports[, grupo_etario_menores := fifelse(is.na(grupo_etario_menores), "Sin info", grupo_etario_menores)]

# ~ Cálculo Sexo ----

# Manejar tanto valores numéricos (1, 2, 3) como texto ("Hombre", "Mujer")
df_reports[, sexo := fifelse(
  is.na(sexo), "Sin info",
  fifelse(
    sexo == 1 | sexo == "Hombre", "Masculino",
    fifelse(
      sexo == 2 | sexo == "Mujer", "Femenino",
      fifelse(
        sexo == 3 | sexo == "Otro", "Otro",
        "Sin info"
      )
    )
  )
)]
df_reports[, sexo := fifelse(is.na(sexo), "Sin info", sexo)]

# ~ Cálculo Marca Grave ----

temp_grave <- unique(df_sOutcome[, c("report_id", "gravesav")])
temp_grave <- temp_grave[, gravesav := fifelse(gravesav == 0 | gravesav == 1, gravesav, NA_real_)]
temp_grave <- temp_grave[, .(marca_grave = if (all(is.na(gravesav))) NA_real_ else sum(gravesav, na.rm = TRUE)), by = report_id]

df_reports <- merge(df_reports, temp_grave, by = "report_id", all.x = TRUE)
df_reports <- df_reports[, marca_grave := fifelse(
  marca_grave == 1, "Grave",
  fifelse(marca_grave == 0, "No grave", "Sin info")
)]
df_reports <- df_reports[, marca_grave := fifelse(is.na(marca_grave), "Sin info", marca_grave)]

# ~ Cálculo Marca Muerte ----

temp_outcome <- unique(df_sOutcome[, c("report_id", "mueresav")])
temp_outcome <- temp_outcome[, mueresav := fifelse(mueresav == 0 | mueresav == 1, mueresav, NA_real_)]
temp_outcome <- temp_outcome[, .(marca_muerte = if (all(is.na(mueresav))) NA_real_ else sum(mueresav, na.rm = TRUE)), by = report_id]

df_reports <- merge(df_reports, temp_outcome, by = "report_id", all.x = TRUE)
df_reports <- df_reports[, marca_muerte := fifelse(
  marca_muerte == 1, "Sí",
  fifelse(marca_muerte == 0, "No", "Sin info")
)]
df_reports <- df_reports[, marca_muerte := fifelse(is.na(marca_muerte), "Sin info", marca_muerte)]

# ~ Cálculo Marca Embarazo ----

temp_embarazo <- unique(df_pregnancy[, c("report_id", "embesavi")])
temp_embarazo <- temp_embarazo[, embesavi := fifelse(embesavi %in% c(1, 2, 3, 4), embesavi, NA_real_)]
# Averiguar si esta relacion si es 1 a muchos para saber que escoger en la operacion
temp_embarazo <- temp_embarazo[, .(marca_embarazo = if (all(is.na(embesavi))) NA_real_ else min(embesavi, na.rm = TRUE)), by = report_id]

df_reports <- merge(df_reports, temp_embarazo, by = "report_id", all.x = TRUE)
df_reports <- df_reports[, marca_embarazo := fifelse(
  marca_embarazo == 1, "Sí",
  fifelse(
    marca_embarazo == 2, "No",
    fifelse(
      marca_embarazo == 3, "Desconocido",
      fifelse(marca_embarazo == 4, "No aplica", "Sin info")
    )
  )
)]
df_reports <- df_reports[, marca_embarazo := fifelse(is.na(marca_embarazo), "Sin info", marca_embarazo)]

# ~ Cálculo Desenlace ----

temp_muerte <- unique(df_sOutcome[, c("report_id", "desenesv")])
temp_muerte <- temp_muerte[, desenesv := fifelse(desenesv %in% c(0, 1, 2, 3, 4, 5), desenesv, NA_real_)]
temp_muerte <- temp_muerte[, .(desenesv = if (all(is.na(desenesv))) NA_real_ else min(desenesv, na.rm = TRUE)), by = report_id]

df_reports <- merge(df_reports, temp_muerte, by = "report_id", all.x = TRUE)
df_reports <- df_reports[, desenesv := fifelse(
  desenesv == 0, "Desconocido",
  fifelse(
    desenesv == 1, "Recuperado completamente",
    fifelse(
      desenesv == 2, "En recuperación",
      fifelse(
        desenesv == 3, "No recuperado",
        fifelse(
          desenesv == 4, "Recuperado consecuelas",
          fifelse(desenesv == 5, "Muerte", "Sin info")
        )
      )
    )
  )
)]
df_reports <- df_reports[, desenesv := fifelse(is.na(desenesv), "Sin info", desenesv)]

# Liberar memoria
libera_memoria(temp_grave, temp_muerte, temp_embarazo, temp_outcome)


# 3.1 Vacunas ----

df_vaccines[, nomcomv := tools::toTitleCase(tolower(iconv(nomcomv, from = "UTF-8", to = "ASCII//TRANSLIT")))]
df_vaccines[, nomcomv := fifelse(is.na(nomcomv), "Sin info", nomcomv)]
df_vaccines[, numlote := toupper(toupper(iconv(numlote, from = "UTF-8", to = "ASCII//TRANSLIT")))]


# 3.2 Eventos ----

df_events$codmeddraesavip <- as.character(df_events$codmeddraesavip)

df_events <- merge(df_events, df_meddra, by.x = "codmeddraesavip", by.y = "llt_code", all.x = TRUE, allow.cartesian = TRUE)
df_events <- df_events[, id_event_smq := .I]
df_events[, pt := fifelse(is.na(pt), "Sin PT asociado", pt)]
df_events[, hlt := fifelse(is.na(hlt), "Sin HLT asociado", hlt)]
df_events[, hlgt := fifelse(is.na(hlgt), "Sin HLGT asociado", hlgt)]
df_events[, soc := fifelse(is.na(soc), "Sin SOC asociado", soc)]
df_events[, smq := fifelse(is.na(smq), "Sin SMQ asociado", smq)]


# 3.3 Geo Notificación ----

geo <- readRDS(paste0(root_target, "geo_datos.rds"))

geo_pais <- setDT(geo$geo_data_pais)
geo_pais <- geo_pais[, c("ISO_3DIGIT", "NAME")]
names(geo_pais) <- c("geo_cod_pais", "geo_pais")

df_reports <- merge(df_reports, geo_pais, by.x = "pais_iso", by.y = "geo_cod_pais", all.x = TRUE)
df_reports[, geonoti := tools::toTitleCase(tolower(iconv(geonoti, from = "UTF-8", to = "ASCII//TRANSLIT")))]


# 3.4 Semana Epidemiológica ----

df_reports <- merge(df_reports, df_semEpiNoti, by.x = "fechanot", by.y = "Fecha_Epi", all.x = TRUE)
df_reports[, añoNoti := fifelse(!is.na(fechanot) & is.na(añoNoti), year(fechanot), añoNoti)]

df_reports <- merge(df_reports, df_semEpiVac, by.x = "fvacunac", by.y = "Fecha_Epi", all.x = TRUE)
df_reports[, añoVac := fifelse(!is.na(fvacunac) & is.na(añoVac), year(fvacunac), añoVac)]

df_reports <- merge(df_reports, df_semEpiIni, by.x = "fecinesavi", by.y = "Fecha_Epi", all.x = TRUE)
df_reports[, añoIni := fifelse(!is.na(fecinesavi) & is.na(añoIni), year(fecinesavi), añoIni)]


# 3.5 Dosis administradas ----

df_dosis[, fecha_sem_epi := as.IDate(fecha_sem_epi)]
df_dosis <- df_dosis[fecha_sem_epi >= min(df_reports$fechanot, na.rm = TRUE) & fecha_sem_epi <= max(df_reports$fechanot, na.rm = TRUE), ]
df_dosis <- df_dosis[, `:=`(
  añoNoti = as.numeric(year(fecha_sem_epi)),
  mesNoti = format(fecha_sem_epi, "%b"),
  periodoNoti = year(fecha_sem_epi) * 100 + month(fecha_sem_epi)
)]
df_dosis <- df_dosis[, sexo := ifelse(sexo == "Hombre", "Masculino", ifelse(sexo == "Mujer", "Femenino", "No epecificado"))]
names(df_dosis) <- c("fecha_sem_epi", "semEpiNoti", "sexo", "grupo_etario", "NumDosis", "añoNoti", "mesNoti", "periodoNoti")


# Liberar memoria
libera_memoria(df_semEpiNoti, df_meddra)


# 3.6 Exportar Dosis Amin ----

saveRDS(df_dosis, paste0(root_target, "dosis_admin.rds"))


# Liberar memoria
libera_memoria(df_dosis)



# -------------------------------------------------------------------------------------------------------------- -
# 4. Cruce de información ----
# -------------------------------------------------------------------------------------------------------------- -

# 4.1 Selección de variables ----

vars_report <- c(
  "report_id", "caseid", "fechanot", "añoNoti", "mesNoti", "periodoNoti", "semEpiNoti", "edad", "grupo_etario", "grupo_etario_menores", "sexo", "geo_pais", "pais_iso", "geonoti",
  "desenesv", "marca_grave", "marca_menores", "marca_embarazo", "marca_muerte", "fvacunac", "fecinesavi", "dias_vac_ini_cat", "dias_vac_ini"
)
vars_event <- c("id_event_smq", "event_id", "pt", "hlt", "hlgt", "soc", "smq")
vars_vaccine <- c("vaccine_id", "nomcomv", "nomfabri", "dosis", "numlote")

# Liberar memoria
libera_memoria()


# 4.2 Cruce total de identificadores ----

df_unificado <- df_reports[, c("report_id")]
df_unificado <- merge(df_unificado, df_events[, .(report_id, id_event_smq)], by = "report_id", all.x = TRUE, allow.cartesian = TRUE)
df_unificado <- merge(df_unificado, df_vaccines[, .(report_id, vaccine_id)], by = "report_id", all.x = TRUE, allow.cartesian = TRUE)


# 4.3 Creación del df de datos procesados ----

df_final <- merge(df_unificado, df_reports[, ..vars_report], by = "report_id", all.x = TRUE)
df_final <- merge(df_final, df_vaccines[, ..vars_vaccine], by = "vaccine_id", all.x = TRUE)
df_final <- merge(df_final, df_events[, ..vars_event], by = "id_event_smq", all.x = TRUE, allow.cartesian = TRUE)

df_final <- unique(df_final)

# Añadir alias de columnas para compatibilidad con el código del servidor
df_final[, numeroNotificacao := caseid]
df_final[, dataNotificacao := fechanot]
df_final[, id_vaccine := vaccine_id]
df_final[, doseImunobiologico := dosis]


# 4.4 Exportar datos procesados ----

saveRDS(df_final, paste0(root_target, "datos_procesados.rds"))

# libera_memoria(df_final, df_unificado,
#                df_reports, df_events, df_vaccines, df_ant_medic,
#                df_ant_farma, df_atentions, df_add_exams, df_diagnosis, df_encerrmts)



# -------------------------------------------------------------------------------------------------------------- -
# 7. FIN DEL CODIGO ----
# -------------------------------------------------------------------------------------------------------------- -
