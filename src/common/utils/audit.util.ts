import { Auditoria } from 'src/integrator/entity';

const DEFAULT_AUDIT_USER = process.env.USUARIO_INSERTA_REGISTRO || 'SYSTEM';

const buildNow = () => new Date();

export const withAuditOnCreate = <T extends Auditoria>(entity: T): T => {
  const now = buildNow();
  entity.createdAt = entity.createdAt ?? now;
  entity.updatedAt = entity.updatedAt ?? now;
  entity.createdBy = entity.createdBy ?? DEFAULT_AUDIT_USER;
  entity.updatedBy = DEFAULT_AUDIT_USER;
  entity.isEnabled = entity.isEnabled ?? true;
  entity.isActive = entity.isActive ?? true;
  return entity;
};

export const withAuditOnUpdate = <T extends Auditoria>(entity: T): T => {
  entity.updatedAt = buildNow();
  entity.updatedBy = DEFAULT_AUDIT_USER;
  return entity;
};

