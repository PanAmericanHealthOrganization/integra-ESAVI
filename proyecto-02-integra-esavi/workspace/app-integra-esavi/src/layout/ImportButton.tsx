import React, { useState } from 'react';
import { Button } from '@mui/material';
import BulkDialog from '../pages/esavis/BulkDialog';

const ImportButton = () => {
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleOpenDialog = () => {
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
    };

    return (
        <>
            <Button color="inherit" onClick={handleOpenDialog}>
                Importar datos
            </Button>
            <BulkDialog open={dialogOpen} onClose={handleCloseDialog} />
        </>
    );
};

export default ImportButton;
