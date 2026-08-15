import { createTheme } from "@mui/material/styles"
import { defaultTheme } from "react-admin"

/**
 * Sistema de diseño homologado con la plataforma de referencia
 * (https://medplusdemo.kuyacode.com/app.html).
 *
 * Los valores no son una interpretación: se leyeron del CSS en línea de esa aplicación y se
 * trasladan aquí uno a uno. Se recogen como constantes con nombre —y no repartidos por los
 * `styleOverrides`— porque las pantallas también los necesitan en props de MUI (`sx`, `p`,
 * `gap`), y porque tener el catálogo en un solo sitio es lo que permite volver a homologar
 * el día que la referencia cambie: se editan estas constantes y no 40 archivos.
 */

/**
 * Paleta cruda de la referencia.
 *
 * Los grises son cinco, no uno con transparencias: la referencia distingue el borde de una
 * tarjeta (`bordeTarjeta`) del borde de un control (`bordeControl`) y del separador entre
 * filas de una tabla (`separadorFila`), y esa diferencia de medio tono es buena parte de lo
 * que hace que sus tablas se lean sin pesar. Con `alpha(negro, x)` no se reproduce.
 */
export const PALETA = {
  /** Azul de acción. Botones primarios, iconos activos, enlaces. */
  primario: "#1b66d6",
  /** Azul oscuro: texto sobre fondo azul claro y estados presionados. */
  primarioOscuro: "#1551ad",
  /** Azul muy oscuro, para texto sobre `primarioSuave` cuando hace falta más contraste. */
  primarioTexto: "#13408a",
  /** Azul de relleno del elemento de menú activo y de los chips informativos. */
  primarioSuave: "#eaf2fe",

  verde: "#1f9d6b",
  verdeTexto: "#0f7a4f",
  verdeSuave: "#e6f6ef",

  ambar: "#c98a00",
  ambarTexto: "#9a6a00",
  ambarSuave: "#fdf3df",

  rojo: "#c23934",
  rojoSuave: "#fcebea",

  morado: "#5b3fc4",
  moradoSuave: "#efeafc",

  /** Fondo de la aplicación. Todo lo que no es tarjeta va sobre este gris azulado. */
  fondo: "#eef2f7",
  /** Fondo de tarjetas, barra superior y menú lateral. */
  papel: "#ffffff",
  /** Fondo de campos de búsqueda y celdas en reposo. */
  fondoSutil: "#f6f8fb",

  /** Texto principal. */
  texto: "#16202e",
  /** Texto secundario: etiquetas de campo, valores de apoyo. */
  textoSecundario: "#5a6b80",
  /** Texto terciario: subtítulos bajo un título, unidades. */
  textoTerciario: "#8a98ab",
  /** Texto tenue: cabeceras de tabla, marcas de sección del menú, placeholders. */
  textoTenue: "#9aa7b8",

  /** Borde de tarjetas y paneles. */
  bordeTarjeta: "#e7edf4",
  /** Borde de la barra superior y del menú lateral; también de botones secundarios. */
  bordeChrome: "#e2e8f1",
  /** Borde de campos de formulario. Medio tono más oscuro que el de tarjeta. */
  bordeControl: "#d8e0ec",
  /** Separador bajo la cabecera de una tabla. */
  separadorCabecera: "#eef2f7",
  /** Separador entre filas. Deliberadamente más claro que el de la cabecera. */
  separadorFila: "#f3f6fa",
} as const

/**
 * Fondos y textos de los distintivos de estado.
 *
 * La referencia nunca pinta un estado con el color pleno sobre blanco: usa un fondo lavado y
 * un texto oscuro de la misma familia. Se exporta para que las pantallas que arman chips a
 * mano usen la misma pareja en vez de inventar una.
 */
export const TONOS = {
  verde: { background: PALETA.verdeSuave, color: PALETA.verdeTexto },
  ambar: { background: PALETA.ambarSuave, color: PALETA.ambarTexto },
  rojo: { background: PALETA.rojoSuave, color: PALETA.rojo },
  azul: { background: PALETA.primarioSuave, color: PALETA.primarioOscuro },
  gris: { background: PALETA.fondo, color: PALETA.textoSecundario },
  morado: { background: PALETA.moradoSuave, color: PALETA.morado },
} as const

/** Sombras de la referencia. Son tres, y ninguna es la escala de elevación de MUI. */
export const SOMBRAS = {
  /** Tarjetas y paneles en reposo. Apenas se ve: separa del fondo sin levantar. */
  tarjeta: "0 1px 3px rgba(16, 32, 46, 0.05)",
  /** Menús desplegables y popovers. */
  flotante: "0 6px 22px rgba(16, 32, 46, 0.09)",
  /** Diálogos modales. */
  modal: "0 20px 60px rgba(16, 32, 46, 0.3)",
  /** Botón primario: el azul proyecta su propio color, no un gris. */
  botonPrimario: "0 2px 7px rgba(27, 102, 214, 0.3)",
} as const

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
  /**
   * Radio de las tarjetas que enmarcan tablas y paneles.
   *
   * Va en píxeles y no en múltiplos de `shape.borderRadius` porque el valor de la
   * referencia (13) no es múltiplo del radio base (10): expresarlo como factor obligaría a
   * un 1.3 que no dice nada al leerlo.
   */
  radioTarjeta: "13px",
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

/**
 * Radio de botones y campos, en px.
 *
 * Antes era 20 —forma de píldora—, que era la homologación anterior del proyecto. La
 * referencia usa rectángulos de esquina blanda: 10px en botones y campos, y reserva la
 * píldora para los distintivos de estado, que sí van a 999px (ver `MuiChip`).
 */
const RADIO_CONTROL = 10

/** Familia tipográfica de la referencia. El respaldo cubre el arranque antes de que cargue. */
const FUENTE = "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', sans-serif"

/** Monoespaciada de la referencia: códigos, importes, horas. */
export const FUENTE_MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace"

export const theme = createTheme(defaultTheme, {
  // ─── Paleta ───────────────────────────────────────────────────────────────
  /**
   * El tema por defecto de react-admin trae el azul de Material. La referencia usa un azul
   * más saturado y frío, y —lo que más cambia la lectura de la pantalla— un fondo gris
   * azulado en vez de blanco: las tarjetas se recortan contra él sin necesitar sombra.
   */
  palette: {
    mode: "light",
    primary: {
      main: PALETA.primario,
      dark: PALETA.primarioOscuro,
      light: PALETA.primarioSuave,
      contrastText: "#fff",
    },
    secondary: { main: PALETA.morado, light: PALETA.moradoSuave, contrastText: "#fff" },
    success: { main: PALETA.verde, dark: PALETA.verdeTexto, light: PALETA.verdeSuave },
    warning: { main: PALETA.ambar, dark: PALETA.ambarTexto, light: PALETA.ambarSuave },
    error: { main: PALETA.rojo, light: PALETA.rojoSuave },
    info: { main: PALETA.primario, dark: PALETA.primarioOscuro, light: PALETA.primarioSuave },
    background: { default: PALETA.fondo, paper: PALETA.papel },
    text: {
      primary: PALETA.texto,
      secondary: PALETA.textoSecundario,
      disabled: PALETA.textoTenue,
    },
    divider: PALETA.bordeTarjeta,
  },

  /*
   * `shape.borderRadius` se queda en el 4 de MUI a propósito, aunque el radio de la
   * referencia sea 10.
   *
   * Es la unidad que multiplica a cualquier `sx={{ borderRadius: n }}`, y hay una docena
   * repartidos por las pantallas. Subirlo a 10 no cambiaba «el radio por defecto»:
   * reescalaba todos esos valores de golpe —un `borderRadius: 5` pasaba de 20px a 50px— y
   * convertía botones y recuadros en cápsulas.
   *
   * El radio de la referencia va donde corresponde: en píxeles explícitos dentro de cada
   * componente (`MuiButton`, `MuiOutlinedInput`, `MuiCard`…), que no dependen de esto.
   */
  shape: { borderRadius: 4 },

  // ─── Tipografía ───────────────────────────────────────────────────────────
  /**
   * La referencia es densa a propósito: su cuerpo de texto es 13.5px, no los 16 de MUI, y
   * los títulos aprietan el interletrado (-0.02em) en vez de engordar. Se traslada tal cual
   * porque es lo que permite que una tabla de ocho columnas quepa sin scroll horizontal.
   *
   * Los pesos son 500 y 600; el 700 de MUI no aparece en ninguna parte de la referencia.
   */
  typography: {
    fontFamily: FUENTE,
    fontSize: 13.5,
    fontWeightMedium: 500,
    fontWeightBold: 600,
    h1: { fontSize: "30px", fontWeight: 600, letterSpacing: "-0.02em" },
    h2: { fontSize: "24px", fontWeight: 600, letterSpacing: "-0.02em" },
    h3: { fontSize: "20px", fontWeight: 600, letterSpacing: "-0.02em" },
    h4: { fontSize: "18px", fontWeight: 600, letterSpacing: "-0.015em" },
    h5: { fontSize: "16px", fontWeight: 600, letterSpacing: "-0.01em" },
    h6: { fontSize: "14.5px", fontWeight: 600, letterSpacing: "-0.01em" },
    subtitle1: { fontSize: "14px", fontWeight: 600, letterSpacing: "-0.01em" },
    subtitle2: { fontSize: "13px", fontWeight: 600 },
    body1: { fontSize: "13.5px" },
    body2: { fontSize: "12.5px" },
    caption: { fontSize: "11.5px", color: PALETA.textoTerciario },
    button: { fontSize: "13.5px", fontWeight: 600, textTransform: "none" },
    overline: {
      fontSize: "11px",
      fontWeight: 600,
      letterSpacing: "0.07em",
      textTransform: "uppercase",
      color: PALETA.textoTenue,
    },
  },

  components: {
    // ─── Base ───────────────────────────────────────────────────────────────
    /**
     * La barra de scroll de la referencia es parte del acabado: delgada, con pulgar gris
     * azulado y un borde del color del fondo que la separa del contenido. Se declara aquí,
     * sobre `*`, y no en el layout, para que también la hereden los desplegables y los
     * contenedores internos de las tablas.
     */
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: PALETA.fondo,
          color: PALETA.texto,
          WebkitFontSmoothing: "antialiased",
        },
        "*::-webkit-scrollbar": { width: 11, height: 11 },
        "*::-webkit-scrollbar-track": { background: "transparent" },
        "*::-webkit-scrollbar-thumb": {
          background: "#cbd6e4",
          borderRadius: 7,
          border: `3px solid ${PALETA.fondo}`,
        },
        "*::-webkit-scrollbar-thumb:hover": { background: "#b4c2d6" },
      },
    },

    // ─── Chrome: barra superior y menú lateral ──────────────────────────────
    /**
     * La barra superior de la referencia es blanca con una línea inferior, no una banda de
     * color. Es el cambio más visible de toda la homologación: react-admin la pinta con el
     * color primario y texto blanco, y eso hacía que el azul de marca compitiera con el
     * azul de las acciones dentro de la página.
     */
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${PALETA.bordeChrome}`,
          boxShadow: "none",
          backgroundImage: "none",
        },
        /*
         * El fondo se declara en los dos slots de color, y no en `root`, porque MUI aplica
         * la variante de color *después* de `root`: un `backgroundColor` puesto arriba lo
         * pisaría el `colorSecondary`. Se cubren los dos que puede recibir esta barra —
         * `secondary` es el que react-admin pasa por defecto (ver AppBar.js), `inherit` es
         * el que le pasa CustomAppBar— para que el blanco se sostenga en cualquier caso.
         */
        colorInherit: { backgroundColor: PALETA.papel, color: PALETA.texto },
        colorSecondary: { backgroundColor: PALETA.papel, color: PALETA.texto },
      },
    },
    /** El lateral comparte el blanco de la barra y se separa con la misma línea de 1px. */
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: PALETA.papel,
          borderRight: `1px solid ${PALETA.bordeChrome}`,
          backgroundImage: "none",
        },
      },
    },
    /**
     * La barra lateral es una columna con dos piezas: el menú, que se lleva todo el alto
     * sobrante y scrollea si hace falta, y el pie, que no encoge y queda pegado al borde
     * inferior.
     *
     * `.RaSidebar-fixed` ya viene con `position: fixed` y un alto de `calc(100vh - 3em)`
     * de react-admin; lo único que le falta para eso es ser un contenedor flexible.
     */
    RaSidebar: {
      styleOverrides: {
        root: {
          backgroundColor: PALETA.papel,
          borderRight: `1px solid ${PALETA.bordeChrome}`,
          "& .RaSidebar-fixed": {
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 10,
            paddingBottom: 4,
            display: "flex",
            flexDirection: "column",
            // El scroll lo pone el menú, no este contenedor: si lo pusiera aquí, el pie
            // scrollearía con él y volvería a despegarse del borde.
            overflow: "hidden",
          },
        },
      },
    },
    /** `minHeight: 0` es lo que permite que el menú scrollee dentro de la columna. */
    RaMenu: {
      styleOverrides: {
        root: { flex: "1 1 auto", minHeight: 0, overflowY: "auto", overflowX: "hidden" },
      },
    },
    /**
     * Elemento de menú de la referencia: pastilla redondeada, y cuando está activo se rellena
     * de azul lavado, el texto pasa a azul oscuro y aparece una barra de 3px pegada al borde
     * izquierdo. Sin esa barra el estado activo se confunde con el hover.
     */
    RaMenuItemLink: {
      styleOverrides: {
        root: {
          position: "relative",
          margin: "2px 0",
          borderRadius: 8,
          minHeight: 40,
          color: PALETA.textoSecundario,
          fontWeight: 500,
          transition: "background .12s",
          "& .RaMenuItemLink-icon": { color: "inherit", minWidth: 34 },
          "&:hover": { backgroundColor: "#f0f5fc" },
          "&.RaMenuItemLink-active": {
            backgroundColor: PALETA.primarioSuave,
            color: PALETA.primarioOscuro,
            fontWeight: 600,
            "& .RaMenuItemLink-icon": { color: PALETA.primarioOscuro },
            // La barra viaja como pseudo-elemento para no tocar el marcado de react-admin.
            "&::before": {
              content: '""',
              position: "absolute",
              left: 0,
              top: 9,
              bottom: 9,
              width: 3,
              borderRadius: "0 3px 3px 0",
              backgroundColor: PALETA.primario,
            },
          },
        },
      },
    },

    // ─── Superficies ────────────────────────────────────────────────────────
    /**
     * `MuiPaper` sólo pierde el degradado de modo oscuro que MUI le pone.
     *
     * Deliberadamente no lleva aquí el borde ni el radio de tarjeta, aunque sería el sitio
     * obvio: AppBar, Drawer, Dialog y los desplegables son todos Paper, y varios se
     * renderizan con elevación 0, así que un `elevation0` con borde y 13px de radio les
     * redondeaba las esquinas a todos. La tarjeta se define en `MuiCard` (que es lo que usa
     * `<List>`) y en `PanelTabla`, que son los dos sitios donde de verdad hay tarjetas.
     */
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: `1px solid ${PALETA.bordeTarjeta}`,
          borderRadius: 13,
          boxShadow: SOMBRAS.tarjeta,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 13,
          border: `1px solid ${PALETA.bordeTarjeta}`,
          boxShadow: SOMBRAS.flotante,
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: { borderRadius: 13, boxShadow: SOMBRAS.flotante },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 16, border: "none", boxShadow: SOMBRAS.modal },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "#1f2a3b",
          fontSize: 11.5,
          fontWeight: 500,
          borderRadius: 7,
          padding: "6px 10px",
        },
      },
    },

    // ─── Entradas de formulario ─────────────────────────────────────────────
    /**
     * react-admin trae `variant: 'filled'` en su tema por defecto, y el relleno de MUI es
     * alto por diseño: ~56px por campo. Eso inflaba la fila de filtros y, con ella, toda la
     * banda de acciones. `outlined` + `small` la deja en ~40px, que es la altura que usa la
     * referencia en sus campos de banda (39px) y de formulario (46px).
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
      styleOverrides: {
        root: { fontSize: 12.5, fontWeight: 600, color: PALETA.textoSecundario },
      },
    },
    MuiOutlinedInput: {
      defaultProps: { notched: true },
      styleOverrides: {
        root: {
          // Fondo propio: los filtros viven sobre la banda tintada de la cabecera y sin esto
          // se confunden con ella. Varias pantallas ya lo hacían campo por campo.
          backgroundColor: PALETA.papel,
          borderRadius: RADIO_CONTROL,
          fontSize: 13.5,
          "& .MuiOutlinedInput-notchedOutline": { borderColor: PALETA.bordeControl },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#c3d0e2" },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderWidth: 1,
            borderColor: PALETA.primario,
          },
        },
      },
    },

    // ─── Botones ────────────────────────────────────────────────────────────
    /**
     * Se encontraron 72 botones sin criterio común: 40 `contained` contra 17 `outlined`,
     * cinco colores mezclados y 10 archivos repitiendo a mano el mismo
     * `{ borderRadius: 5, boxShadow: "none", "&:hover": { boxShadow: "none" } }`.
     *
     * No se fuerza `variant`: `outlined` sigue siendo válido para acciones secundarias.
     * Lo que se unifica es la forma, la densidad y —homologado con la referencia— el hecho
     * de que el primario sí lleve una sombra de su propio color, mientras el secundario va
     * plano con borde gris.
     */
    MuiButton: {
      defaultProps: { size: "small", disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: RADIO_CONTROL,
          paddingLeft: 15,
          paddingRight: 15,
          fontWeight: 600,
          textTransform: "none",
          boxShadow: "none",
          "&:hover": { boxShadow: "none" },
        },
        sizeSmall: { minHeight: 36 },
        sizeMedium: { minHeight: 40 },
        contained: {
          boxShadow: SOMBRAS.botonPrimario,
          "&:hover": { boxShadow: SOMBRAS.botonPrimario },
        },
        outlined: {
          borderColor: PALETA.bordeControl,
          color: "#2a3a4f",
          backgroundColor: PALETA.papel,
          "&:hover": { borderColor: PALETA.bordeControl, backgroundColor: PALETA.fondoSutil },
        },
      },
    },
    /** Los iconos de acción de la referencia son cuadrados de esquina blanda, no círculos. */
    MuiIconButton: {
      styleOverrides: {
        root: { borderRadius: RADIO_CONTROL, color: PALETA.textoSecundario },
      },
    },
    /**
     * Distintivos de estado. Aquí sí va la píldora (999px) y el cuerpo pequeño: son la
     * única forma redonda del sistema, y por eso se leen como estado y no como botón.
     */
    MuiChip: {
      defaultProps: { size: "small" },
      styleOverrides: {
        root: {
          borderRadius: 999,
          height: 22,
          fontSize: 11.5,
          fontWeight: 600,
        },
        label: { paddingLeft: 9, paddingRight: 9 },
      },
    },

    // ─── Tablas ─────────────────────────────────────────────────────────────
    /**
     * Unifica las dos familias que conviven en el proyecto: las 7 pantallas con
     * `<Datagrid>` de react-admin y las 9 que arman `<Table>` de MUI a mano.
     *
     * La cabecera de la referencia es texto tenue de 11px en versalitas; el peso visual lo
     * lleva el contenido, no el encabezado. Y los separadores son dos: la línea bajo la
     * cabecera es más oscura que la que separa las filas entre sí.
     */
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: PALETA.textoTenue,
          backgroundColor: PALETA.papel,
          borderBottom: `1px solid ${PALETA.separadorCabecera}`,
        },
        body: {
          fontSize: 13.5,
          color: PALETA.texto,
          borderBottom: `1px solid ${PALETA.separadorFila}`,
        },
        // Densidad: el default de MUI (16px) hacía filas muy altas en tablas de muchas
        // columnas. Se acompaña con `size="small"` por defecto más abajo.
        root: { paddingTop: 10, paddingBottom: 10 },
      },
    },
    MuiTable: {
      defaultProps: { size: "small" },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { "&:hover": { backgroundColor: PALETA.fondoSutil } },
      },
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
            borderRadius: 13,
            border: `1px solid ${PALETA.bordeTarjeta}`,
            boxShadow: SOMBRAS.tarjeta,
            overflow: "hidden",
          },
        },
      },
    },
    RaDatagrid: {
      styleOverrides: {
        root: {
          "& .RaDatagrid-headerCell": {
            backgroundColor: PALETA.papel,
            borderBottom: `1px solid ${PALETA.separadorCabecera}`,
          },
          "& .RaDatagrid-rowCell": { borderBottom: `1px solid ${PALETA.separadorFila}` },
        },
      },
    },
    /**
     * Fila de filtros: los campos se reparten el ancho disponible en lugar de llevar cada
     * uno el suyo fijo.
     *
     * El problema no era que envolvieran, sino por qué: cada `TextInput` de MUI arrastra
     * un ancho propio de ~200px, así que cuatro filtros pedían ~880px, no cabían en los
     * ~800 de la banda y el cuarto caía a una segunda fila —dejando además un hueco
     * muerto a la derecha del tercero—. Con `flex: 1 1 0` se reparten lo que haya y caben
     * en una línea sea cual sea el ancho de la ventana.
     *
     * El `flex` va sobre `.RaFilterForm-filterFormInput` y no sobre el `MuiFormControl`:
     * react-admin envuelve cada filtro en ese div, que es el verdadero hijo flexible del
     * formulario. Puesto sobre el control interno no hacía nada, que es por lo que el
     * primer intento no cambió nada en pantalla.
     *
     * Se conserva `wrap`: con `minWidth` los campos dejan de encoger llegado un punto, y
     * en un panel estrecho —dos catálogos lado a lado— es preferible que bajen de línea a
     * que se salgan del recuadro.
     */
    RaFilterForm: {
      styleOverrides: {
        root: {
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
          width: "100%",
          paddingTop: 0,
          marginBottom: 0,
          minHeight: "unset",
          "& .RaFilterForm-filterFormInput": { flex: "1 1 0", minWidth: 150 },
          // react-admin deja `margin: 'dense'` en todos sus inputs, pensado para apilarlos
          // en un formulario. En una fila de filtros ese margen es altura muerta que se
          // suma a la banda de acciones. Se anula sólo aquí, no en los formularios.
          //
          // Va con el selector completo (dos clases) porque react-admin fija su `marginTop`
          // con esa misma especificidad: escrito sólo como `& .MuiFormControl-root` pierde.
          "& .RaFilterForm-filterFormInput .MuiFormControl-root": {
            margin: 0,
            width: "100%",
            minWidth: 0,
          },
          // Separador de 16px que react-admin mete dentro de cada filtro. Sobra: la
          // separación ya la da el `gap` del formulario, y aquí sólo roba ancho al campo.
          "& .RaFilterFormInput-spacer": { display: "none" },
          "& .MuiFormHelperText-root": { display: "none" },
        },
      },
    },
  },
})
