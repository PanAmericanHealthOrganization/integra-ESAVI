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
      // Todas las sub-entidades hacen upsert por notificacion.id (ver cada
      // servicio), por lo que es seguro reprocesarlas tanto en la creación inicial
      // como al reimportar un registro DHIS2 ya existente (ver
      // updateByCodigoDhis2Evento).
      await this.upsertSubEntidadesActualizables(notificacion, createDto);
    }
    return;
  }

  /**
   * Crea o actualiza (upsert por notificacion.id) todas las sub-entidades de una
   * notificación. Se usa tanto en la creación inicial como al reimportar un
   * registro DHIS2 ya existente, para que datos agregados en DHIS2 después de la
   * primera importación (p.ej. vacunación, comorbilidades, causalidad) lleguen a
   * la app en un reimport en vez de quedarse solo en la creación inicial.
   */
  private async upsertSubEntidadesActualizables(notificacion: Notificacion, createDto: CreateCompleteDto) {
    // Cada sub-entidad se procesa de forma aislada: si una falla (p.ej. un dato
    // crudo de DHIS2 con formato inesperado en un campo numérico), no debe abortar
    // el resto -- antes un error temprano en, por ejemplo, antecedenteEmbarazo
    // impedía que datoVacunacion/datoVacuna llegaran a procesarse para esa misma
    // notificación. Los errores se acumulan y se relanzan al final (uno solo) para
    // que sigan quedando visibles en los logs de importación.
    const errores: string[] = [];
    const intentar = async (etiqueta: string, fn: () => Promise<unknown>) => {
      try {
        await fn();
      } catch (e: any) {
        this.logger.error(`Error procesando ${etiqueta} de la notificación ${notificacion.id}: ${e.message}`, e.stack);
        errores.push(`${etiqueta}: ${e.message}`);
      }
    };

    if (createDto.medicamento && createDto.medicamento.length > 0) {
      await intentar('medicamento', () => this.medicamentoService.createOneToMany(notificacion, createDto.medicamento));
    }
    if (createDto.antecedenteEvento) {
      await intentar('antecedenteEvento', () => this.antecedenteEventoService.create(notificacion, createDto.antecedenteEvento));
    }
    if (createDto.antecedenteMedico) {
      await intentar('antecedenteMedico', () => this.antecedenteMedicoService.create(notificacion, createDto.antecedenteMedico));
    }
    if (createDto.causalidadEsavi) {
      await intentar('causalidadEsavi', () => this.causalidadEsaviService.create(notificacion, createDto.causalidadEsavi));
    }
    if (createDto.embarazoEsavi) {
      await intentar('embarazoEsavi', () => this.embarazoEsaviService.create(notificacion, createDto.embarazoEsavi));
    }
    if (createDto.antecedenteEmbarazo) {
      await intentar('antecedenteEmbarazo', () => this.antecedenteEmbarazoService.create(notificacion, createDto.antecedenteEmbarazo));
    }
    if (createDto.antecedentePreexistencia) {
      await intentar('antecedentePreexistencia', () => this.antecedentePreexistenciaService.create(notificacion, createDto.antecedentePreexistencia));
    }
    if (createDto.desenlaceEsavi) {
      await intentar('desenlaceEsavi', () => this.desenlaceEsaviService.create(notificacion, createDto.desenlaceEsavi));
    }
    if (createDto.pacienteEmbarazada) {
      await intentar('pacienteEmbarazada', () => this.pacienteEmbarazadaService.create(notificacion, createDto.pacienteEmbarazada));
    }
    if (createDto.gravedadEsavi) {
      await intentar('gravedadEsavi', () => this.gravedadEsaviService.create(notificacion, createDto.gravedadEsavi));
    }

    // Datos Vacunacion: primero crear/actualizar datoVacunacion, luego datoVacuna con la referencia
    let datoVacunacion = null;
    if (createDto.datoVacunacion) {
      await intentar('datoVacunacion', async () => {
        datoVacunacion = await this.datoVacunacionService.create(notificacion, createDto.datoVacunacion);
      });
    }
    if (createDto.datoVacuna) {
      await intentar('datoVacuna', () =>
        datoVacunacion
          ? this.datoVacunaService.create(datoVacunacion as any, createDto.datoVacuna)
          // Sin datoVacunacion explícito (ej. flujo DHIS2): crear/buscar datoVacunacion implícitamente
          : this.datoVacunaService.createByNotificacion(notificacion, createDto.datoVacuna as any),
      );
    }

    if (createDto.datoEsavi) {
      await intentar('datoEsavi', () => this.datoEsaviService.create(notificacion, createDto.datoEsavi));
    }

    // Investigacion: TR_INVESTIGACION (relación 1:1 con Notificacion, upsert por notificacion.id)
    if (createDto.investigacion) {
      await intentar('investigacion', () => this.investigacionService.create(createDto.investigacion, notificacion));
    }

    if (errores.length > 0) {
      throw new Error(`Fallaron ${errores.length} sub-entidad(es): ${errores.join(' | ')}`);
    }
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
   * Actualiza una notificación por código DHIS2. Reutiliza el mismo
   * NotificacionDhis2Service.update() que usa la creación normal (resuelve
   * catálogos como tipoEmisor/unidadEdad/parroquia en vez de copiar los campos del
   * DTO tal cual, que rompía con "invalid input syntax for type uuid" al pisar
   * relaciones con el string plano del DTO). Además reprocesa las sub-entidades
   * que soportan upsert (ver upsertSubEntidadesActualizables) para que datos
   * agregados en DHIS2 después de la primera importación (p.ej. vacunación)
   * lleguen a la app en un reimport.
   */
  async updateByCodigoDhis2Evento(codigoDhis2Evento: string, updateData: CreateCompleteDto) {
    const notificacionExistente = await this.notificacionDhis2Service.findByCodeDhis2(codigoDhis2Evento);
    if (!notificacionExistente) {
      throw new Error(`Notificación con código DHIS2 ${codigoDhis2Evento} no encontrada`);
    }
    const paciente = await this.pacienteService.createFromDhis2(updateData.pacienteDhis2);
    const notificacion = await this.notificacionDhis2Service.update(
      notificacionExistente,
      updateData.notificacion,
      paciente,
    );
    if (notificacion) {
      await this.upsertSubEntidadesActualizables(notificacion, updateData);
    }
    return notificacion;
  }
}
