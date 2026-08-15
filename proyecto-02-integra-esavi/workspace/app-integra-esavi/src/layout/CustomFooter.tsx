import { Box, Typography } from '@mui/material';
import { PALETA } from '../theme';

const year = new Date().getFullYear();

/*
 * Pie del menú lateral.
 *
 * Antes era una barra fija en el borde inferior de la ventana, a todo lo ancho. Ocupaba
 * 40px de alto permanentes en todas las pantallas —que había que descontar del alto de
 * cada tabla— para decir algo que se lee una vez. Al pie de la barra lateral cumple la
 * misma función sin quitarle sitio al contenido, que es donde se trabaja.
 *
 * No lleva posicionamiento propio: es un bloque normal, y quien lo empuja al fondo es el
 * separador flexible de `CustomMenu`.
 */
export const CustomFooter = () => (
  <Box
    sx={{
      flex: 'none',
      m: '8px 4px 4px',
      pt: 1.5,
      borderTop: `1px solid ${PALETA.bordeTarjeta}`,
      display: 'flex',
      alignItems: 'center',
      gap: 1,
    }}
  >
    <Box component="img" src="/favicon.ico" alt="" sx={{ height: 20, flex: 'none' }} />
    <Typography sx={{ fontSize: 10.5, color: PALETA.textoTerciario, lineHeight: 1.35 }}>
      <Box component="span" sx={{ fontWeight: 600, color: PALETA.textoSecundario }}>
        © {year} MSP INTEGRA-ESAVI
      </Box>
      <br />
      Derechos reservados
    </Typography>
  </Box>
);
