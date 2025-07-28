import { Paciente } from './paciente.entity';
import { ChildEntity, Column } from 'typeorm';

@ChildEntity('dhis2')
export class PacienteDhis2 extends Paciente {
  @Column({ name: 'CODIGODHIS2ENTIDAD', unique: true })
  codigoDhis2: string;
}
