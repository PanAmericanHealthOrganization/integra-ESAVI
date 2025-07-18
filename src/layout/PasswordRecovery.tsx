import React, { useState } from 'react';
import { Button, TextField, Typography, Box, Alert } from '@mui/material';
import { sendKeycloakPasswordRecovery } from '../keycloak.password-recovery';

const PasswordRecovery: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitted(false);
    if (!email) {
      setError('Por favor ingresa un correo válido.');
      return;
    }
    try {
      await sendKeycloakPasswordRecovery(email);
      setSubmitted(true);
    } catch (err: any) {
      setError('No se pudo enviar el enlace. Intenta más tarde.');
    }
  };

  return (
    <Box maxWidth={400} mx="auto" mt={8} p={4} boxShadow={3} borderRadius={2}>
      <Typography variant="h5" mb={2} align="center">
        Recuperar contraseña
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Correo electrónico"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          fullWidth
          required
          margin="normal"
        />
        <Button type="submit" variant="contained" color="primary" fullWidth>
          Enviar enlace de recuperación
        </Button>
      </form>
      {submitted && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default PasswordRecovery;
