import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material"
import { ReactNode, useState } from "react"
import { Title } from "react-admin"
import { CatalogoCrudPanel } from "./CatalogoCrudPanel"

interface CatalogoTipo {
  resource: string
  label: string
  description: string
  createLabel: string
  icon: ReactNode
}

const CATALOGOS: CatalogoTipo[] = []

export const CatalogosConfigList = () => {
  const [selected, setSelected] = useState<CatalogoTipo | null>(null)

  return (
    <Box p={2}>
      <Title title="Catálogos" />
      <Typography variant="h5" gutterBottom>
        Catálogos
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Selecciona un catálogo de la lista para administrar sus registros.
      </Typography>

      <Box display="flex" gap={2} alignItems="flex-start" flexWrap="wrap">
        <Paper elevation={2} sx={{ width: 320, flexShrink: 0 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>Catálogo</TableCell>
                  <TableCell>Descripción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {CATALOGOS.map((catalogo) => {
                  const isSelected = selected?.resource === catalogo.resource
                  return (
                    <TableRow
                      key={catalogo.resource}
                      hover
                      selected={isSelected}
                      sx={{ cursor: "pointer" }}
                      onClick={() => setSelected(catalogo)}>
                      <TableCell sx={{ width: 32, pr: 0 }}>{catalogo.icon}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {catalogo.label}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {catalogo.description}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Box flex={1} minWidth={320}>
          {selected ? (
            <CatalogoCrudPanel resource={selected.resource} label={selected.label} createLabel={selected.createLabel} />
          ) : (
            <Paper
              elevation={0}
              variant="outlined"
              sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
              Selecciona un catálogo de la izquierda para ver y administrar sus registros.
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  )
}
