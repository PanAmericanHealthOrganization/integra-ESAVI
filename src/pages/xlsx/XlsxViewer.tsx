import React, { useEffect, useState } from 'react';
import { Box, Typography, Select, MenuItem, Table, TableHead, TableRow, TableCell, TableBody, Paper } from '@mui/material';

// Lista de archivos XLSX que estarán en public/
const XLSX_FILES = [
  '20251022-dhi_esavi-FIELDS-DDBB.xlsx',
  // Puedes agregar más archivos aquí si los pones en public/
];

export const XlsxViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState('');
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (selectedFile) {
      fetch(`/${selectedFile}`)
        .then(res => res.arrayBuffer())
        .then(async buffer => {
          const XLSX = await import('xlsx/dist/xlsx.mjs');
          const workbook = XLSX.read(buffer, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
          // Solo los campos requeridos
          const filtered = data.map((row: any) => ({
            Name: row['Name'] || row['name'],
            Status: row['Status'] || row['status'],
            StartTime: row['Start time'] || row['StartTime'] || row['start_time']
          }));
          setRows(filtered);
        });
    } else {
      setRows([]);
    }
  }, [selectedFile]);

  return (
    <Box p={2}>
      <Typography variant="h5" gutterBottom>
        Visualizador de XLSX (desde public/)
      </Typography>
      <Select
        value={selectedFile}
        onChange={e => setSelectedFile(e.target.value)}
        displayEmpty
        sx={{ mb: 2, minWidth: 300 }}
      >
        <MenuItem value="" disabled>Selecciona un archivo XLSX</MenuItem>
        {XLSX_FILES.map(f => (
          <MenuItem key={f} value={f}>{f}</MenuItem>
        ))}
      </Select>
      {rows.length > 0 && (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Start time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell>{row.Name}</TableCell>
                  <TableCell>{row.Status}</TableCell>
                  <TableCell>{row.StartTime}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
};
