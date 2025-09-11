import { Injectable, Logger } from '@nestjs/common';
import { CreateCompleteDto } from '../dto/create-complete.dto';
import { Notificacion } from '../entity/notificacion.entity';
import { SourceEnum } from '../enum/source-enum';
import { AntecedenteEmbarazoService } from '../service/antecedente-embarazo.service';
import { AntecedenteEventoService } from '../service/antecedente-evento.service';
import { AntecedenteMedicoService } from '../service/antecedente-medico.service';
import { AntecedentePreexistenciaService } from '../service/antecedente-preexistencia.service';
import { CatalogoService } from '../service/catalogo.service';
import { CausalidadEsaviService } from '../service/causalidad-esavi.service';
import { DatoEsaviService } from '../service/dato-esavi.service';
import { DatoVacunaService } from '../service/dato-vacuna.service';
import { DatoVacunacionService } from '../service/dato-vacunacion.service';
import { DesenlaceEsaviService } from '../service/desenlace-esavi.service';
import { EmbarazoEsaviService } from '../service/embarazo-esavi.service';
import { GravedadEsaviService } from '../service/gravedad-esavi.service';
import { MedicamentoService } from '../service/medicamento.service';
import { NotificacionDhis2Service } from '../service/notificacion-dhis2.service';
import { NotificacionVigiflowService } from '../service/notificacion-vigiflow.service';
import { PacienteDhis2Service } from '../service/paciente-dhis2.service';
import { PacienteEmbarazadaServive } from '../service/paciente-embarazada.service';
import { PacienteVigiflowService } from '../service/paciente-vigiflow.service';

@Injectable()
export class IntegradorService {
  private readonly logger = new Logger(IntegradorService.name);
  constructor(
    private readonly pacienteDhis2Service: PacienteDhis2Service,
    private readonly pacienteVigiflowService: PacienteVigiflowService,
    private readonly notificacionDhis2Service: NotificacionDhis2Service,
    private readonly notificacionVigiflowService: NotificacionVigiflowService,
    private readonly medicamentoService: MedicamentoService,
    private readonly antecedenteEmbarazoService: AntecedenteEmbarazoService,
    private readonly antecedenteEventoService: AntecedenteEventoService,
    private readonly antecedenteMedicoService: AntecedenteMedicoService,
    private readonly antecedentePreexistenciaService: AntecedentePreexistenciaService,
    private readonly causalidadEsaviService: CausalidadEsaviService,
    private readonly desenlaceEsaviService: DesenlaceEsaviService,
    private readonly embarazoEsaviService: EmbarazoEsaviService,
    private readonly gravedadEsaviService: GravedadEsaviService,
    private readonly datoVacunaService: DatoVacunaService,
    private readonly pacienteEmbarazadaService: PacienteEmbarazadaServive,
    private readonly datoVacunacionService: DatoVacunacionService,
    private readonly datoEsaviService: DatoEsaviService,
    private readonly catalogoService: CatalogoService,
  ) {}

  async create(createDto: CreateCompleteDto) {
    let notificacion: Notificacion;
    console.log('Validar :::', SourceEnum.DHIS2);
    console.log('Validar2 :::', createDto.source);

    if (SourceEnum.DHIS2 == createDto.source) {
      const pacienteDhis2 = await this.pacienteDhis2Service.create(
        createDto.pacienteDhis2,
      );

      if (pacienteDhis2) {
        notificacion = await this.notificacionDhis2Service.create(
          createDto.notificacion,
          pacienteDhis2,
        );
      }
    } else {
      const pacienteVigiflow = await this.pacienteVigiflowService.create(
        createDto.pacienteVigiflow,
      );
      notificacion = await this.notificacionVigiflowService.create(
        createDto.notificacion,
        pacienteVigiflow,
      );
    }
    if (notificacion) {
      console.log('HayNotificaciooooon');

      if (createDto.medicamento && createDto.medicamento.length > 0) {
        await this.medicamentoService.createOneToMany(
          notificacion,
          createDto.medicamento,
        );
      }
      // Antecedentes
      if (createDto.antecedenteEmbarazo) {
        await this.antecedenteEmbarazoService.create(
          notificacion,
          createDto.antecedenteEmbarazo,
        );
      }
      if (createDto.antecedenteEvento) {
        await this.antecedenteEventoService.create(
          notificacion,
          createDto.antecedenteEvento,
        );
      }
      if (createDto.antecedenteMedico) {
        await this.antecedenteMedicoService.create(
          notificacion,
          createDto.antecedenteMedico,
        );
      }
      if (createDto.antecedentePreexistencia) {
        await this.antecedentePreexistenciaService.create(
          notificacion,
          createDto.antecedentePreexistencia,
        );
      }
      //ESAVI
      if (createDto.causalidadEsavi) {
        await this.causalidadEsaviService.create(
          notificacion,
          createDto.causalidadEsavi,
        );
      }
      if (createDto.desenlaceEsavi) {
        await this.desenlaceEsaviService.create(
          notificacion,
          createDto.desenlaceEsavi,
        );
      }

      //Paciente Embarazada
      if (createDto.pacienteEmbarazada) {
        await this.pacienteEmbarazadaService.create(
          notificacion,
          createDto.pacienteEmbarazada,
        );
      }

      if (createDto.embarazoEsavi) {
        await this.embarazoEsaviService.create(
          notificacion,
          createDto.embarazoEsavi,
        );
      }

      if (createDto.gravedadEsavi) {
        await this.gravedadEsaviService.create(
          notificacion,
          createDto.gravedadEsavi,
        );
      }

      // Datos Vacunacion
      if (createDto.datoVacuna) {
        await this.datoVacunaService.create(notificacion, createDto.datoVacuna);
      }

      if (createDto.datoVacunacion) {
        await this.datoVacunacionService.create(
          notificacion,
          createDto.datoVacunacion,
        );
      }

      if (createDto.datoEsavi) {
        await this.datoEsaviService.create(notificacion, createDto.datoEsavi);
      }
    }
    return;
  }

  /**
   * Busca una notificación por código DHIS2
   */
  async findByCodigoDhis2Evento(codigoDhis2Evento: string) {
    return this.notificacionDhis2Service.findByCodeDhis2(codigoDhis2Evento);
  }

  /**
   * Busca notificaciones por identificación de paciente y rango de fechas
   */
  async findByIdentificacionAndDateRange(
    identificacion: string,
    fechaInicio: Date,
    fechaFin: Date
  ) {
    return this.notificacionDhis2Service.findByIdentificacionAndDateRange(
      identificacion,
      fechaInicio,
      fechaFin
    );
  }

  /**
   * Busca registros similares para actualización masiva
   */
  async findSimilarRecords(identificacion: string, fechaNotificacion: string) {
    return this.notificacionDhis2Service.findSimilarRecords(
      identificacion,
      fechaNotificacion
    );
  }

  /**
   * Actualiza una notificación por código DHIS2
   */
  async updateByCodigoDhis2Evento(codigoDhis2Evento: string, updateData: CreateCompleteDto) {
    return this.notificacionDhis2Service.updateByCodigoDhis2Evento(
      codigoDhis2Evento,
      updateData
    );
  }
}
