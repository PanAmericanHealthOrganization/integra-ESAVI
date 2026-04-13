import { Paciente } from './paciente.entity';
import { ChildEntity, Column } from 'typeorm';

@ChildEntity('dhis2')
export class PacienteDhis2 extends Paciente {
  @Column({
    name: 'CODIGO_DHIS2_ENTIDAD',
    unique: true,
    comment: 'Código único del paciente en el sistema DHIS2',
  })
  codigoDhis2: string;
}
