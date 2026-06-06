import { Request, Response } from 'express';

export class MedraController {
  // Nota: El servicio se inyectará o importará una vez implementado

  public getByMedraCode = async (req: Request, res: Response): Promise<void> => {
    try {
      const codigoMedra = req.body.CodigoMedra || "";
      console.log(`consultaTerminoPorCodigoMedra: ${JSON.stringify(req.body)}`);
      // TODO: Llamar a MedraService.obtenerMapeoPorCodigoMedra(codigoMedra)
      res.status(200).json([]);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  public getByCie10Code = async (req: Request, res: Response): Promise<void> => {
    try {
      const codigoCie10 = req.body.CodigoCie10 || "";
      console.log(`consultaTerminoPorCodigoCie10: ${JSON.stringify(req.body)}`);
      // TODO: Llamar a MedraService.obtenerMapeoPorCodigoCie10(codigoCie10)
      res.status(200).json([]);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}
