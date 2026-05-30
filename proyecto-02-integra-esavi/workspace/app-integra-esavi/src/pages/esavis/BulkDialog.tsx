import React, { useState } from 'react';
import { Button, Checkbox, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControlLabel, TextField } from '@mui/material';
import { integradorDataProvider } from '../../dataProviders/integrador.dataprovider';

interface BulkDialogProps {
    open: boolean;
    onClose: () => void;
}

const BulkDialog: React.FC<BulkDialogProps> = ({ open, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<string | null>(null);
    const [selectedOption, setSelectedOption] = useState<string | null>(null); // Usamos un solo estado para controlar el checkbox seleccionado
    const [startDate, setStartDate] = useState<string>(''); // Fecha de inicio
    const [endDate, setEndDate] = useState<string>(''); // Fecha de fin
    const [dateError, setDateError] = useState<string>(''); // Para mostrar el error de fecha

    const handleCheckboxChange = (option: string) => {
        setSelectedOption(prevState => (prevState === option ? null : option)); // Cambiar entre uno u otro checkbox
    };

    const handleBulk = async () => {
        setLoading(true);
        let respuesta;

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

        if (selectedOption === 'vigiflow') {
            // Llamada al servicio de Vigiflow con las fechas formateadas
            respuesta = await integradorDataProvider.importDataVigiflow(startDateFormatted, endDateFormatted);
            console.log('respuesta:: ', respuesta);
            if (respuesta.msg === 'OK') {
                // Si es necesario manejar la respuesta, puedes procesarla aquí
                setResponse(`${respuesta.msg}`);
            } else {
                setResponse(`${respuesta.status}`);
            }
        }

        if (selectedOption === 'dhis2') {
            // Llamada al servicio de DHIS2 con las fechas formateadas
            respuesta = await integradorDataProvider.importDataDHIS2(startDateFormatted, endDateFormatted);
            console.log('respuesta:: ', respuesta);
            if (respuesta.status === 'OK') {
                setResponse(`${respuesta.msg}`);
                console.log("IMPORTADO CORRECTAMENTE");
            } else {
                setResponse(`Error: ${respuesta.status}`);
            }
        }

        setLoading(false);
    };

    // Lógica para habilitar el botón de "Importar" solo si las fechas están completas
    const isButtonDisabled = !selectedOption || (startDate === '' || endDate === '');

    return (
        <Dialog open={open} onClose={onClose}>
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
                                checked={selectedOption === 'dhis2'}
                                onChange={() => handleCheckboxChange('dhis2')}
                            />
                        }
                        label="Importar datos DHIS2"
                    />
                </div>

                {(selectedOption === 'vigiflow' || selectedOption === 'dhis2') && (
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
                <Button onClick={onClose} color="primary">
                    Cerrar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BulkDialog;
