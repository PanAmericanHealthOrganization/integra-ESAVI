import { Box, Typography } from '@mui/material';
import { FOOTER_HEIGHT } from './CustomLayout';

const year = new Date().getFullYear();

export const CustomFooter = () => (
  <Box
    sx={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: FOOTER_HEIGHT,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f5f5',
      borderTop: '1px solid #e0e0e0',
      zIndex: 1201,
    }}
  >
    <img
      src="/favicon.ico"
      alt="MSP Logo"
      style={{ height: 28, marginRight: 12 }}
    />
    <Typography variant="body2" color="textSecondary">
      <b>Copyright © {year} MSP INTEGRA ESAVI.</b> Derechos Reservados.
    </Typography>
  </Box>
);
