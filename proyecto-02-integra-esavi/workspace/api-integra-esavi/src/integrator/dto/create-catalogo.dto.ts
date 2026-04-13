import { Column, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TipoCatalogo } from '../entity/tipo-catalogo.entity';

export class CreateCatalogoDto {
  padre: CreateCatalogoDto;
  tipoCatalogo: TipoCatalogo;
}
