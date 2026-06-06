import 'dotenv/config';
import app from './app';
import { AppDataSource } from './infrastructure/database/data-source';
import { FileImportService } from './application/services/FileImportService';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // 1. Inicializar conexión a Base de Datos
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    // 2. Ejecutar importación de archivos (Equivalente a @Startup en Java)
    const importService = new FileImportService();
    await importService.init();

    // 3. Iniciar servidor Express
    app.listen(PORT, () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`📡 Listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
};

startServer();
