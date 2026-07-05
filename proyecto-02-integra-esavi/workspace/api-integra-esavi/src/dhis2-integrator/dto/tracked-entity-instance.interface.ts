import { Attribute } from './attribute.interface';
import { DataValue } from './events.interface';

export interface TrackedEntityInstancesResponse {
  trackedEntityInstances: TrackedEntityInstance[];
}

export interface TrackedEntityInstance {
  trackedEntityInstance: string;
  attributes: Attribute[];
  enrollments: Enrollment[];
}

export interface Enrollment {
  enrollment: string;
  program: string;
  status: string;
  orgUnit: string;
  enrollmentDate: string;
  incidentDate?: string;
  events: TrackerEvent[];
}

export interface TrackerEvent {
  event: string;
  programStage: string;
  status: string;
  eventDate: string;
  dataValues: DataValue[];
}

/**
 * Estructuras crudas del nuevo tracker API de DHIS2 (2.41+): /api/tracker/trackedEntities.
 * Se mapean a TrackedEntityInstance/Enrollment/TrackerEvent, que son el modelo
 * normalizado que consume el resto del servicio.
 */
export interface TrackerApiResponse {
  trackedEntities?: TrackerApiTrackedEntity[];
  // Versiones 2.36-2.40 del nuevo tracker API usan la clave "instances"
  instances?: TrackerApiTrackedEntity[];
}

export interface TrackerApiTrackedEntity {
  trackedEntity: string;
  attributes?: Attribute[];
  enrollments?: TrackerApiEnrollment[];
}

export interface TrackerApiEnrollment {
  enrollment: string;
  program: string;
  status: string;
  orgUnit: string;
  enrolledAt: string;
  occurredAt?: string;
  events?: TrackerApiEvent[];
}

export interface TrackerApiEvent {
  event: string;
  programStage: string;
  status: string;
  occurredAt: string;
  dataValues?: DataValue[];
}

export interface OrganisationUnit {
  id: string;
  name: string;
  code?: string;
}

export interface TrackedEntityAttributeMetadata {
  id: string;
  name: string;
  valueType?: string;
  optionSet?: { id: string };
}

export interface OptionSet {
  id: string;
  options: { code: string; name: string }[];
}
