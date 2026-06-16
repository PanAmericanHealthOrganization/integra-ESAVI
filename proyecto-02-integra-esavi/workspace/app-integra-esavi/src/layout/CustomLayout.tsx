import { GlobalStyles } from '@mui/material';
import { Layout, LayoutProps } from 'react-admin';
import { CustomMenu } from './CustomMenu';
import { CustomAppBar } from './CustomAppBar';
import { CustomFooter } from './CustomFooter';

// Altura del footer en px — usada aquí y en el padding-bottom del content
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

  .RaLayout-root {
    height: 100% !important;
    min-height: unset !important;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  /* Contenedor horizontal: sidebar + content */
  .RaLayout-appFrame {
    flex: 1 1 0 !important;
    min-height: 0 !important;
    overflow: hidden;
    display: flex !important;
  }

  /* Área de contenido: scrollable como fallback */
  .RaLayout-content {
    flex: 1 1 0 !important;
    min-height: 0 !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    padding-bottom: ${FOOTER_HEIGHT}px !important;
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

  /* El contenedor de filas scrollea internamente;
     la altura deja espacio para toolbar + paginación + footer */
  .RaDatagrid-tableWrapper {
    max-height: calc(100vh - 240px) !important;
    overflow-y: auto !important;
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }

  .RaDatagrid-tableWrapper::-webkit-scrollbar {
    display: none !important;
  }
`;

export const CustomLayout = (props: LayoutProps) => (
  <>
    <GlobalStyles styles={globalLayoutFix} />
    <Layout {...props} menu={CustomMenu} appBar={CustomAppBar} />
    <CustomFooter />
  </>
);
