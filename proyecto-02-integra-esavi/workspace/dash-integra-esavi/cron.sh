# Edita tu crontab con: crontab -e
# Esto ejecutará el script cada 4 horas, todos los días
# Edita tu crontab con: crontab -e
# Esto ejecutará el script R cada 4 horas, todos los días

# Usa la variable de entorno INTEGRA_ESAVI_R_GENERAR_RDS para la ruta del script R
INTEGRA_ESAVI_R_GENERAR_RDS="/Users/rolo1410/Documents/KUYA/2025_MSP/WORKSPACE/INTEGRA-ESAVI/dash-integra-esavi-regional/regional-dashboard/

0 */4 * * * Rscript $INTEGRA_ESAVI_R_GENERAR_RDS
