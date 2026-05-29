import { Auditoria } from 'src/integrator/entity';

const DEFAULT_AUDIT_USER = process.env.USUARIO_INSERTA_REGISTRO || 'SYSTEM';

const buildNow = () => new Date();

export const withAuditOnCreate = <T>(entity: T): T & Auditoria => {
  const now = buildNow();
  return {
    ...(entity as object),
    createdAt: (entity as Auditoria).createdAt ?? now,
    updatedAt: now,
    createdBy: (entity as Auditoria).createdBy ?? DEFAULT_AUDIT_USER,
    updatedBy: DEFAULT_AUDIT_USER,
    isEnabled: (entity as Auditoria).isEnabled ?? true,
    isActive: (entity as Auditoria).isActive ?? true,
  } as T & Auditoria;
};

export const withAuditOnUpdate = <T>(entity: T): T & Auditoria => {
  return {
    ...(entity as object),
    updatedAt: buildNow(),
    updatedBy: DEFAULT_AUDIT_USER,
  } as T & Auditoria;
};

