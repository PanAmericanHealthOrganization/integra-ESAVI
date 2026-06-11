gaceta <- "SELECT
    *
FROM
    TG_GACETA tg
WHERE
    tg.ANIO = ? AND tg.MES = ?
ORDER BY
    tg.ANIO,
    tg.MES"
