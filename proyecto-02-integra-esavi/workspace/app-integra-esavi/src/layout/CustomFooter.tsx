import { Box, Typography } from "@mui/material"

const year = new Date().getFullYear()

export const CustomFooter = () => (
  <Box
    sx={{
      width: "100%",
      position: "fixed",
      left: 0,
      bottom: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      py: 1,
      background: "#f5f5f5",
      borderTop: "1px solid #e0e0e0",
      zIndex: 1201,
    }}>
    <img
      src="/favicon.ico"
      alt="MSP Logo"
      style={{ height: 28, marginRight: 12 }}
    />
    <Typography variant="body2" color="textSecondary">
      <b>Copyright © {year} MSP INTEGRA ESAVI.</b> Derechos Reservados.
    </Typography>
  </Box>
)
