/*
import { Request, Response } from 'express';
import { IController } from '../interfaces/IController';
import { TipoCatalogosService } from '../services/tipo-catalogos.service';

export class TipoCatalogosController implements IController {
  private tipoCatalogosService: TipoCatalogosService;

  constructor() {
    this.tipoCatalogosService = new TipoCatalogosService();
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const catalogos = await this.tipoCatalogosService.getAll();
      res.status(200).json({
        success: true,
        data: catalogos,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener los catálogos',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const catalogo = await this.tipoCatalogosService.getById(parseInt(id));

      if (!catalogo) {
        res.status(404).json({
          success: false,
          message: 'Catálogo no encontrado',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: catalogo,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener el catálogo',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const catalogoData = req.body;
      const nuevoCatalogo = await this.tipoCatalogosService.create(catalogoData);

      res.status(201).json({
        success: true,
        data: nuevoCatalogo,
        message: 'Catálogo creado exitosamente',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al crear el catálogo',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const catalogoData = req.body;
      const catalogoActualizado = await this.tipoCatalogosService.update(
        parseInt(id),
        catalogoData,
      );

      if (!catalogoActualizado) {
        res.status(404).json({
          success: false,
          message: 'Catálogo no encontrado',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: catalogoActualizado,
        message: 'Catálogo actualizado exitosamente',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al actualizar el catálogo',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const eliminado = await this.tipoCatalogosService.delete(parseInt(id));

      if (!eliminado) {
        res.status(404).json({
          success: false,
          message: 'Catálogo no encontrado',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Catálogo eliminado exitosamente',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al eliminar el catálogo',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }
}
*/
