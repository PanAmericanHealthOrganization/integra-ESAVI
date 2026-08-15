import { GlobalStyles } from '@mui/material';
import { Layout, LayoutProps } from 'react-admin';
import { NotificacionesProvider } from '../components/notificaciones/NotificacionesProvider';
import { CustomMenu } from './CustomMenu';
import { CustomAppBar } from './CustomAppBar';

/*
 * Ancla la cadena html→body→#root→.RaLayout-root al 100% del viewport.
 * Solo .RaDatagrid-tableWrapper scrollea (las filas de la tabla).
 * Toolbar de acciones y paginación permanecen siempre visibles.
 *
 * El aviso de derechos ya no es una barra fija a lo ancho de la ventana: vive al pie del
 * menú lateral (ver CustomFooter). Por eso el layout vuelve a ocupar el 100% del alto y
 * ninguna medida descuenta ya esos 40px.
 */
const globalLayoutFix = `
  html, body, #root {
    height: 100%;
    overflow: hidden;
  }

  .RaLayout-root {
    height: 100% !important;
    min-height: unset !important;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  /* Contenedor vertical: AppBar + contentWithSidebar */
  .RaLayout-appFrame {
    flex: 1 1 0 !important;
    min-height: 0 !important;
    overflow: hidden;
    display: flex !important;
  }

  /*
   * <main> horizontal: sidebar + content. React-admin no le da min-height:0,
   * así que por el comportamiento por defecto de flexbox (min-height:auto en
   * un flex item) crecía hasta la altura natural de su contenido en vez de
   * quedar acotado al espacio disponible — esa era la fuga real que dejaba
   * pasar el desborde hasta el footer, sin que el fix en .RaLayout-root o
   * .RaLayout-content (un nivel más abajo) lo pudiera evitar.
   */
  .RaLayout-contentWithSidebar {
    flex: 1 1 0 !important;
    min-height: 0 !important;
    overflow: hidden !important;
  }

  /* Área de contenido: scrollable como fallback */
  .RaLayout-content {
    flex: 1 1 0 !important;
    min-height: 0 !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }

  .RaLayout-content::-webkit-scrollbar {
    display: none !important;
  }

  /*
   * Contenido centrado y con ancho máximo, homologado con la plataforma de referencia
   * (su <main> es full-width y dentro lleva un contenedor de 1320px con margin auto).
   *
   * Va aquí y no en cada página por dos razones: son quince pantallas, y ninguna tenía
   * criterio propio —todas abrían con un <Box p={paddingPagina}> a sangre completa—, así
   * que en un monitor ancho una tabla de cuatro columnas se estiraba de borde a borde y
   * las filas se volvían ilegibles de tan largas.
   *
   * El selector apunta a los hijos directos, no a .RaLayout-content: el contenedor sigue
   * ocupando todo el ancho para que la barra de scroll quede pegada al borde de la
   * ventana, como en la referencia, y sea el contenido el que se centra dentro.
   */
  .RaLayout-content > * {
    width: 100%;
    max-width: 1320px;
    margin-left: auto !important;
    margin-right: auto !important;
  }

  /* Encabezados de columna pegajosos al scrollear las filas */
  .RaDatagrid-tableWrapper thead th {
    position: sticky !important;
    top: 0 !important;
    z-index: 2 !important;
  }

  /*
   * El contenedor de filas scrollea internamente; la altura deja espacio para
   * AppBar + banda de acciones + paginación. El presupuesto asumía un toolbar
   * de una sola fila (~48px); en listas como ESAVIS, cuyo encabezado tiene
   * título + varios filtros + botón, esa fila es más alta y la caja de la
   * tabla terminaba reclamando más espacio del que quedaba libre, empujando
   * la paginación fuera de la pantalla. Se deja margen de sobra para no
   * depender de medir cada encabezado por página.
   *
   * Baja de 340 a 300 porque ya no hay barra fija de 40px al pie que descontar.
   */
  .RaDatagrid-tableWrapper {
    max-height: calc(100vh - 300px) !important;
    overflow-y: auto !important;
    scrollbar-gutter: stable !important;
  }

  /* Barra de scroll visible y delgada (antes iba oculta: sin esta barra no
     había forma de saber, a simple vista, que había más filas debajo) */
  .RaDatagrid-tableWrapper::-webkit-scrollbar {
    width: 10px;
  }

  .RaDatagrid-tableWrapper::-webkit-scrollbar-track {
    background: transparent;
  }

  /* Pulgar gris azulado de la plataforma de referencia, en vez de un negro translúcido:
     sobre el gris del fondo, el negro se veía como una mancha. */
  .RaDatagrid-tableWrapper::-webkit-scrollbar-thumb {
    background-color: #cbd6e4;
    border-radius: 7px;
    border: 2px solid transparent;
    background-clip: content-box;
  }

  .RaDatagrid-tableWrapper::-webkit-scrollbar-thumb:hover {
    background-color: #b4c2d6;
  }

  /* Marca de agua: escudo del Ecuador fijo en la esquina inferior derecha,
     sobre el contenido pero sin interceptar clics */
  .RaLayout-content::after {
    content: '';
    position: fixed;
    right: clamp(12px, 2vw, 24px);
    bottom: 16px;
    width: clamp(110px, 28vw, 243px);
    aspect-ratio: 1000 / 1200;
    background: url('/logos/escudo_ecuador.png') no-repeat center / contain;
    opacity: 0.08;
    pointer-events: none;
    z-index: 1000;
  }
`;

/*
 * El provider de notificaciones envuelve todo el layout: la campana vive en la AppBar,
 * pero el buzón tiene que seguir recibiendo por WebSocket mientras el usuario navega,
 * sin reconectar en cada cambio de pantalla.
 */
export const CustomLayout = (props: LayoutProps) => (
  <NotificacionesProvider>
    <GlobalStyles styles={globalLayoutFix} />
    <Layout {...props} menu={CustomMenu} appBar={CustomAppBar} />
  </NotificacionesProvider>
);
