import { createTheme } from "@mui/material/styles"
import { defaultTheme } from "react-admin"

/**
 * Tokens de layout compartidos.
 *
 * Existen como constantes exportadas —y no sólo dentro del tema— para que las páginas
 * puedan usarlos en props de MUI (`p`, `gap`) sin repetir números sueltos. Antes cada
 * pantalla elegía los suyos: se encontraron `p={2}`, `p={3}`, `p={1.5}` y `p={2} pb={4}`
 * envolviendo listas equivalentes, y cuatro combinaciones distintas de padding en la banda
 * de acciones.
 */
export const LAYOUT = {
  /** Padding del contenedor de página. Antes rondaba entre 1.5 y 3 según el archivo. */
  paddingPagina: 1.5,
  /** Padding horizontal y vertical de la banda de acciones sobre cada tabla. */
  paddingCabeceraX: 2,
  paddingCabeceraY: 1.25,
  /** Separación entre elementos de la banda de acciones. */
  gapCabecera: 1.5,
  /** Radio de las tarjetas que enmarcan tablas y paneles. */
  radioTarjeta: 2,
  /**
   * Tope de altura del área scrollable de una tabla o árbol dentro de un panel.
   *
   * Antes era un número fijo (460 o 480 px según el archivo): en una pantalla alta la
   * tarjeta se cortaba a media altura y dejaba un vacío enorme debajo, y en una baja
   * empujaba la paginación fuera de la vista.
   *
   * Al ser relativo al viewport, el contenido crece hasta llenar la pantalla sin pasarse.
   * Como es `maxHeight` y no `height`, una tabla con pocas filas sigue encogiendo.
   *
   * El descuento cubre: barra superior (64) + pie fijo (40) + padding de página (24) +
   * banda de acciones (~64) + paginación del panel (~76), más holgura.
   */
  alturaTabla: "calc(100vh - 300px)",
  /** Piso para que en pantallas bajas el área no se reduzca a una o dos filas. */
  alturaTablaMinima: 220,
} as const

/** Radio de los botones, en px. Equivale al `borderRadius: 5` que se repetía en 10 archivos. */
const RADIO_BOTON = 20

export const theme = createTheme(defaultTheme, {
  components: {
    // ─── Entradas de formulario ─────────────────────────────────────────────
    /**
     * react-admin trae `variant: 'filled'` en su tema por defecto, y el relleno de MUI es
     * alto por diseño: ~56px por campo. Eso inflaba la fila de filtros y, con ella, toda la
     * banda de acciones. `outlined` + `small` la deja en ~40px.
     *
     * Se aplica a MuiTextField y MuiFormControl porque react-admin fija el variante en
     * ambos: sin tocar los dos, los SelectInput seguirían rellenos junto a TextInput ya
     * delineados.
     */
    MuiTextField: {
      defaultProps: { variant: "outlined", size: "small" },
    },
    MuiFormControl: {
      defaultProps: { variant: "outlined", size: "small" },
    },
    /**
     * La etiqueta va siempre arriba (`shrink`) para que el placeholder se lea sin tener que
     * enfocar el campo, que es lo que necesita una fila de filtros.
     *
     * `notched` hay que declararlo aparte y no alcanza con `shrink`: TextField sólo abre el
     * hueco del borde cuando recibe `shrink` por `InputLabelProps`, y un default del tema
     * sobre MuiInputLabel no pasa por ese camino. Sin esto la etiqueta sube pero el borde
     * sigue cerrado, y el texto queda montado sobre la línea.
     */
    MuiInputLabel: {
      defaultProps: { shrink: true },
    },
    MuiOutlinedInput: {
      defaultProps: { notched: true },
      styleOverrides: {
        // Fondo propio: los filtros viven sobre la banda tintada de la cabecera y sin esto
        // se confunden con ella. Varias pantallas ya lo hacían campo por campo.
        root: { backgroundColor: "#fff" },
      },
    },

    // ─── Botones ────────────────────────────────────────────────────────────
    /**
     * Se encontraron 72 botones sin criterio común: 40 `contained` contra 17 `outlined`,
     * cinco colores mezclados y 10 archivos repitiendo a mano el mismo
     * `{ borderRadius: 5, boxShadow: "none", "&:hover": { boxShadow: "none" } }`.
     *
     * No se fuerza `variant`: `outlined` sigue siendo válido para acciones secundarias.
     * Lo que se unifica es la forma, la densidad y la ausencia de sombra.
     */
    MuiButton: {
      defaultProps: { size: "small", disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: RADIO_BOTON,
          paddingLeft: 16,
          paddingRight: 16,
          boxShadow: "none",
          "&:hover": { boxShadow: "none" },
        },
      },
    },

    // ─── Tablas ─────────────────────────────────────────────────────────────
    /**
     * Unifica las dos familias que conviven en el proyecto: las 7 pantallas con
     * `<Datagrid>` de react-admin y las 9 que arman `<Table>` de MUI a mano. El estilo de
     * encabezado estaba escrito a mano en ESAVIS y no existía en el resto.
     */
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          // `color` faltaba y era la diferencia visible: las tablas que escribían el estilo
          // a mano ponían el encabezado en gris, y las que no —WHODrug— lo dejaban en el
          // negro por defecto de MUI.
          color: "rgba(0, 0, 0, 0.6)",
          backgroundColor: "#fff",
        },
        // Densidad: el default de MUI (16px) hacía filas muy altas en tablas de muchas
        // columnas. Se acompaña con `size="small"` por defecto más abajo.
        root: { paddingTop: 8, paddingBottom: 8 },
      },
    },
    MuiTable: {
      defaultProps: { size: "small" },
    },

    // ─── Marco de las listas de react-admin ─────────────────────────────────
    /**
     * El borde redondeado sin sombra estaba duplicado como `listSx` en ESAVIS y syncs.
     * Llevarlo al tema hace que las 7 listas se vean igual sin copiar nada.
     */
    RaList: {
      styleOverrides: {
        root: {
          "& .RaList-content": {
            borderRadius: 8,
            border: "1px solid",
            borderColor: "rgba(0, 0, 0, 0.12)",
            boxShadow: "none",
            overflow: "hidden",
          },
        },
      },
    },
    RaDatagrid: {
      styleOverrides: {
        root: {
          "& .RaDatagrid-headerCell": {
            backgroundColor: "#fff",
          },
        },
      },
    },
    RaFilterForm: {
      styleOverrides: {
        root: {
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
          paddingTop: 0,
          marginBottom: 0,
          minHeight: "unset",
          // react-admin deja `margin: 'dense'` en todos sus inputs, pensado para apilarlos
          // en un formulario. En una fila de filtros ese margen es altura muerta que se
          // suma a la banda de acciones. Se anula sólo aquí, no en los formularios.
          "& .MuiFormControl-root": { margin: 0 },
          "& .MuiFormHelperText-root": { display: "none" },
        },
      },
    },
  },
})
