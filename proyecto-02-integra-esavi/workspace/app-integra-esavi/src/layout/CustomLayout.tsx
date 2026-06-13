import { GlobalStyles } from '@mui/material';
import { Layout, LayoutProps } from 'react-admin';
import { CustomMenu } from './CustomMenu';
import { CustomAppBar } from './CustomAppBar';
import { CustomFooter } from './CustomFooter';

// Altura del footer en px — usada aquí y en el padding-bottom del content
export const FOOTER_HEIGHT = 40;

/*
 * Ancla toda la cadena html → body → #root → .RaLayout-root al 100 % del
 * viewport y elimina el scroll del documento. El único nodo scrolleable es
 * .RaLayout-content (el área de página seleccionada).
 * El footer queda fijo en el borde inferior, siempre visible.
 */
const globalLayoutFix = `
  html, body, #root {
    height: 100%;
    overflow: hidden;
  }

  /* RA usa min-height:100vh; lo sobreescribimos para que no supere el viewport */
  .RaLayout-root {
    height: 100% !important;
    min-height: unset !important;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  /* Contenedor horizontal: sidebar + content */
  .RaLayout-appFrame {
    flex: 1;
    min-height: unset !important;
    overflow: hidden;
  }

  /* Solo el área de contenido scrollea verticalmente, sin barra visible */
  .RaLayout-content {
    overflow-y: auto !important;
    overflow-x: hidden !important;
    padding-bottom: ${FOOTER_HEIGHT}px !important;
    scrollbar-width: none !important;        /* Firefox */
    -ms-overflow-style: none !important;     /* IE / Edge legacy */
  }

  .RaLayout-content::-webkit-scrollbar {
    display: none !important;                /* Chrome / Safari / Edge */
  }
`;

export const CustomLayout = (props: LayoutProps) => (
  <>
    <GlobalStyles styles={globalLayoutFix} />
    <Layout {...props} menu={CustomMenu} appBar={CustomAppBar} />
    <CustomFooter />
  </>
);
