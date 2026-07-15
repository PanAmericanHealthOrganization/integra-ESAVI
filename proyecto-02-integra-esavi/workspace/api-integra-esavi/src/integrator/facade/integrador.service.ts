import { Injectable, Logger } from '@nestjs/common';
import { CreateCompleteDto } from '../dto';
import { Notificacion } from '../entity/notificacion.entity';
import { Paciente } from '../entity/paciente.entity';
import { SourceEnum } from '../enum/source-enum';
import { AntecedenteEmbarazoService } from '../service/antecedente-embarazo.service';
import { AntecedenteEventoService } from '../service/antecedente-evento.service';
import { AntecedenteMedicoService } from '../service/antecedente-medico.service';
import { AntecedentePreexistenciaService } from '../service/antecedente-preexistencia.service';
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
import { PacienteEmbarazadaServive } from '../service/paciente-embarazada.service';
import { PacienteService } from '../service/paciente.service';
import { InvestigacionService } from '../service/investigacion.service';

@Injectable()
export class IntegradorService {
  private readonly logger = new Logger(IntegradorService.name);
  constructor(
    private readonly pacienteService: PacienteService,
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
    private readonly investigacionService: InvestigacionService,
  ) {}

  async create(
    createDto: CreateCompleteDto,
    preloadedPaciente?: Paciente,
    preloadedNotif?: Notificacion,
  ) {
    let notificacion: Notificacion;

    if (SourceEnum.DHIS2 == createDto.source) {
      const paciente = await this.pacienteService.createFromDhis2(createDto.pacienteDhis2);

      if (paciente) {
        notificacion = await this.notificacionDhis2Service.create(createDto.notificacion, paciente);
      }
    } else {
      const paciente = await this.pacienteService.createFromVigiflow(createDto.pacienteVigiflow, preloadedPaciente);
      notificacion = await this.notificacionVigiflowService.create(createDto.notificacion, paciente, preloadedNotif);
    }
    if (notificacion) {
      if (createDto.medicamento && createDto.medicamento.length > 0) {
        await this.medicamentoService.createOneToMany(notificacion, createDto.medicamento);
      }
      // Antecedentes
      if (createDto.antecedenteEmbarazo) {
        await this.antecedenteEmbarazoService.create(notificacion, createDto.antecedenteEmbarazo);
      }
      if (createDto.antecedenteEvento) {
        await this.antecedenteEventoService.create(notificacion, createDto.antecedenteEvento);
      }
      if (createDto.antecedenteMedico) {
        await this.antecedenteMedicoService.create(notificacion, createDto.antecedenteMedico);
      }
      if (createDto.antecedentePreexistencia) {
        await this.antecedentePreexistenciaService.create(notificacion, createDto.antecedentePreexistencia);
      }
      //ESAVI
      if (createDto.causalidadEsavi) {
        await this.causalidadEsaviService.create(createDto.causalidadEsavi);
      }
      if (createDto.desenlaceEsavi) {
        await this.desenlaceEsaviService.create(notificacion, createDto.desenlaceEsavi);
      }

      //Paciente Embarazada
      if (createDto.pacienteEmbarazada) {
        await this.pacienteEmbarazadaService.create(notificacion, createDto.pacienteEmbarazada);
      }

      if (createDto.embarazoEsavi) {
        await this.embarazoEsaviService.create(notificacion, createDto.embarazoEsavi);
      }

      if (createDto.gravedadEsavi) {
        await this.gravedadEsaviService.create(notificacion, createDto.gravedadEsavi);
      }

      // Datos Vacunacion: primero crear datoVacunacion, luego datoVacuna con la referencia
      let datoVacunacion = null;
      if (createDto.datoVacunacion) {
        datoVacunacion = await this.datoVacunacionService.create(notificacion, createDto.datoVacunacion);
      }

      if (createDto.datoVacuna) {
        if (datoVacunacion) {
          await this.datoVacunaService.create(datoVacunacion as any, createDto.datoVacuna);
        } else {
          // Sin datoVacunacion explícito (ej. flujo DHIS2): crear/buscar datoVacunacion implícitamente
          await this.datoVacunaService.createByNotificacion(notificacion, createDto.datoVacuna as any);
        }
      }

      if (createDto.datoEsavi) {
        await this.datoEsaviService.create(notificacion, createDto.datoEsavi);
      }

      // Investigacion: TR_INVESTIGACION
      if (createDto.investigacion) {
        await this.investigacionService.create(
          //notificacion, //esavi,
          //createDto.datoEsavi //Para aceptar otro argumento se debe editar el servicio "investigacionService"
          createDto.investigacion,
          notificacion,
        );
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
  async findByIdentificacionAndDateRange(identificacion: string, fechaInicio: Date, fechaFin: Date) {
    return this.notificacionDhis2Service.findByIdentificacionAndDateRange(identificacion, fechaInicio, fechaFin);
  }

  /**
   * Busca registros similares para actualización masiva
   */
  async findSimilarRecords(identificacion: string, fechaNotificacion: string) {
    return this.notificacionDhis2Service.findSimilarRecords(identificacion, fechaNotificacion);
  }

  /**
   * Actualiza una notificación por código DHIS2
   */
  async updateByCodigoDhis2Evento(codigoDhis2Evento: string, updateData: CreateCompleteDto) {
    return this.notificacionDhis2Service.updateByCodigoDhis2Evento(codigoDhis2Evento, updateData);
  }
}
