import { Request, Response } from 'express';

export class WhoDrugController {
  // Nota: El servicio se inyectará o importará una vez implementado
  
  public abbreviation = async (req: Request, res: Response): Promise<void> => {
    try {
      const code = req.body.Code || "";
      console.log(`abbreviation: ${JSON.stringify(req.body)}`);
      // TODO: Llamar a WhoDrugService.obtenerAbreviatura(code)
      res.status(200).json([]); 
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  public abbreviationCovid = async (req: Request, res: Response): Promise<void> => {
    try {
      const code = req.body.Code || "";
      console.log(`abbreviationCovid: ${JSON.stringify(req.body)}`);
      // TODO: Llamar a WhoDrugService.obtenerAbreviaturaCovid(code)
      res.status(200).json([]);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  public drugByAbbreviation = async (req: Request, res: Response): Promise<void> => {
    try {
      const code = req.body.Code;
      if (!code) {
        res.status(400).json({ error: 'Code is required' });
        return;
      }
      console.log(`drugByAbbreviation: ${JSON.stringify(req.body)}`);
      // TODO: Llamar a WhoDrugService.obtenerDrugsByAbreviature(code)
      res.status(200).json([]);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  public maholderBydrugCode = async (req: Request, res: Response): Promise<void> => {
    try {
      const code = req.body.Code;
      if (!code) {
        res.status(400).json({ error: 'Code is required' });
        return;
      }
      console.log(`maholderBydrugCode: ${JSON.stringify(req.body)}`);
      // TODO: Llamar a WhoDrugService.obtenerMaholderByDrugCode(code)
      res.status(200).json([]);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  public formByMaholder = async (req: Request, res: Response): Promise<void> => {
    try {
      const code = req.body.Code;
      if (!code) {
        res.status(400).json({ error: 'Code is required' });
        return;
      }
      console.log(`formByMaholder: ${JSON.stringify(req.body)}`);
      // TODO: Llamar a WhoDrugService.obtenerFormByMaholderCode(code)
      res.status(200).json([]);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  public strengthByForm = async (req: Request, res: Response): Promise<void> => {
    try {
      const code = req.body.Code;
      if (!code) {
        res.status(400).json({ error: 'Code is required' });
        return;
      }
      console.log(`strengthByForm: ${JSON.stringify(req.body)}`);
      // TODO: Llamar a WhoDrugService.obtenerStrengthByFormCode(code)
      res.status(200).json([]);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}
