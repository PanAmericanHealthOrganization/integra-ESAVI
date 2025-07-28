import { Paciente } from './paciente.entity';
import { ChildEntity, Column } from 'typeorm';

@ChildEntity('vigiflow')
export class PacienteVigiflow extends Paciente {
  @Column({ name: 'CODIGOVIGIFLOW', unique: true })
  codigoVigiflow: string;
}
