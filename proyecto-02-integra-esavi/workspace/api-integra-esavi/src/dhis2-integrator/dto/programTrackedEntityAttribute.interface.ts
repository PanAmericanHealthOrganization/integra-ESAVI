export interface ProgramTrackedEntityAttributeResponse {
  programTrackedEntityAttributes: ProgramTrackedEntityAttribute[];
}

export interface ProgramTrackedEntityAttribute {
  name: string;
  id: string;
  displayName: string;
  sortOrder: number;
  trackedEntityAttribute: TrackedEntityAttribute;
}

export interface TrackedEntityAttribute {
  id: string;
}
