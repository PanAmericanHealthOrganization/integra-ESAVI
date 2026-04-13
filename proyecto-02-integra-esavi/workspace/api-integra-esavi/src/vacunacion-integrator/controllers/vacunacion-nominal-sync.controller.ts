import { Body, Controller, Get, Logger, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';
import { SyncRangeDto } from '../dto/vacunacion-consolidada.dto';
import { BulkVacunacionService } from '../service/BulkVacunacion.service';
import { VacunacionNominalService } from '../service/vacunacion-nominal.service';

interface JobStatus {
  jobId: string;
  status: 'processing' | 'completed' | 'failed';
  desde?: Date;
  hasta?: Date;
  startTime: Date;
  endTime?: Date;
  error?: string;
  message?: string;
}

/**
 * Controlador para sincronización de datos de vacunación desde Oracle
 */
@ApiTags('Vacunacion Nominal Sync')
@Controller({ path: 'integrator/vacunacion-nominal-sync', version: '1' })
export class VacunacionNominalSyncController {
  private readonly logger = new Logger(VacunacionNominalSyncController.name);
  private readonly jobs = new Map<string, JobStatus>();

  constructor(
    private readonly vacunacionService: VacunacionNominalService,
    private readonly bulkVacunacionService: BulkVacunacionService,
  ) {}

  /**
   * Endpoint para sincronizar vacunaciones en un rango de fechas
   * Inicia el procesamiento en segundo plano y devuelve inmediatamente un jobId
   * @param syncRangeDto - DTO con fechas desde y hasta
   * @returns Job ID y estado inicial
   */
  @Post('/sync-range')
  async syncRange(@Body() syncRangeDto: SyncRangeDto) {
    const jobId = uuidv4();
    const jobStatus: JobStatus = {
      jobId,
      status: 'processing',
      desde: syncRangeDto.desde,
      hasta: syncRangeDto.hasta,
      startTime: new Date(),
      message: 'Sincronización iniciada',
    };

    this.jobs.set(jobId, jobStatus);
    this.logger.log(`Job ${jobId} iniciado: sincronización desde ${syncRangeDto.desde} hasta ${syncRangeDto.hasta}`);

    // Ejecutar en background sin esperar
    this.vacunacionService
      .procesarVacunasAgregadas(syncRangeDto.desde, syncRangeDto.hasta)
      .then(() => {
        const job = this.jobs.get(jobId);
        if (job) {
          job.status = 'completed';
          job.endTime = new Date();
          job.message = 'Sincronización completada exitosamente';
          this.jobs.set(jobId, job);
          this.logger.log(`Job ${jobId} completado exitosamente`);
        }
      })
      .catch((error) => {
        const job = this.jobs.get(jobId);
        if (job) {
          job.status = 'failed';
          job.endTime = new Date();
          job.error = error.message || 'Error desconocido';
          job.message = 'Sincronización falló';
          this.jobs.set(jobId, job);
          this.logger.error(`Job ${jobId} falló:`, error);
        }
      });

    return {
      jobId,
      status: 'processing',
      message: 'Sincronización iniciada en segundo plano',
      desde: syncRangeDto.desde,
      hasta: syncRangeDto.hasta,
    };
  }

  /**
   * Endpoint para consultar el estado de un job de sincronización
   * @param jobId - ID del job a consultar
   * @returns Estado actual del job
   */
  @Get('/sync-status/:jobId')
  async getSyncStatus(@Param('jobId') jobId: string) {
    const job = this.jobs.get(jobId);

    if (!job) {
      return {
        jobId,
        status: 'not_found',
        message: 'Job no encontrado',
      };
    }

    return job;
  }

  /**
   * Endpoint para listar todos los jobs
   * @returns Lista de todos los jobs
   */
  @Get('/sync-jobs')
  async getAllJobs() {
    return Array.from(this.jobs.values()).sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  /**
   *
   * @returns
   */
  @Get('/sync-bulk')
  async getBulkVacunas() {
    return await this.bulkVacunacionService.bulkVacunas();
  }
}
