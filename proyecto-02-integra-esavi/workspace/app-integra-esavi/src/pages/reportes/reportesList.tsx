import { useEffect, useState } from 'react';
import { reporteDataProvider } from '../../dataProviders/reportes.dataprovider';
import { Document, Page, pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
import useStateRef from 'react-usestateref';

import './pdf.css';

import { Grid } from '@mui/joy';
import { Box, Button, Container, FormLabel, Input, CircularProgress } from '@mui/material';

const ReportesList = () => {
  const [numPages, setNumPages] = useState(0);
  const [source, setSource, sourceRef] = useStateRef<string>();
  const [desde, setDesde] = useState<string>('');
  const [hasta, setHasta] = useState<string>('');
  const [isPdfAvailable, setIsPdfAvailable] = useState(false); // Estado para controlar si el PDF está disponible
  const [loading, setLoading] = useState(false); // Estado de carga para el botón "Buscar"

  const consultar = async () => {
    if (!desde || !hasta) {
      return; // Si falta alguna fecha, no realizar la consulta
    }

    if (new Date(desde) > new Date(hasta)) {
      alert('La fecha "Desde" no puede ser mayor que la fecha "Hasta"');
      return;
    }

    setLoading(true); // Activar el estado de carga

    const respuesta = await reporteDataProvider.obtenerReporte(desde, hasta);
    console.log('respuesta:: ', respuesta);
    setLoading(false); // Desactivar el estado de carga después de la consulta

    if (respuesta.msg === 'OK') {
      setSource(respuesta.data);
      setIsPdfAvailable(true); // Si se recibe un PDF, habilitar el botón PDF
    }
  };

  const limpiar = () => {
    setDesde('');
    setHasta('');
    setSource('');
    setIsPdfAvailable(false); // Deshabilitar el botón PDF al limpiar
    setLoading(false); // Deshabilitar el estado de carga
  };

  useEffect(() => {
    consultar();
  }, []);

  function onDocumentLoadSuccess({ numPages }: any) {
    setNumPages(numPages);
  }

  const descargarpdf = async () => {
    if (!sourceRef.current) return;

    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${sourceRef.current}`;
    link.download = 'reporteEsavi.pdf';
    link.click();
  };

  return (
    <div className="RaDatagrid-tableWrapper">
      <Container>
        <Box sx={{ flexGrow: 1 }}>
          <Grid container border={1} borderColor={'divider'} margin={1}>
            {/* Fecha Desde */}
            <Grid container xs={12} sm={6} md={6} maxHeight={50} marginTop={3} alignSelf={'flex-start'}>
              <Grid xs={1} md={3} xl={3} />
              <Grid xs={2} md={2} xl={2} alignSelf={'center'}>
                <FormLabel>Desde: </FormLabel>
              </Grid>
              <Grid xs={1} md={1} xl={1} />
              <Grid xs={6} md={6} xl={6} alignSelf={'center'}>
                <Input
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  slotProps={{
                    input: {
                      type: 'date'
                    }
                  }}
                />
              </Grid>
            </Grid>

            {/* Fecha Hasta */}
            <Grid container xs={12} sm={6} md={6} maxHeight={50} marginTop={3} alignSelf={'flex-start'}>
              <Grid xs={1} md={1} xl={1} />
              <Grid xs={2} md={2} xl={2} display={'flex'} flexDirection={'column'} textAlign={'right'} alignItems={'flex-end'} alignSelf={'center'}>
                <FormLabel>Hasta:</FormLabel>
              </Grid>
              <Grid xs={1} md={1} xl={1} />
              <Grid xs={6} md={5} xl={5} alignSelf={'center'}>
                <Input
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  slotProps={{
                    input: {
                      type: 'date'
                    }
                  }}
                />
              </Grid>
            </Grid>

            {/* Botones */}
            <Grid container xs={12} sm={12} md={12} spacing={2} marginTop={1}>
              <Grid container xs={12} sm={6} md={6} alignItems="center">
                <Grid xs={12} sm={4}>
                  {/* Espacio vacío para mantener alineación */}
                </Grid>
                <Grid xs={12} sm={4} textAlign="center">
                  <Button 
                    variant="contained" 
                    onClick={consultar} 
                    disabled={!desde || !hasta || loading} // Deshabilitado si no hay fechas o si está cargando
                  >
                    {loading ? <CircularProgress size={24} /> : 'Buscar'}
                  </Button>
                </Grid>
                <Grid xs={12} sm={4} textAlign="center">
                  <Button variant="contained" onClick={limpiar}>Limpiar</Button>
                </Grid>
              </Grid>

              <Grid container xs={12} sm={6} md={6} spacing={1} alignItems="center">
                <Grid xs={12} sm={4} textAlign="center">
                  {/* Botón CSV comentado */}
                  {/* <Button variant="contained" onClick={filtrar}>CSV</Button> */}
                </Grid>
                <Grid xs={12} sm={4} textAlign="center">
                  <Button variant="contained" onClick={descargarpdf} disabled={!isPdfAvailable}>
                    PDF
                  </Button>
                </Grid>
                <Grid xs={12} sm={4}>
                  {/* Espacio vacío para mantener alineación */}
                </Grid>
              </Grid>
            </Grid>

          </Grid>
        </Box>

        {/* Visualización del PDF */}
        {source && (
          <Document
            file={`data:application/pdf;base64,${sourceRef.current}`}
            onLoadSuccess={onDocumentLoadSuccess}
          >
            {Array.from(new Array(numPages), (el, index) => (
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            ))}
          </Document>
        )}

      </Container>
    </div>
  );
};

export default ReportesList;
