import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CalidadDatosResultadoDto, DimensionCalidadDatosDto } from '../controllers/dto/quality.dto';
import { DataQualityUtils } from './utils/dataquality.utils';

export class DimExactitudService {
  constructor(
    @InjectDataSource('DATAQUALITY_DS')
    private readonly dataSource: DataSource,
  ) {}

  /**
   *
   * @param day
   * @returns
   */
  async processAll(day: Date): Promise<DimensionCalidadDatosDto> {
    const [edadInicioEvaento, nombreVacunaDominio] = await Promise.all([
      this._edadInicioEvento(day),
      this._nombreVacunaDominio(day),
    ]);
    return {
      dimension: 'Dimensión de Exactitud',
      calidadDimension: DataQualityUtils.calcularCalidadDimension([edadInicioEvaento, nombreVacunaDominio]),
      jsonQuality: [edadInicioEvaento, nombreVacunaDominio],
    };
  }

  /**
   * Calidad edad al inicio del evento
   * @param day
   * @returns
   */
  private async _edadInicioEvento(day: Date): Promise<CalidadDatosResultadoDto> {
    const query = `
        select
        count(tn."EDAD") as "totalRegistros",
        count(tn."EDAD") filter (where tn."EDAD" is not null) "totalRegistrosValidos",
        count(tn."EDAD") filter (where tn."EDAD" is null) "totalRegistrosNoValidos"
        from
          dhi_esavi."TR_NOTIFICACION" tn
        inner join dhi_esavi."TR_PACIENTE" tp on tn."PACIENTE_ID" = tp."PACIENTE_ID"
        where tn."AUD_FECHA_CREACION" <= '${day.toISOString()}'
        ;
    `;
    const result = await this.dataSource.query(query);
    //
    const totales = await DataQualityUtils.construirResultado(result);
    return {
      tipo: 'Dimensión de Exactitud',
      regla: 'Edad al inicio del evento',
      condicion: 'La edad registrada  debe ser la edad de la persona al inicio del evento.',
      descripcionRegla: 'El valor es correcto cuando la edad calculada es igual a  EDAD registrada en la notificación.',
      ...totales,
    };
  }

  /**
   *
   * @param day
   * @returns
   */
  private async _nombreVacunaDominio(day: Date): Promise<CalidadDatosResultadoDto> {
    const listaVacunas = ['COVID 19', 'HB ADULTO', 'PENTAVALENTE']; // Ejemplo de dominio de vacunas
    const query = `
    select
    count(tn."NOMBRE_VACUNA") filter (where tn."NOMBRE_VACUNA" is not null) as "totalRegistros",
    count(tn."NOMBRE_VACUNA") filter (where tn."NOMBRE_VACUNA" in (${listaVacunas
      .map((v) => `'${v}'`)
      .join(', ')})) "totalRegistrosValidos",
    count(tn."NOMBRE_VACUNA") filter (where tn."NOMBRE_VACUNA" not in (${listaVacunas
      .map((v) => `'${v}'`)
      .join(', ')})) "totalRegistrosNoValidos"
    from
      dhi_esavi."TR_DATO_VACUNA" tn
    where tn."AUD_FECHA_CREACION" <= '${day.toISOString()}'
    `;
    const result = await this.dataSource.query(query);
    //
    const totales = await DataQualityUtils.construirResultado(result);
    return {
      tipo: 'Dimensión de Exactitud',
      regla: 'Nombre de vacuna según dominio',
      condicion:
        'Comparar cada valor único de vacuna registrado en NOMBRE_VACUNA con catalogo de referencia nacional de vacunas',
      descripcionRegla:
        'El nombre de la vacuna registrado debe corresponder a una vacuna dentro del catalogo nacional de referencia',
      ...totales,
    };
  }
}
