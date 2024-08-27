import React, { useState } from 'react';
import { Button, Checkbox, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControlLabel } from '@mui/material';
import { integradorDataProvider } from '../../dataProviders/integrador.dataprovider';

interface BulkDialogProps {
    open: boolean;
    onClose: () => void;
}

const BulkDialog: React.FC<BulkDialogProps> = ({ open, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<string | null>(null);
    const [param1, setParam1] = useState(false);
    const [param2, setParam2] = useState(false);

    const handleCheckboxChange1 = (event: React.ChangeEvent<HTMLInputElement>) => {
        setParam1(event.target.checked);
    };

    const handleCheckboxChange2 = (event: React.ChangeEvent<HTMLInputElement>) => {
        setParam2(event.target.checked);
    };

    const handleBulk = async () => {
        setLoading(true);
        let respuesta;
        if (param1) {
            respuesta = await integradorDataProvider.importDataVigiflow();
            console.log('respuesta:: ', respuesta);
            if (respuesta.msg === 'OK') {
                // const data = await respuesta.data.json();
                // setResponse(JSON.stringify(data));
            } else {
                // setResponse(`Error: ${respuesta.status}`);
                setResponse(`Error:`);
            }
        }

        if (param2) {
            respuesta = await integradorDataProvider.importDataDHIS2();
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

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Importar datos</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Selecciona.
                </DialogContentText>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <FormControlLabel
                        control={<Checkbox checked={param1} onChange={handleCheckboxChange1} />}
                        label="Importar datos Vigiflow"
                    />
                    <FormControlLabel
                        control={<Checkbox checked={param2} onChange={handleCheckboxChange2} />}
                        label="Importar datos DHIS2"
                    />
                </div>
                {response && (
                    <DialogContentText>
                        Resultado: {response}
                    </DialogContentText>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleBulk} color="primary" disabled={loading}>
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
