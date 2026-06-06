import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { WhoDrugController } from './interfaces/http/controllers/WhoDrugController';
import { MedraController } from './interfaces/http/controllers/MedraController';

const app: Application = express();

// Instanciar controladores
const whoDrugController = new WhoDrugController();
const medraController = new MedraController();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Rutas de WhoDrug
app.post('/whodrug/abbreviation', whoDrugController.abbreviation);
app.post('/whodrug/abbreviationCovid', whoDrugController.abbreviationCovid);
app.post('/whodrug/drugByAbbreviation', whoDrugController.drugByAbbreviation);
app.post('/whodrug/maholderBydrugCode', whoDrugController.maholderBydrugCode);
app.post('/whodrug/formByMaholder', whoDrugController.formByMaholder);
app.post('/whodrug/strengthByForm', whoDrugController.strengthByForm);

// Rutas de MedraToCie10
app.post('/medratocie10/bymedracode', medraController.getByMedraCode);
app.post('/medratocie10/ByCie10Code', medraController.getByCie10Code);

// Ruta de salud (Health Check) para validación de despliegue
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'MedraWhodrug API is running',
    timestamp: new Date().toISOString()
  });
});

export default app;
