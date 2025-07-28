--****************************************************************************
--	CONSULTA REPORTES INTEGRA ESAVI - GACETA 
--****************************************************************************
-- 1 Dosis Inoculadas
select SUM(v."CANTIDAD") as dosis_inoculadas 
FROM dhi_esavi."TR_VACUNOMETRO" v;

-- 2 Dosis Inoculadas: por nombre de la vacuna
select Upper(v."NOMBREVACUNA") vacuna, SUM(v."CANTIDAD") as cantidad_dosis_inoculadas 
FROM dhi_esavi."TR_VACUNOMETRO" v
group by Upper(v."NOMBREVACUNA");

-- 3 Dosis Inoculadas: por número de dosis y nombre de la vacuna
select upper(v."NOMBREVACUNA") nombre_vacuna, v."NUMERODOSIS" numero_dosis, sum(v."CANTIDAD") total_vacunados
FROM dhi_esavi."TR_VACUNOMETRO" v
group by upper(v."NOMBREVACUNA") , v."NUMERODOSIS" 
order by 1, 2 

-- 4 Casos reportados de ESAVI
select COUNT(*) casos_reportados
from dhi_esavi."TR_PACIENTE" P inner join  
	 dhi_esavi."TR_NOTIFICACION" n on p."PACIENTE_ID" = n."PACIENTE_ID" inner join
	 dhi_esavi."TR_GRAVEDADESAVI" tg on tg."NOTIFICACION_ID" =  n."NOTIFICACION_ID";

--  5 Casos reportados de ESAVI Grave
select COUNT(*) grave 
from dhi_esavi."TR_PACIENTE" P inner join  
	 dhi_esavi."TR_NOTIFICACION" n on p."PACIENTE_ID" = n."PACIENTE_ID" inner join
	 dhi_esavi."TR_GRAVEDADESAVI" tg on tg."NOTIFICACION_ID" =  n."NOTIFICACION_ID"
where tg."TIPOGRAVEDAD" = 'GRAVE' 	 
group by tg."TIPOGRAVEDAD";

--  6 Casos reportados de ESAVI No Grave
select COUNT(*) no_grave
from dhi_esavi."TR_PACIENTE" P inner join  
	 dhi_esavi."TR_NOTIFICACION" n on p."PACIENTE_ID" = n."PACIENTE_ID" inner join
	 dhi_esavi."TR_GRAVEDADESAVI" tg on tg."NOTIFICACION_ID" =  n."NOTIFICACION_ID"
where tg."TIPOGRAVEDAD" = 'NO GRAVE' or tg."TIPOGRAVEDAD" is null
group by tg."TIPOGRAVEDAD";

--  7 Casos reportados de ESAVI Grave por SEXO
select COUNT(*) grave,   coalesce(c."DESCRIPCIONHOMOLOGADA", 'NO ESPECIFICA') sexo
from dhi_esavi."TR_PACIENTE" P inner join  
	 dhi_esavi."TR_NOTIFICACION" n on p."PACIENTE_ID" = n."PACIENTE_ID" left join
	 dhi_esavi."TR_GRAVEDADESAVI" tg on tg."NOTIFICACION_ID" =  n."NOTIFICACION_ID" left join 
	 dhi_esavi."TC_CATALOGO" c on p."CTSEXO_ID" = c."CATALOGO_ID" 
where tg."TIPOGRAVEDAD" = 'GRAVE' 	 
group by tg."TIPOGRAVEDAD", c."DESCRIPCIONHOMOLOGADA"; 

--  8 Casos reportados de ESAVI Grave por grupo poblacional
select ge."INICIO", coalesce (ge."DESCRIPCION", 'No registra la edad'), count(*) cantidad_registro
from dhi_esavi."TC_GRUPOETARIO" ge right join 
(
select 
    CASE WHEN n."FECHANACIMIENTO" IS NOT NULL AND n."FECHAREPORTENACIONAL" IS NOT NULL and n."EDAD"  is null 
    THEN EXTRACT(YEAR FROM AGE(n."FECHAREPORTENACIONAL", n."FECHANACIMIENTO")) 
    ELSE n."EDAD" end edad
--        n."FECHANACIMIENTO", n."FECHAREPORTENACIONAL", n."FECHANOTIFICACION", n."FECHALLENADOFICHA",  n."EDAD" -- COUNT(*) grave
from dhi_esavi."TR_PACIENTE" P inner join  
	 dhi_esavi."TR_NOTIFICACION" n on p."PACIENTE_ID" = n."PACIENTE_ID" inner join
	 dhi_esavi."TR_GRAVEDADESAVI" tg on tg."NOTIFICACION_ID" =  n."NOTIFICACION_ID"
where tg."TIPOGRAVEDAD" = 'GRAVE'
) egr on egr.edad between ge."INICIO" and ge."FIN" 
group by ge."INICIO", ge."DESCRIPCION" 
order by 1

--  9 Casos reportados de ESAVI Grave por análisis de causalidad
select tc."DESCRIPCIONHOMOLOGADA", count(*) causalidad
from dhi_esavi."TR_PACIENTE" P inner join  
		dhi_esavi."TR_NOTIFICACION" tn on p."PACIENTE_ID" = tn."PACIENTE_ID"  inner join  
  	 	dhi_esavi."TR_GRAVEDADESAVI" tg on tg."NOTIFICACION_ID" =  tn."NOTIFICACION_ID" inner join 
  	 	dhi_esavi."TR_DESENLACEESAVI" de on tn."NOTIFICACION_ID" = de."NOTIFICACION_ID" inner join 
  	 	dhi_esavi."TC_CATALOGO" tc on de."CAUSALIDADESAVI_ID" = tc."CATALOGO_ID" 
where tg."TIPOGRAVEDAD" = 'GRAVE'  	 	
group by tc."DESCRIPCIONHOMOLOGADA"

--  10 Casos reportados de ESAVI No Grave por signos y síntomas mayormente reportados
select llt."LLT_NAME",  COUNT(*) síntomas_mayormente_reportados
from dhi_esavi."TR_PACIENTE" P inner join  
		dhi_esavi."TR_NOTIFICACION" tn on p."PACIENTE_ID" = tn."PACIENTE_ID"  inner join 
		dhi_esavi."TR_DATOSESAVI" td on tn."NOTIFICACION_ID" = td."NOTIFICACION_ID" inner join 
  	 	dhi_esavi."TR_GRAVEDADESAVI" tg on tg."NOTIFICACION_ID" =  tn."NOTIFICACION_ID" 
        inner join dhi_esavi."1_LOW_LEVEL_TERM" llt on llt."LLT_CODE" = td."CTLLTMEDDRA_ID" 
        inner join dhi_esavi."1_SOC_TERM" soc on soc."SOC_CODE"  = td."CTSOCMEDDRA_ID" 
        inner join dhi_esavi."1_PREF_TERM" prt  on prt."PT_CODE"  = td."CTPTMEDDRA_ID" 
        inner join dhi_esavi."1_HLGT_PREF_TERM" hlgt ON hlgt."HLGT_CODE" = td."CTHLGTMEDDRA_ID" 
        inner join  dhi_esavi."1_HLT_PREF_TERM" hlt ON hlt."HLT_CODE"  = td."CTHLTMEDDRA_ID" 
where tg."TIPOGRAVEDAD" <> 'GRAVE' 	 
group by llt."LLT_NAME" 
order by 2 DESC, 1
LIMIT 10;

-- 11 Casos reportados de ESAVI Grave por provincia
select   TC."DESCRIPCIONHOMOLOGADA" provincia, count(*) esavis_graves_por_provincia
from dhi_esavi."TR_PACIENTE" P inner join  
		dhi_esavi."TR_NOTIFICACION" tn on p."PACIENTE_ID" = tn."PACIENTE_ID"  inner join  
  	 	dhi_esavi."TR_GRAVEDADESAVI" tg on tg."NOTIFICACION_ID" =  tn."NOTIFICACION_ID" inner join 
  	 	dhi_esavi."TC_CATALOGO" tc on tn."CTPROVINCIANOTIFICADOR_ID" = TC."CATALOGO_ID" 
where tg."TIPOGRAVEDAD" = 'GRAVE' 	 
group by TC."DESCRIPCIONHOMOLOGADA" 
order by 1
