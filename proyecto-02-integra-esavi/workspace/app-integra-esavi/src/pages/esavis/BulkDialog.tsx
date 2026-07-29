import React, { useState } from 'react';
import { Button, Checkbox, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControlLabel, TextField } from '@mui/material';
import { useNotify, useRefresh } from 'react-admin';
import { integradorDataProvider } from '../../dataProviders/integrador.dataprovider';

interface BulkDialogProps {
    open: boolean;
    onClose: () => void;
}

/** Respuesta común de los endpoints de importación del backend. */
interface RespuestaImportacion {
    status: string;
    msg: string;
}

const BulkDialog: React.FC<BulkDialogProps> = ({ open, onClose }) => {
    const refresh = useRefresh();
    const notify = useNotify();
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<string | null>(null);
    const [selectedOption, setSelectedOption] = useState<string | null>(null); // Usamos un solo estado para controlar el checkbox seleccionado
    const [startDate, setStartDate] = useState<string>(''); // Fecha de inicio
    const [endDate, setEndDate] = useState<string>(''); // Fecha de fin
    const [dateError, setDateError] = useState<string>(''); // Para mostrar el error de fecha

    const handleCheckboxChange = (option: string) => {
        setSelectedOption(prevState => (prevState === option ? null : option)); // Cambiar entre uno u otro checkbox
    };

    /**
     * El diálogo permanece montado entre aperturas, así que su estado se limpia al cerrar:
     * de lo contrario la siguiente importación arrancaría con el resultado y las fechas de
     * la anterior ya cargados.
     */
    const cerrarYReiniciar = () => {
        setResponse(null);
        setDateError('');
        setSelectedOption(null);
        setStartDate('');
        setEndDate('');
        onClose();
    };

    /**
     * Resultado de una importación: en caso de éxito se avisa y se cierra el diálogo —el
     * usuario no tiene nada más que hacer aquí—; si hubo error o el proceso terminó parcial,
     * el diálogo sigue abierto con el detalle para poder reintentar el rango.
     */
    const procesarRespuesta = (respuesta: RespuestaImportacion) => {
        if (respuesta.status === 'OK') {
            notify(respuesta.msg || 'Datos procesados exitosamente', { type: 'success' });
            refresh();
            cerrarYReiniciar();
            return;
        }

        if (respuesta.status === 'PARTIAL') {
            notify(respuesta.msg, { type: 'warning', autoHideDuration: 8000 });
            setResponse(respuesta.msg);
            refresh(); // Algunos periodos sí se importaron.
            return;
        }

        const mensajeError = `Error: ${respuesta.msg ?? 'no se pudo completar la importación'}`;
        notify(mensajeError, { type: 'error' });
        setResponse(mensajeError);
    };

    const handleBulk = async () => {
        setLoading(true);
        setResponse(null);

        // Validación de fechas
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            setDateError('La fecha de inicio no puede ser mayor que la fecha de fin.');
            setLoading(false);
            return;
        } else {
            setDateError('');
        }

        // Convertir las fechas al formato YYYYMMDD
        const startDateFormatted = startDate.replace(/-/g, ''); // Convierte la fecha 'YYYY-MM-DD' a 'YYYYMMDD'
        const endDateFormatted = endDate.replace(/-/g, ''); // Convierte la fecha 'YYYY-MM-DD' a 'YYYYMMDD'

        try {
            let respuesta: RespuestaImportacion | undefined;

            if (selectedOption === 'vigiflow') {
                respuesta = await integradorDataProvider.importDataVigiflow(startDateFormatted, endDateFormatted);
            }

            if (selectedOption === 'vigiflow-file') {
                respuesta = await integradorDataProvider.importDataVigiflowFromFile();
            }

            if (selectedOption === 'dhis2') {
                respuesta = await integradorDataProvider.importDataDHIS2(startDateFormatted, endDateFormatted);
            }

            if (respuesta) {
                procesarRespuesta(respuesta);
            }
        } catch (error) {
            // Fallo de red o respuesta no-JSON: el diálogo queda abierto para reintentar.
            const mensajeError = `Error: ${error instanceof Error ? error.message : 'no se pudo contactar al servidor'}`;
            notify(mensajeError, { type: 'error' });
            setResponse(mensajeError);
        } finally {
            setLoading(false);
        }
    };

    const needsDates = selectedOption === 'vigiflow' || selectedOption === 'dhis2';
    const isButtonDisabled = !selectedOption || (needsDates && (startDate === '' || endDate === ''));

    /** El backend parte los rangos de VigiFlow que cruzan meses en importaciones mensuales. */
    const cruzaVariosMeses =
        selectedOption === 'vigiflow' &&
        startDate !== '' &&
        endDate !== '' &&
        startDate.slice(0, 7) !== endDate.slice(0, 7);

    return (
        <Dialog open={open} onClose={cerrarYReiniciar}>
            <DialogTitle>Importar datos</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Selecciona la opción para importar los datos.
                </DialogContentText>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={selectedOption === 'vigiflow'}
                                onChange={() => handleCheckboxChange('vigiflow')}
                            />
                        }
                        label="Vigiflow"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={selectedOption === 'vigiflow-file'}
                                onChange={() => handleCheckboxChange('vigiflow-file')}
                            />
                        }
                        label="Vigiflow (desde archivo)"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={selectedOption === 'dhis2'}
                                onChange={() => handleCheckboxChange('dhis2')}
                            />
                        }
                        label="Importar datos DHIS2"
                    />
                </div>

                {needsDates && (
                    <div style={{ marginTop: 20 }}>
                        <TextField
                            label="Fecha de Inicio"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            fullWidth
                        />
                        <TextField
                            label="Fecha de Fin"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            fullWidth
                            style={{ marginTop: 10 }}
                        />
                        {dateError && (
                            <DialogContentText color="error" style={{ marginTop: 10 }}>
                                {dateError}
                            </DialogContentText>
                        )}
                        {cruzaVariosMeses && (
                            <DialogContentText variant="body2" style={{ marginTop: 10 }}>
                                El rango abarca más de un mes: se importará mes a mes y puede tardar varios minutos.
                            </DialogContentText>
                        )}
                    </div>
                )}

                {response && (
                    <DialogContentText>
                        Resultado: {response}
                    </DialogContentText>
                )}
            </DialogContent>
            <DialogActions>
                <Button 
                    onClick={handleBulk} 
                    color="primary" 
                    disabled={loading || isButtonDisabled}
                >
                    {loading ? 'Cargando...' : 'Importar'}
                </Button>
                <Button onClick={cerrarYReiniciar} color="primary" disabled={loading}>
                    Cerrar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BulkDialog;
