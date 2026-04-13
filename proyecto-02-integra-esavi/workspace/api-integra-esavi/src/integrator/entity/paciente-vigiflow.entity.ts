import { Paciente } from './paciente.entity';
import { ChildEntity, Column } from 'typeorm';

@ChildEntity('vigiflow')
export class PacienteVigiflow extends Paciente {
  @Column({
    name: 'CODIGO_VIGIFLOW',
    unique: true,
    comment: 'Código único del paciente en el sistema Vigiflow',
  })
  codigoVigiflow: string;
}
