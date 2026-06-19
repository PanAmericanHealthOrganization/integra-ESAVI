import { Auditoria } from 'src/integrator/entity';
import { Column, Entity, PrimaryColumn } from 'typeorm';

//comment: 'Definición y descripción del Mapeo',

@Entity({
  name: 'MAPPING_DEFINITION',
})
export class MappingDefinition extends Auditoria {
  /**
   *
   */
  @PrimaryColumn({ name: 'ID' })
  id: string;

  /**
   *
   */
  @Column({ name: 'MPD_DESCRIPTION', comment: '' })
  description: string;
  /**
   *
   */
  @Column({ name: 'MPD_SOURCE', comment: '' })
  source: string;

  /**
   *
   */
  @Column({ name: 'MPD_DESCRIPTION_SOURCE', comment: '' })
  descriptionSource: string;

  /**
   *
   */
  @Column({ name: 'MPD_TARGET', comment: '' })
  target: string;
  /**
   *
   */
  @Column({ name: 'MPD_DESCRIPTION_TARGET', comment: '' })
  descriptionTarget: string;
}
