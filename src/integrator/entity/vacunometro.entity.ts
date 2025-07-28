import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'dhi_esavi' , name: 'TR_VACUNOMETRO' })
export class Vacunometro {
  @PrimaryGeneratedColumn('uuid', { name: 'VACUNOMETRO_ID' })
  id: string;
  @Column({ name: 'NOMBREVACUNA' })
  nombreVacuna: string;
  @Column({ name: 'DOSISAPLICADA', nullable: true })
  dosisAplicada: number;
  @Column({ name: 'DIAAPLICACION', nullable: true })
  diaAplicacion: number;
  @Column({ name: 'MESAPLICACION', nullable: true })
  mesAplicacion: number;
  @Column({ name: 'ANIOAPLICACION', nullable: true })
  anioAplicacion: number;
  @Column({ name: 'FECHAAPLICACION', nullable: true })
  fechaAplicacion: Date;
  @Column({ name: 'SEXO', nullable: true })
  sexo: string;
  @Column({ name: 'CANTIDAD', nullable: true })
  cantidad: number;
  @Column({ name: 'NUMERODOSIS', nullable: true })
  numeroDosis: number;
}
