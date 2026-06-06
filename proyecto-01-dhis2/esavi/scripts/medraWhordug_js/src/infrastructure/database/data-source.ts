import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { DatosWhodrug } from '../../domain/entities/DatosWhodrug';
import { MapeoMedraCie10 } from '../../domain/entities/MapeoMedraCie10';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'medrawhodrug',
  synchronize: false, // Desactivado para evitar cambios accidentales en esquema de producción
  logging: process.env.NODE_ENV === 'development',
  entities: [DatosWhodrug, MapeoMedraCie10],
});
