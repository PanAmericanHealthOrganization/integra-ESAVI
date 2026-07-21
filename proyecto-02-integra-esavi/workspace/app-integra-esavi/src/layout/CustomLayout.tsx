import { GlobalStyles } from '@mui/material';
import { Layout, LayoutProps } from 'react-admin';
import { CustomMenu } from './CustomMenu';
import { CustomAppBar } from './CustomAppBar';
import { CustomFooter } from './CustomFooter';

// Altura del footer en px — usada aquí para reservarle espacio y evitar que se
// superponga al contenido, y en la marca de agua para no quedar detrás de él.
export const FOOTER_HEIGHT = 40;

/*
 * Ancla la cadena html→body→#root→.RaLayout-root al 100% del viewport.
 * Solo .RaDatagrid-tableWrapper scrollea (las filas de la tabla).
 * Toolbar de acciones y paginación permanecen siempre visibles.
 * El footer queda fijo en el borde inferior.
 *
 * 240px = AppBar(64) + toolbar-acciones(48) + paginación(52) + footer(40) + márgenes(36)
 */
const globalLayoutFix = `
  html, body, #root {
    height: 100%;
    overflow: hidden;
  }

  /*
   * La altura se reduce aquí (en vez de con padding-bottom en .RaLayout-content)
   * para reservar el espacio del footer fijo de forma estructural: así nunca se
   * superpone al contenido, sin importar si el contenido llega a necesitar scroll
   * o no. Con solo el padding-bottom, una página cuyo contenido termina justo al
   * borde del viewport (sin activar scroll) quedaba tapada por el footer, porque
   * el padding solo protege lo que queda "más allá" del contenido visible al
   * hacer scroll hasta el final, no lo que ya cabe sin scrollear.
   */
  .RaLayout-root {
    height: calc(100% - ${FOOTER_HEIGHT}px) !important;
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

  /* Encabezados de columna pegajosos al scrollear las filas */
  .RaDatagrid-tableWrapper thead th {
    position: sticky !important;
    top: 0 !important;
    z-index: 2 !important;
  }

  /*
   * El contenedor de filas scrollea internamente; la altura deja espacio para
   * toolbar + paginación + footer. El presupuesto de 240px asumía un toolbar
   * de una sola fila (~48px); en listas como ESAVIS, cuyo encabezado tiene
   * título + varios filtros + botón, esa fila es más alta y la caja de la
   * tabla terminaba reclamando más espacio del que quedaba libre, empujando
   * la paginación fuera de la pantalla, tapada por el footer fijo. Se sube
   * el presupuesto para dejar margen de sobra sin depender de medir cada
   * encabezado por página.
   */
  .RaDatagrid-tableWrapper {
    max-height: calc(100vh - 340px) !important;
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

  .RaDatagrid-tableWrapper::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.25);
    border-radius: 999px;
    border: 2px solid transparent;
    background-clip: content-box;
  }

  .RaDatagrid-tableWrapper::-webkit-scrollbar-thumb:hover {
    background-color: rgba(0, 0, 0, 0.4);
  }

  /* Marca de agua: escudo del Ecuador fijo en la esquina inferior derecha,
     sobre el contenido pero sin interceptar clics */
  .RaLayout-content::after {
    content: '';
    position: fixed;
    right: clamp(12px, 2vw, 24px);
    bottom: ${FOOTER_HEIGHT + 16}px;
    width: clamp(110px, 28vw, 243px);
    aspect-ratio: 1000 / 1200;
    background: url('/logos/escudo_ecuador.png') no-repeat center / contain;
    opacity: 0.08;
    pointer-events: none;
    z-index: 1000;
  }
`;

export const CustomLayout = (props: LayoutProps) => (
  <>
    <GlobalStyles styles={globalLayoutFix} />
    <Layout {...props} menu={CustomMenu} appBar={CustomAppBar} />
    <CustomFooter />
  </>
);
